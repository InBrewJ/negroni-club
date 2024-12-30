# cdktf (Go) for the rest-api

Derived from quickstart tutorial:

https://developer.hashicorp.com/terraform/tutorials/cdktf/cdktf-install?variants=cdk-language%3Ago#install-cdktf

## Prereqs

- Node
- npm
- cdktf-cli@latest (npm module)

```sh
npm install --global cdktf-cli@latest
```

- terraform CLI
- The will to explore (fare foward)

## Manual commands

init

```sh
# For the Docker tutorial only
cdktf init --template=go --providers=kreuzwerker/docker --local
# then a go mod tidy to install stuff
go mod tidy
```

deploy

```sh
cdktf deploy
```

## Nx commands

(see project.json)

## Next steps for (rest-api) cloud infra

Follow: https://developer.hashicorp.com/terraform/tutorials/cdktf/cdktf-build?variants=cdk-language%3Ago

- Build rest api as Docker container
- ECS Fargate + ALB (single task, low resources)
- Route53 + ACM for ALB

## Docs for cdktf aws provider

- https://github.com/cdktf/cdktf-provider-aws/blob/main/docs/API.go.md

## Next steps after that

A separate cdktf stacks that deploys the same backend to a tiny Digital Ocean droplet (fun)

This will at least provde that one infra directory can deploy to two different operating environments
