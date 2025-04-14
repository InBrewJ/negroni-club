# Negroni Club (NQDI) as reference app

## What is NQDI?

Negroni Club = a place to discover and share the greatest Negronis in the world

NQDI = 'Negroni Quality Discovery Index'

NQDI is the data and backend that informs the club. As time goes on, more things may be built on top of NQDI, not just Negroni Club!

## What is the stack?

For the simple / core three tier client / server approach:

- Expo + TypeScript (as a web / native iOS/Android UI framework)
- Golang + Gin + GORM as a golang centric REST API (and any workers, etc)
- Cockroach DB (as a database)

## What is the Development Environment?

- Tool version management: Proto?
  - https://moonrepo.dev/docs/proto?q
  - Moon might also be worth a lookin' at:
    - https://moonrepo.dev/moon
- node v22.12.0
- npm v10.9.0
- Nx (as a build system)
- go 1.23.3
- Terraform CDK (cdktf / Go bindings)

## What are the Operating Environment tools?

- Cloudflare (for DNS, geolocation based bot catching and apex -> www. 301 rerouting)
- Compute hosting:
  - AWS (urawizard account)
    - VPC
    - ECS Fargate + ALB
    - Route53
    - CloudWatch + Alarms etc
    - SNS
  - OR
  - Vultr
    - One load balancer
    - Two conservative compute nodes
    - Associated firewalls / static IPs, etc
- Cockroach DB Cloud
- Hashicorp cloud platform (not strictly necessary, just easy)
- GitHub Actions
- Expo (EAS) for building Android and iOS apps

## What is the starting point?

- https://nx.dev/getting-started/intro
- https://nx.dev/nx-api/expo
- https://docs.expo.dev/workflow/web/
