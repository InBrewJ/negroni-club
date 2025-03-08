package main

import (
	"log"

	crdb_cluster "cdk.tf/go/stack/generated/cockroachdb/cockroach/cluster"
	crdb "cdk.tf/go/stack/generated/cockroachdb/cockroach/provider"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
	"github.com/hashicorp/terraform-cdk-go/cdktf"
	"github.com/joho/godotenv"
)

func CockroachDbTest(scope constructs.Construct, id string) cdktf.TerraformStack {
	// provider added and go code generated with:
	// cdktf provider add cockroachdb/cockroach
	// correct import path for generated code living locally:
	// "cdk.tf/go/stack/generated/cockroachdb/cockroach/provider"
	//
	// props to this blog:
	// https://dev.to/aurelievache/learning-go-by-examples-part-12-deploy-go-apps-in-go-with-cdk-for-terraform-cdktf-533b

	env, err := godotenv.Read()

	if err != nil {
		log.Fatal("REST-API-INFRA ERROR: cannot load .env", err)
	}

	stack := cdktf.NewTerraformStack(scope, &id)

	crdb.NewCockroachProvider(stack, jsii.String("Cockroach-test"), &crdb.CockroachProviderConfig{
		Apikey: jsii.String(env["CRDB_API_KEY"]),
	})

	crdb_cluster.NewCluster(stack, jsii.String("crdb_cluster"), &crdb_cluster.ClusterConfig{
		Name:             jsii.String("nqdi-delete-me"),
		CloudProvider:    jsii.String("GCP"),
		Plan:             jsii.String("BASIC"),
		DeleteProtection: jsii.Bool(false),
		Regions:          &[]*crdb_cluster.ClusterRegions{{Name: jsii.String("us-east1")}},
		Serverless: &crdb_cluster.ClusterServerless{
			SpendLimit: jsii.Number(20.0),
		},
	})

	return stack
}
