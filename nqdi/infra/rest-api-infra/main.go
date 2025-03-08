package main

import (
	"cdk.tf/go/stack/flavours"
	"github.com/aws/jsii-runtime-go"
	"github.com/hashicorp/terraform-cdk-go/cdktf"
)

func main() {
	app := cdktf.NewApp(nil)
	// question:
	// what happens if all three of these
	// stacks are deployed at once?

	// Each cdktf stack has its own state file
	// ...and therefore needs its own remote backend
	// I therefore feel some sort of map coming on!

	// stack := SimpleInstanceStack(app, "simple_instance")
	stack := flavours.RestApiInfraFargate(app, "rest_api_fargate")
	// stack := CockroachDbTest(app, "cockroachdb_test")

	cdktf.NewRemoteBackend(stack, &cdktf.RemoteBackendConfig{
		Hostname:     jsii.String("app.terraform.io"),
		Organization: jsii.String("nqdi"),
		Workspaces:   cdktf.NewNamedRemoteWorkspace(jsii.String("rest-api-infra")),
	})

	app.Synth()
}
