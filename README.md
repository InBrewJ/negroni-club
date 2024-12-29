# NQDI as reference app

## What is NQDI?

NQDI = 'Negroni Quality Discovery Index'

It's the place where Negronis can be categorised, ranked and shared across the world

## What is the stack?

- Expo (as a web / native iOS/Android UI framework)
- Golang + Gin + GORM as a golang centric REST API
- Cockroach DB (as a database)

## What is the Development Environment?

- Tool version management: Proto?
  - https://moonrepo.dev/docs/proto?q
  - Moon might also be worth a lookin' at:
    - https://moonrepo.dev/moon
- Nx (as a build system)
- bun 1.1.42
  - bunx and bun install take A VERY LONG TIME, maybe something like pnpm?
- go 1.23.3

## What are the Operating Environment tools?

- AWS (jason@urawizard account?)
    - VPC
    - ECS Fargate + ALB
    - Route53
    - CloudWatch + Alarms etc
    - SNS
- Cockroach DB Cloud
- Terraform CDK (Go bindings)
- GitHub Actions
- Expo

## What is the starting point?

- https://nx.dev/getting-started/intro
- https://nx.dev/nx-api/expo
- https://docs.expo.dev/workflow/web/

