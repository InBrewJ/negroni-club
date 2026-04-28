// Negroni Club — prototype pod server.
// Identity: WebAuthn passkeys. The userHandle is the stable user id.
// Storage: SQLite. The pod is one CRDT op-log blob per user.

import express from "express";
import cookieParser from "cookie-parser";
import Database from "better-sqlite3";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT     = +(process.env.PORT || 3000);
const HOST     = process.env.HOST || "0.0.0.0";
const RP_NAME  = "Negroni Club";
const RP_ID    = process.env.RP_ID || "localhost";
const ORIGIN   = process.env.ORIGIN || `http://localhost:${PORT}`;
const DATA_DIR = process.env.DATA_DIR || __dirname;

// =============================================================
// DB
// =============================================================
const db = new Database(join(DATA_DIR, "data.db"));
db.pragma("journal_mode = WAL");
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    user_handle    TEXT PRIMARY KEY,         -- base64url, 32 bytes
    recovery_hash  TEXT NOT NULL,            -- scrypt(salt||hash), base64
    created_at     INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS credentials (
    credential_id  TEXT PRIMARY KEY,         -- base64url
    user_handle    TEXT NOT NULL,
    public_key     BLOB NOT NULL,            -- COSE
    counter        INTEGER NOT NULL,
    transports     TEXT,                     -- JSON
    device_label   TEXT,
    created_at     INTEGER NOT NULL,
    FOREIGN KEY (user_handle) REFERENCES users(user_handle)
  );
  CREATE TABLE IF NOT EXISTS pods (
    user_handle    TEXT PRIMARY KEY,
    ops_blob       TEXT NOT NULL DEFAULT '{"ops":[]}',
    updated_at     INTEGER NOT NULL,
    FOREIGN KEY (user_handle) REFERENCES users(user_handle)
  );
  CREATE TABLE IF NOT EXISTS sessions (
    sid            TEXT PRIMARY KEY,
    user_handle    TEXT NOT NULL,
    expires_at     INTEGER NOT NULL,
    FOREIGN KEY (user_handle) REFERENCES users(user_handle)
  );
  CREATE TABLE IF NOT EXISTS challenges (
    challenge      TEXT PRIMARY KEY,
    user_handle    TEXT,
    kind           TEXT NOT NULL,
    expires_at     INTEGER NOT NULL
  );
  -- The Club: a public, append-only, per-user-signed feed.
  -- A publication is an immutable snapshot of a pour at a moment in time.
  -- Editing the original pour in the user's private pod does NOT change this row.
  CREATE TABLE IF NOT EXISTS publications (
    pub_id          TEXT PRIMARY KEY,
    user_handle     TEXT NOT NULL,
    source_pour_id  TEXT,                  -- pour id in the user's pod (for idempotent re-publish)
    payload         TEXT NOT NULL,         -- JSON snapshot
    lat             REAL,
    lng             REAL,
    ts              INTEGER NOT NULL,
    retracted_at    INTEGER,               -- soft delete; visible only to author after retract
    FOREIGN KEY (user_handle) REFERENCES users(user_handle)
  );
  CREATE INDEX IF NOT EXISTS idx_pub_live_geo ON publications(lat, lng, ts) WHERE retracted_at IS NULL;
  CREATE INDEX IF NOT EXISTS idx_pub_live_ts  ON publications(ts)            WHERE retracted_at IS NULL;
  CREATE INDEX IF NOT EXISTS idx_pub_user     ON publications(user_handle, ts);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_pub_user_pour
    ON publications(user_handle, source_pour_id) WHERE retracted_at IS NULL AND source_pour_id IS NOT NULL;
  -- Cheap geocode cache: avoid pounding Nominatim for the same city repeatedly.
  CREATE TABLE IF NOT EXISTS city_cache (
    key      TEXT PRIMARY KEY,    -- normalised city string
    lat      REAL,
    lng      REAL,
    display  TEXT,
    fetched  INTEGER NOT NULL,
    ok       INTEGER NOT NULL     -- 1 = resolved, 0 = miss (negative cache, short TTL)
  );
