package main

import (
	"github.com/aws/jsii-runtime-go"
	"github.com/hashicorp/terraform-cdk-go/cdktf"
)

// API gateway / lambda goes here
// I guess in an ideal world there would be one lambda per route
// How does database connection pooling work?
//   - generally, put database connection code outside the handler
//   - if there is enough usage of a given lambda invocation, the connection
//     will reused
//
// Also see: Firebase for Go? https://medium.com/google-cloud/firebase-developing-serverless-functions-in-go-963cb011265d

func serverless() {
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
