# Get It On The App Stores — Capacitor Plan

## Context

The prototype is a vanilla-JS PWA (`index.html` + `server.js` + `sw.js`) with a custom HLC + LWW CRDT, WebAuthn passkeys, Leaflet maps, Geolocation, and a Node/SQLite backend on a VPS. We want it in the Apple App Store and the Google Play Store with the **least possible rewrite** and the **fastest possible update path**.

**Strategy: Capacitor wraps the existing PWA on both iOS and Android.** The web layer (your `index.html`) becomes the app's UI on both platforms. The native shell is small and stable; the web layer is what evolves day-to-day. Updates to the web layer can be pushed to your VPS without store review (loaded into the bundled webview at app launch), with a bundled fallback for offline.

iOS is the priority; Android comes along for the ride at marginal cost.

---

## Pre-flight (start these *now* — long lead times)

These are the items most likely to delay shipping if started late.

### P-1. Apple Developer Program enrollment
- Decide **individual vs. organization**. Organization shows the entity name in App Store ("Negroni Club Ltd") rather than your personal name; you cannot easily migrate later.
- If organization: obtain a **D-U-N-S number** (free from Dun & Bradstreet, ~1–4 weeks). Apple's verification then takes additional days.
- Pay $99/yr at https://developer.apple.com/programs/.
- Verify identity (the Apple-side step that varies in time).

### P-2. Google Play Console enrollment
- $25 one-time at https://play.google.com/console.
- Identity verification (days). Stricter for personal accounts since 2023.
- Note: new personal Play accounts now require **14 days of closed testing with 12+ testers** before production release. Plan for this — it's a fixed cost in calendar time.

### P-3. Brand and identity decisions (locks in early)
- **App name** (must be unique on both stores; check availability).
- **Bundle ID** / Application ID — convention is reverse-DNS, e.g., `uk.dryark.negroniclub`. **Cannot be changed after first submission** without making a new app entry.
- **App icon** — single 1024×1024 master, no transparency, no rounded corners. (Stores generate other sizes.)
- **Privacy policy URL** — required by both stores. A simple page on `boom.dryark.uk/privacy` is fine. Must be public and stable.
- **Support URL** — required for App Store; can be the same domain.

### P-4. Domain and Digital Asset Links (Android)
- For TWA-style associations and passkey domain binding, your site must serve `/.well-known/assetlinks.json`. Even if going pure Capacitor (not TWA), this is needed for passkeys to bind to `boom.dryark.uk` properly.
- Add the equivalent `/.well-known/apple-app-site-association` for iOS associated domains (passkey + universal links).

---

## Phase 1: Capacitor scaffolding

Set up the iOS and Android shells around the existing web app **without changing the existing prototype**. The PWA continues to ship as-is to the web.