`);

// =============================================================
// helpers
// =============================================================
const now = () => Date.now();
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const CHALLENGE_TTL_MS = 5 * 60 * 1000;

const newSid = () => crypto.randomBytes(24).toString("base64url");

const newRecoveryCode = () => {
  const bytes = crypto.randomBytes(15); // 120 bits
  const code = bytes.toString("base64url").replace(/[-_]/g, "").toUpperCase().slice(0, 20).padEnd(20, "X");
  return code.match(/.{1,5}/g).join("-"); // XXXXX-XXXXX-XXXXX-XXXXX
};
const normalizeCode = (s) => (s || "").replace(/[\s-]/g, "").toUpperCase().slice(0, 20);
const formatCode = (s) => normalizeCode(s).padEnd(20, "X").match(/.{1,5}/g).join("-");

const hashRecovery = (code) => {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(formatCode(code), salt, 64);
  return Buffer.concat([salt, hash]).toString("base64");
};
const verifyRecovery = (code, stored) => {
  if (!stored) return false;
  const buf = Buffer.from(stored, "base64");
  const salt = buf.subarray(0, 16);
  const hash = buf.subarray(16);
  const test = crypto.scryptSync(formatCode(code), salt, 64);
  return hash.length === test.length && crypto.timingSafeEqual(hash, test);
};

const labelFromUA = (ua = "") =>
  ua.includes("iPhone") ? "iPhone" :
  ua.includes("iPad")   ? "iPad"   :
  ua.includes("Android")? "Android":
  ua.includes("Mac")    ? "Mac"    :
  ua.includes("Windows")? "Windows":
  ua.includes("Linux")  ? "Linux"  : "browser";

const sessionCookie = () => ({
  httpOnly: true,
  sameSite: "lax",
  secure: ORIGIN.startsWith("https://"),
  maxAge: SESSION_TTL_MS,
  path: "/",
});

// In-memory recovery tokens (short-lived; survives long enough to register)
const recoveryTokens = new Map();
const newRecoveryToken = (userHandle) => {
  const tok = crypto.randomBytes(24).toString("base64url");
  recoveryTokens.set(tok, { userHandle, expiresAt: now() + CHALLENGE_TTL_MS });
  return tok;
};
const consumeRecoveryToken = (tok, userHandle) => {
  const r = recoveryTokens.get(tok);
  if (!r || r.expiresAt < now() || r.userHandle !== userHandle) return false;
  recoveryTokens.delete(tok);
  return true;
};

// =============================================================
// app
// =============================================================
const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

const getSession = (req) => {
  const sid = req.cookies?.nc_sid;
  if (!sid) return null;
  return db.prepare("SELECT * FROM sessions WHERE sid = ? AND expires_at > ?").get(sid, now());
};
const requireSession = (req, res, next) => {
  const s = getSession(req);
  if (!s) return res.status(401).json({ error: "unauthorized" });
  req.session = s;
  next();
};

const issueSession = (res, userHandle) => {
  const sid = newSid();
  db.prepare("INSERT INTO sessions (sid, user_handle, expires_at) VALUES (?, ?, ?)")
    .run(sid, userHandle, now() + SESSION_TTL_MS);
  res.cookie("nc_sid", sid, sessionCookie());
};

const sweep = () => {
  db.prepare("DELETE FROM challenges WHERE expires_at < ?").run(now());
  db.prepare("DELETE FROM sessions   WHERE expires_at < ?").run(now());
};
setInterval(sweep, 60_000);

// =============================================================
// WebAuthn — registration
// =============================================================
app.post("/webauthn/register/start", async (req, res) => {
  const session = getSession(req);
  let userHandle;

  if (session) {
    userHandle = session.user_handle;
  } else if (req.body?.recoveryUserHandle && req.body?.recoveryToken) {
    const ok = consumeRecoveryToken(req.body.recoveryToken, req.body.recoveryUserHandle);
    if (!ok) return res.status(403).json({ error: "invalid_recovery" });
    userHandle = req.body.recoveryUserHandle;
    // re-mint a token so the matching /finish call can prove it was a recovery flow
    const t = newRecoveryToken(userHandle);
    res.locals.recoveryReissue = t;
  } else {
    userHandle = crypto.randomBytes(32).toString("base64url");
  }

  const existing = db.prepare(
    "SELECT credential_id, transports FROM credentials WHERE user_handle = ?"
  ).all(userHandle);

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userID: Buffer.from(userHandle, "base64url"),
    userName: userHandle.slice(0, 10),
    userDisplayName: "Negroni Club member",
    attestationType: "none",
    excludeCredentials: existing.map(c => ({
      id: c.credential_id,
      transports: c.transports ? JSON.parse(c.transports) : undefined,
    })),
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
  });

  db.prepare(
    "INSERT INTO challenges (challenge, user_handle, kind, expires_at) VALUES (?, ?, ?, ?)"
  ).run(options.challenge, userHandle, "register", now() + CHALLENGE_TTL_MS);

  res.json({
    options,
    userHandle,
    isNewUser: !db.prepare("SELECT 1 FROM users WHERE user_handle = ?").get(userHandle),
    recoveryReissue: res.locals.recoveryReissue,
  });
});

app.post("/webauthn/register/finish", async (req, res) => {
  const { userHandle, response, recoveryToken } = req.body || {};
  if (!userHandle || !response) return res.status(400).json({ error: "bad_request" });

  const cr = db.prepare(
    "SELECT * FROM challenges WHERE user_handle = ? AND kind = 'register' AND expires_at > ? ORDER BY expires_at DESC LIMIT 1"
  ).get(userHandle, now());
  if (!cr) return res.status(400).json({ error: "no_challenge" });

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: cr.challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
  if (!verification.verified) return res.status(400).json({ error: "not_verified" });

  const { credential } = verification.registrationInfo;
  const exists = db.prepare("SELECT 1 FROM users WHERE user_handle = ?").get(userHandle);
  const session = getSession(req);
  const isAddingDevice = !!session;
  const isRecovery = !exists ? false : !session && !!recoveryToken && consumeRecoveryToken(recoveryToken, userHandle);

  let recoveryCode = null;

  if (!exists) {
    recoveryCode = newRecoveryCode();
    db.prepare("INSERT INTO users (user_handle, recovery_hash, created_at) VALUES (?, ?, ?)")
      .run(userHandle, hashRecovery(recoveryCode), now());
    db.prepare("INSERT INTO pods (user_handle, ops_blob, updated_at) VALUES (?, ?, ?)")
      .run(userHandle, '{"ops":[]}', now());
  } else if (!isAddingDevice && !isRecovery) {
    return res.status(403).json({ error: "user_exists_no_session" });
  }

  db.prepare(`
    INSERT INTO credentials (credential_id, user_handle, public_key, counter, transports, device_label, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    credential.id,
    userHandle,
    Buffer.from(credential.publicKey),
    credential.counter,
    JSON.stringify(credential.transports || []),
    labelFromUA(req.headers["user-agent"]),
    now()
  );

  db.prepare("DELETE FROM challenges WHERE challenge = ?").run(cr.challenge);

  issueSession(res, userHandle);
  res.json({ userHandle, recoveryCode, addedDevice: isAddingDevice, recovered: isRecovery });
});

