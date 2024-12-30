package main

import (
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
	"github.com/hashicorp/terraform-cdk-go/cdktf"

	"log"

	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/instance"
	awsprovider "github.com/cdktf/cdktf-provider-aws-go/aws/v19/provider"
	"github.com/joho/godotenv"
)

func NewMyStack(scope constructs.Construct, id string) cdktf.TerraformStack {

	env, err := godotenv.Read()

	if err != nil {
		log.Fatal("REST-API-INFRA ERROR: cannot load .env", err)
	}

	stack := cdktf.NewTerraformStack(scope, &id)

	awsprovider.NewAwsProvider(stack, jsii.String("AWS"), &awsprovider.AwsProviderConfig{
		Region:    jsii.String(env["AWS_REGION"]),
		AccessKey: jsii.String(env["AWS_ACCESS_KEY_ID"]),
		SecretKey: jsii.String(env["AWS_SECRET_ACCESS_KEY"]),
	})

	instance := instance.NewInstance(stack, jsii.String("compute"), &instance.InstanceConfig{
		Ami:          jsii.String("ami-0a628e1e89aaedf80"),
		InstanceType: jsii.String("t2.micro"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("public_ip"), &cdktf.TerraformOutputConfig{
		Value: instance.PublicIp(),
	})

	return stack
}

func main() {
	app := cdktf.NewApp(nil)
	stack := NewMyStack(app, "aws_instance")
	cdktf.NewRemoteBackend(stack, &cdktf.RemoteBackendConfig{
		Hostname:     jsii.String("app.terraform.io"),
		Organization: jsii.String("nqdi"),
		Workspaces:   cdktf.NewNamedRemoteWorkspace(jsii.String("rest-api-infra")),
	})

	app.Synth()
}