### 1.1 Decide the source-of-truth layout
The simplest model: keep the existing `index.html`, `sw.js`, `manifest.json` exactly where they are. Capacitor is configured to either:
- **(A) Bundle them** into the native app at build time (point Capacitor's `webDir` at a copy of the static assets), or
- **(B) Load them from the live server** (`server: { url: 'https://boom.dryark.uk' }` in `capacitor.config.ts`), with the bundled copy as offline fallback.

**Recommendation: hybrid.** Bundle a known-good copy (so the app works offline and on first launch with no network), and use the bundled service-worker / cache strategy + a runtime check that pulls fresh assets from the server. This is the pattern that gets you "update without store review" *and* satisfies Apple Guideline 4.2 ("works without a network").

### 1.2 Install and initialise
Run from the project root:

```bash
npm install --save @capacitor/core @capacitor/cli
npm install --save @capacitor/ios @capacitor/android
npx cap init "Negroni Club" uk.dryark.negroniclub --web-dir=dist
```

- `dist` should be the directory containing your built static assets (`index.html`, `sw.js`, `manifest.json`, `vendor/leaflet`, etc.). Add a tiny build step in `package.json` that copies these from the project root into `dist/` so the existing dev workflow is untouched.

### 1.3 Add native platforms
```bash
npx cap add ios
npx cap add android
npx cap sync
```

This creates `ios/` and `android/` directories with the native projects. **Commit them** — they're part of your source. Each has its own README-style quirks; you'll learn them as you go.

### 1.4 Plugins to install
Match what the prototype already uses:

```bash
npm install @capacitor/geolocation        # replaces navigator.geolocation on native
npm install @capacitor/preferences        # replaces localStorage (optional but recommended)
npm install @capacitor/network            # online/offline detection for sync
npm install @capacitor/app                # app lifecycle (resume → trigger sync)
npm install @capacitor/push-notifications # only if you want push later
npm install @capacitor/share              # share-sheet for "share my pour"
```

For passkeys, see Phase 2.

---

## Phase 2: Adapt the web app for Capacitor

Goal: existing UI works inside the Capacitor webview with no functional regressions.

### 2.1 Service worker
Service workers run inside Capacitor on iOS 14+ and modern Android, but with quirks. The current `sw.js` cache strategy (cache-first for shell, network-first for feed) should keep working. Verify on device — if iOS misbehaves, switch the offline strategy to use Capacitor's `Filesystem` plugin + an in-app manifest of cached versions instead.

### 2.2 Geolocation
The browser `navigator.geolocation` call should be transparently shimmed via the Capacitor plugin if installed, but **the permissions prompts are native** and need declarations:
- iOS: add `NSLocationWhenInUseUsageDescription` to `ios/App/App/Info.plist` with a user-facing string ("Negroni Club uses your location to find pours nearby.").
- Android: `ACCESS_FINE_LOCATION` and/or `ACCESS_COARSE_LOCATION` in `android/app/src/main/AndroidManifest.xml`.

### 2.3 Storage / CRDT
The CRDT currently writes to `localStorage` under key `negroni.crdt.v1`. `localStorage` works inside Capacitor's webview, **but it is not durable across app updates on iOS in some cases** — Apple periodically purges WKWebView storage if the app is unused. Two options:

- **(A) Migrate to `@capacitor/preferences`** (Capacitor's wrapper around UserDefaults / SharedPreferences). Durable, but a code change in your CRDT persistence layer.
- **(B) Sync more aggressively to the server.** Your existing pull-on-load + push-on-write semantics already make this tolerable; you'd just reduce the debounce and rely on the server as the durable copy.

**Recommendation: do (B) first** (a few-line change in `index.html` near `schedulePush()`), then move to (A) only if you see real data loss in TestFlight.

### 2.4 WebAuthn / passkeys
Passkeys inside a Capacitor webview **work** on modern iOS (16.4+) and Android, but the system passkey UI has to be triggered via the platform's native APIs to bind to the app rather than to the webview's origin. Two paths:

- **(A) `@capacitor-community/passkeys` plugin** — wraps iOS `ASAuthorizationPlatformPublicKeyCredentialProvider` and Android `CredentialManager`. Ergonomic, but audit the code.
- **(B) Roll your own platform-channel plugin** — more work, but you control the surface.

Either way, the **associated domains** setup in P-4 is mandatory: iOS reads `apple-app-site-association`, Android reads `assetlinks.json`. Without those, the passkey will be created but bound to the webview origin (`https://boom.dryark.uk`), not to the app — which breaks the "log in with passkey" UX from a fresh install.

### 2.5 Maps / Leaflet
Leaflet runs fine in the webview, no change needed. Tiles come from your existing OSM provider. Add the tile-server hostname to your iOS `NSAppTransportSecurity` exceptions only if it's HTTP (it shouldn't be).

---

## Phase 3: iOS shell

### 3.1 Open in Xcode
```bash
npx cap open ios
```

### 3.2 Signing and capabilities
- Set the team to your Apple Developer account.
- Enable capabilities: **Associated Domains** (`webcredentials:boom.dryark.uk`, `applinks:boom.dryark.uk`), **Sign in with Apple Keychain** (for passkeys), **Push Notifications** if you add push.
- Bundle identifier matches `uk.dryark.negroniclub`.

### 3.3 Privacy Manifest (`PrivacyInfo.xcprivacy`)
Mandatory since 2024. Declare:
- Required-reason API usage (Capacitor handles its own — verify each plugin you install ships its own manifest).
- Data types collected (location, identifiers, possibly user content).
- Tracking domains (none, in your case).

If a third-party plugin is missing its manifest, App Store Connect will reject the build with a specific error pointing at the SDK. Open a PR or replace the plugin.

### 3.4 Info.plist strings
Each permission needs a user-facing rationale:
- `NSLocationWhenInUseUsageDescription`
- `NSCameraUsageDescription` (only if you add camera later)
- `NSFaceIDUsageDescription` (passkey-related on Face ID devices)

### 3.5 App icons and launch screen
Capacitor provides default placeholders. Replace with your master 1024×1024 icon (Xcode generates the asset catalog) and design a simple launch screen storyboard.

### 3.6 Test
- iOS Simulator: `npx cap run ios`. Verify CRDT round-trip, location prompt, passkey register/auth (Simulator supports passkeys via the iCloud Keychain stub).
- Real device: same, plus airplane-mode test for offline behaviour.

---

## Phase 4: Android shell

### 4.1 Open in Android Studio
```bash
npx cap open android
```

### 4.2 Signing key
Generate an **upload key** (separate from Play App Signing's per-app key, which Google manages):
```bash
keytool -genkey -v -keystore negroni-upload.keystore -alias upload -keyalg RSA -keysize 2048 -validity 10000
```
Store this file outside the repo, back it up. **Losing it makes Play Store updates impossible** without a manual key reset from Google.

### 4.3 Manifest
`android/app/src/main/AndroidManifest.xml`:
- Permissions: `ACCESS_FINE_LOCATION`, `INTERNET`, `ACCESS_NETWORK_STATE`.
- Add `<intent-filter>` for `https://boom.dryark.uk` (deep linking + passkey domain binding).

### 4.4 Target SDK
Play requires targeting a recent API level. As of 2026, target API 35 (Android 15). Capacitor templates default to a sane value; bump if needed.

### 4.5 Test
- Emulator + real device.
- Same checklist as iOS (CRDT, geo, passkey, offline).

---

## Phase 5: Test channels

### 5.1 TestFlight (iOS)
- Archive in Xcode → upload to App Store Connect.
- App Store Connect → My Apps → TestFlight tab → add internal testers (you, anyone on your team — up to 100, no review).
- For external testers (≤10,000), submit for "Beta App Review" — typically ~24h first time.
- TestFlight builds expire **90 days** after upload.

### 5.2 Play Internal Testing
- Bundle the AAB (Android App Bundle) via Android Studio → Build → Generate Signed Bundle.
- Play Console → Testing → Internal testing → upload AAB, add tester emails.
- Available within minutes after Play processes the build.
- Use this *immediately* to start the 14-day closed-testing clock if you need it for production release.

---

## Phase 6: First submission

### 6.1 App Store Connect (iOS)
- App information: name, subtitle, category (Food & Drink), age rating, primary language.
- Pricing: free.
- App Privacy: declare data collection types. Be honest — Apple cross-checks against the binary.
- Screenshots:
  - 6.7" iPhone (1290 × 2796) — required.
  - 6.1" iPhone — recommended.
  - iPad — only if you support iPad (default Capacitor app does; you can disable it in Xcode).
- Review information:
  - **Demo account credentials** — reviewers must be able to get past the passkey gate. Either provision a recovery-code-based bypass for the demo account, or document the recovery flow clearly in the review notes. **This is a common rejection cause.** Test it.
  - Notes explaining what the app does, what to look at first.
- Submit for review. Expect 1–3 days for a first submission, sometimes a week.

### 6.2 Play Console (Android)
- Store listing: short description, full description, feature graphic (1024 × 500), screenshots, icon.
- Data Safety form (Android equivalent of Apple's privacy nutrition labels).
- Content rating questionnaire.
- Target countries / pricing.
- App releases → Production → upload AAB → submit.
- Closed testing track must have run for 14 days with 12+ testers if this is a personal account. Plan accordingly.

### 6.3 Common rejection causes — pre-empt them
- Webview-only feel (Apple 4.2). Mitigation: passkeys + geolocation + offline + share sheet are all native enough to clear this.
- Missing demo account / unable-to-test-past-login. Mitigation: provide a demo account with the recovery code in the review notes.
- Privacy manifest gaps. Mitigation: build with `xcodebuild` warnings on, fix all SDK-related warnings.
- Crashes on launch. Mitigation: TestFlight on a real device first.

---

## Phase 7: Update strategy after launch

### 7.1 Web-layer updates (most updates) — no review
- Push to `boom.dryark.uk` as you do today (your existing `deploy.sh`).
- App fetches updated `index.html` on next launch (configure cache-busting in `sw.js` or via Capacitor's update check).
- **Latency: seconds.** No store involvement.
- **Constraint: no new native capabilities, no UX-changing updates significant enough that store screenshots become misleading.**

### 7.2 Native shell updates — quarterly-ish
You only need to re-submit the shell when:
- Adding a new Capacitor plugin (new permission, new native code).
- Bumping minimum iOS version.
- Privacy manifest format changes.
- Apple bumps required SDK / Xcode version (check annually around WWDC).
- Marketing material (screenshots, name) changes meaningfully.

For each shell update:
- TestFlight first.
- Phased release (1% → 100% over 7 days) for production rollout.
- For critical bugfixes, request **expedited review** with a clear reason.

### 7.3 Capacitor Live Updates (optional)
Ionic offers a paid "Live Updates" service for managed OTA pushes. **Skip it** for now — your existing model (web layer hosted on your VPS) achieves the same thing.

---

## Verification

When the build pipeline is wired up, verify end-to-end:

- [ ] `npx cap run ios` boots the existing UI on the iOS Simulator.
- [ ] `npx cap run android` boots the existing UI on an Android emulator.
- [ ] Geolocation prompt appears on first "Nearby" tap and the map centres correctly.
- [ ] Passkey register: create a passkey on the iOS device → log out → log back in with the same passkey. Confirm it lives in iCloud Keychain (System Settings → Passwords).
- [ ] Cross-device CRDT: write a pour on the iOS device, observe it appear on the existing PWA in a desktop browser pointed at the same server (and vice versa).
- [ ] Offline: airplane mode → write a pour → exit airplane mode → confirm the pour syncs to server within seconds.
- [ ] Web-layer hot update: push a trivial change to `boom.dryark.uk` (e.g., change a button label) → relaunch the iOS app → confirm the change appears with no store update.
- [ ] TestFlight build installs on a real iPhone via the TestFlight app.
- [ ] Play Internal track build installs on a real Android device via the Play Store app.
- [ ] App Store Connect / Play Console reviewers can complete the demo-account login flow.

---

## Risks and open questions

- **Passkey-on-fresh-install UX.** If a user installs the iOS app on a brand-new device, can they sign in *only* with a passkey? Confirm the recovery-code path is well-tested before submission, otherwise the App Store reviewer (on a clean test device) will get stuck.
- **WKWebView storage durability.** If iOS purges your localStorage, the CRDT will pull from server on next launch — but only if the user is logged in. Test the cold-launch-after-purge path.
- **Service worker on iOS Capacitor.** Worth a stress test: does `sw.js` actually serve cached assets on iOS when offline, or do we need to fall back to Capacitor's `Filesystem` cache?
- **Bundle ID lock-in.** `uk.dryark.negroniclub` is permanent. Sanity-check the name and TLD before P-3 closes.
- **Personal vs. organization Apple account.** The decision affects the visible developer name and is hard to migrate. Decide before P-1.

---

## Suggested order of operations (calendar view)

| Week | iOS | Android | Web |
|---|---|---|---|
| 0 | Start P-1 (DUNS if org), P-3 brand decisions | Start P-2 enrollment | Set up `/.well-known/` files (P-4) |
| 1 | Phase 1 + 2 scaffolding | Phase 1 + 2 scaffolding | (existing PWA continues) |
| 2 | Phase 3 (Xcode, signing, permissions) | Phase 4 (Studio, signing, manifest) | — |
| 2–3 | Phase 5 TestFlight to internal testers | Phase 5 Play Internal track | — |
| 3–4 | Iterate from internal feedback | Iterate, start 14-day closed testing | — |
| 4–5 | Phase 6 App Store submission | Wait out closed-testing window | — |
| 5–6 | App Store live (phased rollout) | Play production submission | — |
| Ongoing | Phase 7 (web hot-updates + occasional shell update) | Same | Same |

The critical path is Apple Developer enrollment + DUNS (week 0–2 lead time) and Play closed testing (14 days). Everything else fits inside those windows.