// =============================================================
// WebAuthn — authentication
// =============================================================
app.post("/webauthn/authenticate/start", async (req, res) => {
  const options = await generateAuthenticationOptions({
    rpID: RP_ID,
    userVerification: "preferred",
    allowCredentials: [], // discoverable credentials
  });
  db.prepare(
    "INSERT INTO challenges (challenge, kind, expires_at) VALUES (?, ?, ?)"
  ).run(options.challenge, "authenticate", now() + CHALLENGE_TTL_MS);
  res.json({ options });
});

app.post("/webauthn/authenticate/finish", async (req, res) => {
  const { response } = req.body || {};
  if (!response?.response?.clientDataJSON) return res.status(400).json({ error: "bad_request" });

  let challenge;
  try {
    const cdj = JSON.parse(Buffer.from(response.response.clientDataJSON, "base64url").toString("utf8"));
    challenge = cdj.challenge;
  } catch { return res.status(400).json({ error: "bad_clientDataJSON" }); }

  const cr = db.prepare(
    "SELECT * FROM challenges WHERE challenge = ? AND kind = 'authenticate' AND expires_at > ?"
  ).get(challenge, now());
  if (!cr) return res.status(400).json({ error: "no_challenge" });

  const credRow = db.prepare("SELECT * FROM credentials WHERE credential_id = ?").get(response.id);
  if (!credRow) return res.status(404).json({ error: "credential_not_found" });

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      credential: {
        id: credRow.credential_id,
        publicKey: credRow.public_key,
        counter: credRow.counter,
        transports: credRow.transports ? JSON.parse(credRow.transports) : undefined,
      },
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
  if (!verification.verified) return res.status(400).json({ error: "not_verified" });

  db.prepare("UPDATE credentials SET counter = ? WHERE credential_id = ?")
    .run(verification.authenticationInfo.newCounter, credRow.credential_id);
  db.prepare("DELETE FROM challenges WHERE challenge = ?").run(challenge);

  issueSession(res, credRow.user_handle);
  res.json({ userHandle: credRow.user_handle });
});

