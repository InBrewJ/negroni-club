# Negroni Club (NQDI)

Finally, it lives...

After much wrangling, find it here: https://negroni.club

- I wonder if I can turn off the Fargate service after between 6am - 5pm to save money?
  - After all, The Hour of Negroni is after 5pm (UK time, hehe)

## Tools

- AWS
- CockroachDB
- Go
- TypeScript
- Expo
- Playwright
- npm
- Nx
- Hashicorp Cloud
- EAS
- Docker Hub

## Auth0 tips

https://dev.to/ksivamuthu/auth0-jwt-middleware-in-go-gin-web-framework-37mj

## Install

```sh
npm install
```

## Run

Run all of these from the Nx project root:

### Database (hopefully local cockroachdb)

- https://www.cockroachlabs.com/docs/v24.3/install-cockroachdb-linux.html
- https://www.cockroachlabs.com/docs/v24.3/cockroach-start-single-node

```sh
# Coming soon...
## But probably a shell script for now...
## Is it possible to provision one locally using Docker?
## Or can we just use a postgres container? (probably)
### yes: https://www.cockroachlabs.com/docs/v24.3/install-cockroachdb-linux.html#install-docker
### But caveat emptor, apparently
```

### backend

```sh
npx nx serve rest-api
```

### UI

https://nx.dev/nx-api/expo
https://docs.expo.dev/workflow/web/

```sh
nx start nqdi
```

Mapping lib:

- https://github.com/teovillanueva/react-native-web-maps/blob/main/example/App.tsx
- https://teovillanueva.github.io/react-native-web-maps/

Use Expo to build a web bundle:

```sh
nx export nqdi --platform web
```

And for all platforms:

```sh
nx export nqdi
```

Install new packages (e.g. TanStack form / something expo focussed) like:

- go to the root level

```sh
npm i @tanstack/react-form
npm i install expo-location
```

## Deploy

All cdktf code (Go) is in the /infra directory

...it remains to be seen how this all works in practice

But in the sandbox, this is how to plan / deploy / destroy stuff:

```sh
npx nx plan rest-api-infra

# Note - DANGER!! auto approved!
npx nx deploy rest-api-infra

# Note - DANGER!! auto approved!
npx nx destroy rest-api-infra
```

## Submit to Android / iOS app stores

Last failure here:

https://expo.dev/accounts/inbrewj/projects/nqdi/builds/f0f69b13-312c-4fc4-bba7-2c754b60e322
