# Negroni Club (NQDI) as reference app

## What is NQDI?

Negroni Club = a place on the web to discover and share the greatest Negronis in the world

NQDI = 'Negroni Quality Discovery Index'

NQDI is the data and backend that informs the club. As time goes on, more things may be built on top of NQDI, not just Negroni Club!

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
  - This might just be a PopOS / Ubuntu 20.04 thing, but who knows. Risky!
- go 1.23.3

## What are the Operating Environment tools?

- AWS (jason@urawizard account?)
  - VPC
  - ECS Fargate + ALB
  - Route53
  - CloudWatch + Alarms etc
  - SNS
- Cockroach DB Cloud
- Terraform CDK (cdktf / Go bindings)
- GitHub Actions
- Expo

## What is the starting point?

- https://nx.dev/getting-started/intro
- https://nx.dev/nx-api/expo
- https://docs.expo.dev/workflow/web/