// =============================================================
// Recovery (lost-passkey)
// =============================================================
app.post("/recover/start", (req, res) => {
  const code = req.body?.recoveryCode;
  if (!code) return res.status(400).json({ error: "code_required" });
  const users = db.prepare("SELECT user_handle, recovery_hash FROM users").all();
  for (const u of users) {
    if (verifyRecovery(code, u.recovery_hash)) {
      const token = newRecoveryToken(u.user_handle);
      return res.json({ userHandle: u.user_handle, recoveryToken: token });
    }
  }
  // generic delay to discourage brute force
  setTimeout(() => res.status(404).json({ error: "no_match" }), 600);
});

// =============================================================
// Session
// =============================================================
app.get("/me", (req, res) => {
  const s = getSession(req);
  if (!s) return res.json({ authed: false });
  const creds = db.prepare(
    "SELECT credential_id, device_label, created_at FROM credentials WHERE user_handle = ? ORDER BY created_at"
  ).all(s.user_handle);
  res.json({ authed: true, userHandle: s.user_handle, credentials: creds });
});

app.post("/logout", (req, res) => {
  const sid = req.cookies?.nc_sid;
  if (sid) db.prepare("DELETE FROM sessions WHERE sid = ?").run(sid);
  res.clearCookie("nc_sid");
  res.json({ ok: true });
});

app.delete("/credentials/:id", requireSession, (req, res) => {
  const userHandle = req.session.user_handle;
  const remaining = db.prepare(
    "SELECT COUNT(*) AS n FROM credentials WHERE user_handle = ?"
  ).get(userHandle).n;
  if (remaining <= 1) return res.status(400).json({ error: "would_lock_out" });
  const out = db.prepare("DELETE FROM credentials WHERE user_handle = ? AND credential_id = ?")
    .run(userHandle, req.params.id);
  res.json({ ok: out.changes > 0 });
});

// =============================================================
// Pod (CRDT blob)
// =============================================================
app.get("/pod", requireSession, (req, res) => {
  const row = db.prepare(
    "SELECT ops_blob, updated_at FROM pods WHERE user_handle = ?"
  ).get(req.session.user_handle);
  if (!row) return res.json({ ops: [], updated_at: 0 });
  try {
    const blob = JSON.parse(row.ops_blob);
    res.json({ ops: blob.ops || [], updated_at: row.updated_at });
  } catch {
    res.json({ ops: [], updated_at: 0 });
  }
});

// PUT replaces the blob with the client's union-merged ops.
// Safe under last-write-wins because both clients pulled first.
app.put("/pod", requireSession, (req, res) => {
  const { ops } = req.body || {};
  if (!Array.isArray(ops)) return res.status(400).json({ error: "ops_array_required" });
  db.prepare(`
    INSERT INTO pods (user_handle, ops_blob, updated_at) VALUES (?, ?, ?)
    ON CONFLICT(user_handle) DO UPDATE SET ops_blob = excluded.ops_blob, updated_at = excluded.updated_at
  `).run(req.session.user_handle, JSON.stringify({ ops }), now());
  res.json({ ok: true, count: ops.length });
});

// =============================================================
// The Club — public feed of published pours, geo-scoped reads
// =============================================================
const newPubId = () => crypto.randomBytes(8).toString("base64url");

// Nominatim geocoder for the "I don't have GPS, here's a city name" path.
// Cached aggressively in SQLite (positive: 90 days, negative miss: 1 day).
const GEOCODE_TTL_OK_MS   = 90 * 24 * 60 * 60 * 1000;
const GEOCODE_TTL_MISS_MS =      24 * 60 * 60 * 1000;
const geoKey = (s) => String(s || "").trim().toLowerCase().replace(/\s+/g, " ");

