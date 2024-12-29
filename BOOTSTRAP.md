## Commands used to create the dev environment

## Prerequisites

- Bun (note that Bun had all sorts of slowness / problems with cdktf, reverted to npm / pnpm)
  - https://bun.sh/docs/installation
- Go
  - https://go.dev/doc/install


## Nx / Expo

- https://nx.dev/nx-api/expo
- https://nx.dev/getting-started/installation


```sh
# This command ran very, very slowly on JibWorks Mobile
# https://github.com/oven-sh/bun/issues/4066
# Maybe bun isn't quite ready yet, damn
## NOPE
###########   bunx create-nx-workspace@latest --preset=expo --appName=nqdi
## NOPE
```

```sh
# And so back to npx + nx + expo
# Question: does this create some connection to nx cloud?
npx create-nx-workspace@latest --preset=expo --appName=nqdi
```

## Adding the GIN/GORM HTTP API as an Nx module

- https://github.com/nx-go/nx-go

```sh
npx nx add @nx-go/nx-go
npx nx g @nx-go/nx-go:application rest-api
```

## Terrform with Go CDK

- https://developer.hashicorp.com/terraform/tutorials/aws-get-started/install-cli
  - the gpg links were down on the day I tried so I opted for the 'download binary' thing
- https://developer.hashicorp.com/terraform/cdktf
- https://developer.hashicorp.com/terraform/tutorials/cdktf/cdktf-install?variants=cdk-language%3Ago

```sh
bun install --global cdktf-cli@latest
```

## Cockroach DB via Terrform CDK

- https://www.cockroachlabs.com/docs/cockroachcloud/provision-a-cluster-with-terraform
- https://registry.terraform.io/providers/cockroachdb/cockroach/latest
- https://registry.terraform.io/providers/cockroachdb/cockroach/latest/docs