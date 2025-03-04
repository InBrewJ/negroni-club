package main

import (
	"github.com/aws/jsii-runtime-go"
	"github.com/hashicorp/terraform-cdk-go/cdktf"
)

// A single EC2 / something on Ionos goes here
// Also see: OVHcloud or Vultr, they're also cheap
// Gem (deep)? research query:

/*
I want compute and storage for an early stage start up. I need the following resources for my app:

- static web hosting
- two servers, master and fallback, with 4gb ram and 4 vcpus each (storage can be minimal)

compare the pricing between Ionos (VPS and cloud), AWS EC2, GCP and any other low cost providers you can think of, e.g. Digital Ocean
*/

// imaging a slightly more complex, load balanced system, we might have two servers behind a load balancer. Vultr seems to offer the cheapest load balancer service but NOT the cheapest compute behind Ionos (tricky!)

func scrappy() {
	app := cdktf.NewApp(nil)
	// question:
	// what happens if all three of these
	// stacks are deployed at once?

	// stack := SimpleInstanceStack(app, "simple_instance")
	stack := RestApiInfraFargate(app, "rest_api_fargate")

	// stack := CockroachDbTest(app, "cockroachdb_test")

	cdktf.NewRemoteBackend(stack, &cdktf.RemoteBackendConfig{
		Hostname:     jsii.String("app.terraform.io"),
		Organization: jsii.String("nqdi"),
		Workspaces:   cdktf.NewNamedRemoteWorkspace(jsii.String("rest-api-infra")),
	})

	app.Synth()
}