async function geocodeCity(city) {
  const key = geoKey(city);
  if (!key) return null;
  const cached = db.prepare("SELECT * FROM city_cache WHERE key = ?").get(key);
  if (cached) {
    const ttl = cached.ok ? GEOCODE_TTL_OK_MS : GEOCODE_TTL_MISS_MS;
    if (now() - cached.fetched < ttl) {
      return cached.ok ? { lat: cached.lat, lng: cached.lng, display: cached.display } : null;
    }
  }
  let resolved = null;
  try {
    const url = "https://nominatim.openstreetmap.org/search?" + new URLSearchParams({
      q: city, format: "jsonv2", limit: "1", addressdetails: "0",
    });
    const r = await fetch(url, {
      headers: { "user-agent": "negroni-club-prototype/0.1 (jason@occasio.cc)" },
    });
    if (r.ok) {
      const arr = await r.json();
      if (arr?.[0]) {
        resolved = {
          lat: parseFloat(arr[0].lat),
          lng: parseFloat(arr[0].lon),
          display: String(arr[0].display_name || "").slice(0, 200),
        };
      }
    }
  } catch { /* network blip — fall through to negative cache */ }

  db.prepare(`
    INSERT INTO city_cache (key, lat, lng, display, fetched, ok)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET
      lat = excluded.lat, lng = excluded.lng,
      display = excluded.display, fetched = excluded.fetched, ok = excluded.ok
  `).run(key,
        resolved?.lat ?? null, resolved?.lng ?? null, resolved?.display ?? null,
        now(), resolved ? 1 : 0);
  return resolved;
}

const bbox = (lat, lng, radiusKm) => {
  const dLat = radiusKm / 111;
  const dLng = radiusKm / (111 * Math.cos(lat * Math.PI / 180) || 1);
  return { minLat: lat - dLat, maxLat: lat + dLat, minLng: lng - dLng, maxLng: lng + dLng };
};
const haversineKm = (a, b) => {
  const R = 6371, toR = x => x * Math.PI / 180;
  const dLat = toR(b.lat - a.lat), dLng = toR(b.lng - a.lng);
  const x = Math.sin(dLat/2)**2 + Math.cos(toR(a.lat))*Math.cos(toR(b.lat))*Math.sin(dLng/2)**2;
  return 2 * R * Math.asin(Math.sqrt(x));
};

const sanitizePayload = (raw = {}) => ({
  venue:      String(raw.venue || "").slice(0, 200),
  city:       String(raw.city  || "").slice(0, 200),
  variant:    String(raw.variant || "classic").slice(0, 32),
  vessel:     String(raw.vessel  || "rocks").slice(0, 32),
  bitter:     Math.max(0, Math.min(100, +raw.bitter     || 0)),
  sweet:      Math.max(0, Math.min(100, +raw.sweet      || 0)),
  balance:    Math.max(0, Math.min(100, +raw.balance    || 0)),
  complexity: Math.max(0, Math.min(100, +raw.complexity || 0)),
  note:       String(raw.note || "").slice(0, 1000),
  ts:         Number.isFinite(+raw.ts) ? +raw.ts : now(),
});

// POST /club/publish — auth required. Idempotent on (user_handle, source_pour_id).
// If lat/lng are missing, geocode the city via Nominatim (cached).
app.post("/club/publish", requireSession, async (req, res) => {
  const { pourId, payload } = req.body || {};
  if (!payload || typeof payload !== "object") return res.status(400).json({ error: "payload_required" });
  if (!pourId || typeof pourId !== "string")   return res.status(400).json({ error: "pourId_required" });

  const userHandle = req.session.user_handle;
  const existing = db.prepare(`
    SELECT pub_id FROM publications
    WHERE user_handle = ? AND source_pour_id = ? AND retracted_at IS NULL
  `).get(userHandle, pourId);
  if (existing) return res.json({ pubId: existing.pub_id, reused: true });

  const clean = sanitizePayload(payload);
  let lat = Number.isFinite(+payload.lat) ? +payload.lat : null;
  let lng = Number.isFinite(+payload.lng) ? +payload.lng : null;
  let geocoded = false;

  if ((lat == null || lng == null) && clean.city) {
    const hit = await geocodeCity(clean.city);
    if (hit) { lat = hit.lat; lng = hit.lng; geocoded = true; }
  }

  if (lat == null || lng == null) {
    return res.status(422).json({ error: "no_location",
      detail: "Provide either GPS coordinates or a city we can geocode." });
  }

  const pubId = newPubId();
  db.prepare(`
    INSERT INTO publications (pub_id, user_handle, source_pour_id, payload, lat, lng, ts)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(pubId, userHandle, pourId, JSON.stringify(clean), lat, lng, now());

  res.json({ pubId, ts: now(), reused: false, geocoded, lat, lng });
});

// GET /club/feed?lat=&lng=&radius=&since=&limit=  — public.
app.get("/club/feed", (req, res) => {
  const lat = Number.parseFloat(req.query.lat);
  const lng = Number.parseFloat(req.query.lng);
  const hasGeo = Number.isFinite(lat) && Number.isFinite(lng);
  const radius = Math.max(0.1, Math.min(2000, Number.parseFloat(req.query.radius) || 25));
  const limit  = Math.max(1,   Math.min(100,  Number.parseInt(req.query.limit, 10)  || 50));
  const since  = Math.max(0,   Number.parseInt(req.query.since, 10) || 0);

  let rows;
  if (hasGeo) {
    const b = bbox(lat, lng, radius);
    rows = db.prepare(`
      SELECT pub_id, user_handle, payload, lat, lng, ts FROM publications
      WHERE retracted_at IS NULL
        AND lat BETWEEN ? AND ? AND lng BETWEEN ? AND ?
        AND ts >= ?
      ORDER BY ts DESC
      LIMIT ?
    `).all(b.minLat, b.maxLat, b.minLng, b.maxLng, since, limit * 4);
    rows = rows
      .map(r => ({ ...r, distKm: haversineKm({ lat, lng }, r) }))
      .filter(r => r.distKm <= radius)
      .sort((a, b) => a.distKm - b.distKm)
      .slice(0, limit);
  } else {
    rows = db.prepare(`
      SELECT pub_id, user_handle, payload, lat, lng, ts FROM publications
      WHERE retracted_at IS NULL AND ts >= ?
      ORDER BY ts DESC
      LIMIT ?
    `).all(since, limit);
  }

  res.json({
    items: rows.map(r => ({
      pubId: r.pub_id,
      userHandle: r.user_handle,
      ts: r.ts,
      lat: r.lat,
      lng: r.lng,
      distKm: r.distKm,
      payload: JSON.parse(r.payload),
    })),
  });
});

// GET /club/feed/mine — auth required.
app.get("/club/feed/mine", requireSession, (req, res) => {
  const rows = db.prepare(`
    SELECT pub_id, source_pour_id, payload, lat, lng, ts, retracted_at FROM publications
    WHERE user_handle = ? ORDER BY ts DESC LIMIT 200
  `).all(req.session.user_handle);
  res.json({
    items: rows.map(r => ({
      pubId: r.pub_id,
      sourcePourId: r.source_pour_id,
      ts: r.ts,
      retractedAt: r.retracted_at,
      lat: r.lat,
      lng: r.lng,
      payload: JSON.parse(r.payload),
    })),
  });
});

// DELETE /club/feed/:pubId — owner only, soft delete.
app.delete("/club/feed/:pubId", requireSession, (req, res) => {
  const r = db.prepare(`
    UPDATE publications SET retracted_at = ?
    WHERE pub_id = ? AND user_handle = ? AND retracted_at IS NULL
  `).run(now(), req.params.pubId, req.session.user_handle);
  if (r.changes === 0) return res.status(404).json({ error: "not_found_or_not_owner" });
  res.json({ ok: true });
});

// =============================================================
// static (index.html, etc.)
// =============================================================
app.use("/vendor", express.static(
  join(__dirname, "node_modules/@simplewebauthn/browser/dist/bundle"),
  { maxAge: "1d", immutable: false }
));
app.use("/vendor/leaflet", express.static(
  join(__dirname, "node_modules/leaflet/dist"),
  { maxAge: "1d" }
));
app.use(express.static(__dirname, {
  extensions: ["html"],
  setHeaders: (res, path) => {
    if (path.endsWith(".html")) res.setHeader("Cache-Control", "no-cache");
  },
}));

app.listen(PORT, HOST, () => {
  console.log(`Negroni Club running on ${ORIGIN}`);
  console.log(`  bind  = ${HOST}:${PORT}`);
  console.log(`  RP_ID = ${RP_ID}`);
  console.log(`  data  = ${join(DATA_DIR, "data.db")}`);
});
