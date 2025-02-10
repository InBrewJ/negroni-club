package main

import (
	"fmt"

	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
	"github.com/hashicorp/terraform-cdk-go/cdktf"

	"log"

	crdb_cluster "cdk.tf/go/stack/generated/cockroachdb/cockroach/cluster"
	crdb "cdk.tf/go/stack/generated/cockroachdb/cockroach/provider"
	acmcertificate "github.com/cdktf/cdktf-provider-aws-go/aws/v19/acmcertificate"
	alb "github.com/cdktf/cdktf-provider-aws-go/aws/v19/alb"
	alblistener "github.com/cdktf/cdktf-provider-aws-go/aws/v19/alblistener"
	albtargetgroup "github.com/cdktf/cdktf-provider-aws-go/aws/v19/albtargetgroup"
	cloudwatchloggroup "github.com/cdktf/cdktf-provider-aws-go/aws/v19/cloudwatchloggroup"
	awsecs "github.com/cdktf/cdktf-provider-aws-go/aws/v19/ecscluster"
	ecsservice "github.com/cdktf/cdktf-provider-aws-go/aws/v19/ecsservice"
	ecstaskdefinition "github.com/cdktf/cdktf-provider-aws-go/aws/v19/ecstaskdefinition"
	eip "github.com/cdktf/cdktf-provider-aws-go/aws/v19/eip"
	iampolicyattachment "github.com/cdktf/cdktf-provider-aws-go/aws/v19/iampolicyattachment"
	iamrole "github.com/cdktf/cdktf-provider-aws-go/aws/v19/iamrole"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/instance"
	awsec2 "github.com/cdktf/cdktf-provider-aws-go/aws/v19/internetgateway"
	natgateway "github.com/cdktf/cdktf-provider-aws-go/aws/v19/natgateway"
	awsprovider "github.com/cdktf/cdktf-provider-aws-go/aws/v19/provider"
	route "github.com/cdktf/cdktf-provider-aws-go/aws/v19/route"
	routetable "github.com/cdktf/cdktf-provider-aws-go/aws/v19/routetable"
	routetableassociation "github.com/cdktf/cdktf-provider-aws-go/aws/v19/routetableassociation"
	sg "github.com/cdktf/cdktf-provider-aws-go/aws/v19/securitygroup"
	subnet "github.com/cdktf/cdktf-provider-aws-go/aws/v19/subnet"
	awsvpc "github.com/cdktf/cdktf-provider-aws-go/aws/v19/vpc"
	securitygroupegressrule "github.com/cdktf/cdktf-provider-aws-go/aws/v19/vpcsecuritygroupegressrule"
	securitygroupingressrule "github.com/cdktf/cdktf-provider-aws-go/aws/v19/vpcsecuritygroupingressrule"
	"github.com/joho/godotenv"
)

func SimpleInstanceStack(scope constructs.Construct, id string) cdktf.TerraformStack {

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

func RestApiInfraFargate(scope constructs.Construct, id string) cdktf.TerraformStack {

	/*

		See nqdi/infra/rest-api-infra/last_cdktf_error.log for clues towards a fix or two

		Remember the docs!
		https://github.com/cdktf/cdktf-provider-aws/blob/main/docs/API.go.md

	*/

	// next steps for Fargate network troubleshooting:
	// https://gemini.google.com/app/48e15c479204a62b
	// - launch small ec2 in the same subnet, check out networking stuff
	//   - subnet A: subnet-091c2cc8dd926d5f7
	//   - subnet B: subnet-0fa174553ddd5c047
	// - Does docker hub need auth for this public image? Is it private?
	// - VPC DNS Resolver? Surely that's okay?
	// - NAT gateway security group -> needs inbound traffic on port 443, sgs in general

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

	// (Optional) NAT gateway for outbound internet access from private subnets
	vpc := awsvpc.NewVpc(stack, jsii.String("nqdi-vpc"), &awsvpc.VpcConfig{
		CidrBlock: jsii.String("10.0.0.0/16"),
		Tags:      &map[string]*string{"Name": jsii.String("nqdi-vpc")},
	})

	igw := awsec2.NewInternetGateway(stack, jsii.String("nqdi-igw"), &awsec2.InternetGatewayConfig{
		Tags:  &map[string]*string{"Name": jsii.String("nqdi-igw")},
		VpcId: vpc.Id(),
	})

	igw.Count()

	// private vs public subnet
	// public: route table has a path to an internet gateway, public IPs exist
	// private: route table might have path to NAT gateway, mostly private IPs exist

	// public subnet should be attached to NAT / Internet Gateways
	publicSubnet := subnet.NewSubnet(stack, jsii.String("nqdi-public-subnet"), &subnet.SubnetConfig{
		VpcId:            vpc.Id(),
		CidrBlock:        jsii.String("10.0.1.0/24"),
		AvailabilityZone: jsii.String(env["AWS_REGION"] + "a"),
	})

	publicSubnet2 := subnet.NewSubnet(stack, jsii.String("nqdi-public-subnet2"), &subnet.SubnetConfig{
		VpcId:            vpc.Id(),
		CidrBlock:        jsii.String("10.0.2.0/24"),
		AvailabilityZone: jsii.String(env["AWS_REGION"] + "b"),
	})

	publicRouteTable := routetable.NewRouteTable(stack, jsii.String("nqdi-public-route-table"), &routetable.RouteTableConfig{
		VpcId: vpc.Id(),
		Tags:  &map[string]*string{"Name": jsii.String("nqdi-public-subnet-route-table")},
	})

	route.NewRoute(stack, jsii.String("nqdi-public-route"), &route.RouteConfig{
		RouteTableId:         publicRouteTable.Id(),
		DestinationCidrBlock: jsii.String("0.0.0.0/0"),
		GatewayId:            igw.Id(),
	})

	routetableassociation.NewRouteTableAssociation(stack, jsii.String("nqdi-public-route-table-association-1"), &routetableassociation.RouteTableAssociationConfig{
		SubnetId:     publicSubnet.Id(),
		RouteTableId: publicRouteTable.Id(),
	})

	routetableassociation.NewRouteTableAssociation(stack, jsii.String("nqdi-public-route-table-association-2"), &routetableassociation.RouteTableAssociationConfig{
		SubnetId:     publicSubnet2.Id(),
		RouteTableId: publicRouteTable.Id(),
	})

	// see https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/eip
	// for use of the Domain config
	eip := eip.NewEip(stack, jsii.String("nqdi-nat-eip"), &eip.EipConfig{
		Vpc: jsii.Bool(true),
	})

	natGateway := natgateway.NewNatGateway(stack, jsii.String("nqdi-nat-gateway"), &natgateway.NatGatewayConfig{
		AllocationId: eip.Id(),
		SubnetId:     publicSubnet.Id(),
		Tags:         &map[string]*string{"Name": jsii.String("nqdi-nat-gateway-public-subnet")},
	})

	// Private subnets for internal services etc
	privateSubnet := subnet.NewSubnet(stack, jsii.String("nqdi-private-subnet"), &subnet.SubnetConfig{
		VpcId:            vpc.Id(),
		CidrBlock:        jsii.String("10.0.3.0/24"),
		AvailabilityZone: jsii.String(env["AWS_REGION"] + "a"),
	})

	privateSubnet2 := subnet.NewSubnet(stack, jsii.String("nqdi-private-subnet2"), &subnet.SubnetConfig{
		VpcId:            vpc.Id(),
		CidrBlock:        jsii.String("10.0.4.0/24"),
		AvailabilityZone: jsii.String(env["AWS_REGION"] + "b"),
	})

	privateRouteTable := routetable.NewRouteTable(stack, jsii.String("nqdi-private-route-table"), &routetable.RouteTableConfig{
		VpcId: vpc.Id(),
		Tags:  &map[string]*string{"Name": jsii.String("nqdi-private-subnet-route-table")},
	})

	route.NewRoute(stack, jsii.String("nqdi-private-route"), &route.RouteConfig{
		RouteTableId:         privateRouteTable.Id(),
		DestinationCidrBlock: jsii.String("0.0.0.0/0"),
		NatGatewayId:         natGateway.Id(),
	})

	routetableassociation.NewRouteTableAssociation(stack, jsii.String("nqdi-private-route-table-association-1"), &routetableassociation.RouteTableAssociationConfig{
		SubnetId:     privateSubnet.Id(),
		RouteTableId: privateRouteTable.Id(),
	})

	routetableassociation.NewRouteTableAssociation(stack, jsii.String("nqdi-private-route-table-association-2"), &routetableassociation.RouteTableAssociationConfig{
		SubnetId:     privateSubnet2.Id(),
		RouteTableId: privateRouteTable.Id(),
	})

	// ECR Repo (You'll need to add awsecr as a dependency)
	// ecrRepo := awsecr.NewRepository(stack, jsii.String("golang-api-repo"), &awsecr.RepositoryConfig{})

	// ECR Image for Golang service (replace with your actual image building logic)
	// You'll likely want to use a CI/CD pipeline to build and push your image
	// ecrImage := awsecr.NewImage(stack, jsii.String("golang-api-image"), &awsecr.ImageConfig{
	// 	RepositoryName: ecrRepo.Name(),
	//  // ... (configure image build and push)
	// })

	// Security group(s?)

	alb_security_group := sg.NewSecurityGroup(stack, jsii.String("nqdi-alb-sg"), &sg.SecurityGroupConfig{
		VpcId:       vpc.Id(),
		Description: jsii.String("Allow ingress to ALB 80 and 443"),
		Name:        jsii.String("nqdi-alb-sg"),
	})

	alb_sg_ingress_rule_http := securitygroupingressrule.NewVpcSecurityGroupIngressRule(stack, jsii.String("nqdi-alb-sb-ingress-rule-http"), &securitygroupingressrule.VpcSecurityGroupIngressRuleConfig{
		SecurityGroupId: alb_security_group.Id(),
		FromPort:        jsii.Number(80),
		ToPort:          jsii.Number(80),
		IpProtocol:      jsii.String("tcp"),
		CidrIpv4:        jsii.String("0.0.0.0/0"),
	})

	alb_sg_ingress_rule_https := securitygroupingressrule.NewVpcSecurityGroupIngressRule(stack, jsii.String("nqdi-alb-sb-ingress-rule-https"), &securitygroupingressrule.VpcSecurityGroupIngressRuleConfig{
		SecurityGroupId: alb_security_group.Id(),
		FromPort:        jsii.Number(443),
		ToPort:          jsii.Number(443),
		IpProtocol:      jsii.String("tcp"),
		CidrIpv4:        jsii.String("0.0.0.0/0"),
	})

	alb_sg_ingress_rule_http.Count()
	alb_sg_ingress_rule_https.Count()

	securitygroupegressrule.NewVpcSecurityGroupEgressRule(stack, jsii.String("nqdi-alb-sb-ingress-rule-internet-out"), &securitygroupegressrule.VpcSecurityGroupEgressRuleConfig{
		SecurityGroupId: alb_security_group.Id(),
		FromPort:        jsii.Number(1),
		ToPort:          jsii.Number(65535),
		IpProtocol:      jsii.String("tcp"),
		CidrIpv4:        jsii.String("0.0.0.0/0"),
	})

	// ALB
	alb := alb.NewAlb(stack, jsii.String("nqdi-alb"), &alb.AlbConfig{
		Name:             jsii.String("nqdi-alb"),
		Internal:         jsii.Bool(false),
		LoadBalancerType: jsii.String("application"),
		SecurityGroups:   &[]*string{alb_security_group.Id()},
		Subnets:          &[]*string{publicSubnet.Id(), publicSubnet2.Id()},
	})

	targetGroup := albtargetgroup.NewAlbTargetGroup(stack, jsii.String("nqdi-alb-target-group"), &albtargetgroup.AlbTargetGroupConfig{
		Name:       jsii.String("nqdi-alb-target-group"),
		Port:       jsii.Number(80),
		Protocol:   jsii.String("HTTP"),
		VpcId:      vpc.Id(),
		TargetType: jsii.String("ip"),
		// Health check configuration
		HealthCheck: &albtargetgroup.AlbTargetGroupHealthCheck{
			Path:               jsii.String("/ping"), // Replace with your health check path
			Protocol:           jsii.String("HTTP"),
			Matcher:            jsii.String("200"),
			Interval:           jsii.Number(30),
			HealthyThreshold:   jsii.Number(2),
			UnhealthyThreshold: jsii.Number(2),
		},
	})

	listener_http := alblistener.NewAlbListener(stack, jsii.String("nqdi-alb-listener-http"), &alblistener.AlbListenerConfig{
		LoadBalancerArn: alb.Arn(),
		Port:            jsii.Number(80),
		Protocol:        jsii.String("HTTP"),
		DefaultAction: &[]*alblistener.AlbListenerDefaultAction{
			{Type: jsii.String("forward"),
				TargetGroupArn: targetGroup.Arn()},
		},
	})

	// api.nqdi.urawizard.com cert
	// might not work for the moment, needs DNS approval on the Ionos side

	// v nice site for checking DNS propogation status
	// https://www.whatsmydns.net/#CNAME/api.nqdi.urawizard.com

	restApiCert := acmcertificate.NewAcmCertificate(stack, jsii.String("api-nqdi-cert"), &acmcertificate.AcmCertificateConfig{
		DomainName:       jsii.String("api.nqdi.urawizard.com"),
		ValidationMethod: jsii.String("DNS"),
		Lifecycle: &cdktf.TerraformResourceLifecycle{
			// see docs
			// https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/acm_certificate
			CreateBeforeDestroy: jsii.Bool(true),
		},
	})

	listener_https := alblistener.NewAlbListener(stack, jsii.String("nqdi-alb-listener-https"), &alblistener.AlbListenerConfig{
		LoadBalancerArn: alb.Arn(),
		Port:            jsii.Number(443),
		Protocol:        jsii.String("HTTPS"),
		CertificateArn:  restApiCert.Arn(),
		DefaultAction: &[]*alblistener.AlbListenerDefaultAction{
			{Type: jsii.String("forward"),
				TargetGroupArn: targetGroup.Arn()},
		},
	})

	listener_http.Count()
	listener_https.Count()

	// ECS Cluster
	cluster := awsecs.NewEcsCluster(stack, jsii.String("nqdi-ecs-cluster"), &awsecs.EcsClusterConfig{
		Name: jsii.String("nqdi-ecs-cluster"),
	})

	// IAM Role for ECS Task Execution
	executionRole := iamrole.NewIamRole(stack, jsii.String("ecsTaskExecutionRole"), &iamrole.IamRoleConfig{
		Name: jsii.String("ecsTaskExecutionRole"),
		AssumeRolePolicy: jsii.String(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Action": "sts:AssumeRole",
					"Principal": {
						"Service": "ecs-tasks.amazonaws.com"
					},
					"Effect": "Allow",
					"Sid": ""
				}
			]
		}`),
	})

	iampolicyattachment.NewIamPolicyAttachment(stack, jsii.String("AmazonECSTaskExecutionRolePolicy"), &iampolicyattachment.IamPolicyAttachmentConfig{
		Roles:     &[]*string{executionRole.Name()},
		Name:      jsii.String("nqdi-ecs-exec-policy-attachment"),
		PolicyArn: jsii.String("arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"),
	})

	// IAM Role for ECS Task
	taskRole := iamrole.NewIamRole(stack, jsii.String("ecsTaskRole"), &iamrole.IamRoleConfig{
		Name: jsii.String("ecsTaskRole"),
		AssumeRolePolicy: jsii.String(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Action": "sts:AssumeRole",
					"Principal": {
						"Service": "ecs-tasks.amazonaws.com"
					},
					"Effect": "Allow",
					"Sid": ""
				}
			]
		}`),
	})

	// (Optional) Add necessary policies to the task role, e.g., for accessing secrets manager
	// awsiam.NewRolePolicyAttachment(stack, jsii.String("AmazonECSTaskRolePolicy"), &awsiam.RolePolicyAttachmentConfig{
	// 	Role:      taskRole.Name(),
	// 	PolicyArn: jsii.String("arn:aws:iam::aws:policy/SecretsManagerReadWrite"),
	// })

	// NOTE!
	// ECS logs do not work, need to specify a log group, no doubt

	logGroup := cloudwatchloggroup.NewCloudwatchLogGroup(stack, jsii.String("nqdi-ecs-log-group"), &cloudwatchloggroup.CloudwatchLogGroupConfig{
		Name: jsii.String("nqdi-ecs-task-logs"),
	})

	rawTaskDef := []byte(`[
			{
				"name": "nqdi-api-container",
				"image": "%s",
				"portMappings": [
					{
						"containerPort": 80,
						"hostPort": 80
					}
				],
				"environment": [
					{
						"name": "CRDB_CONNECTION_STRING",
						"value": "%s"
					},
					{
						"name": "INGRESS_PORT_PROD",
						"value": "80"
					},
					{
						"name": "GIN_MODE",
						"value": "release"
					}
				],
				"logConfiguration": {
					"logDriver": "awslogs",
					"options": {
						"awslogs-group": "%s",
						"awslogs-region": "%s",
						"awslogs-stream-prefix": "golang-api"
					}
				}
			}
		]`)

	// presumably this will be a build arg of some sort?
	// also, in an ideal world, this lives in ECR rather than
	// on the public docker hub (and associated IAM glue ofc)
	tempImageUri := "inbrewj/nqdi-rest-api:0.0.6"

	taskDef := fmt.Sprintf(
		string(rawTaskDef),
		tempImageUri,
		env["CRDB_CONNECTION_STRING"],
		*logGroup.Name(),
		env["AWS_REGION"],
	)

	// Fargate Task Definition
	taskDefinition := ecstaskdefinition.NewEcsTaskDefinition(stack, jsii.String("nqdi-fargate-task-definition"), &ecstaskdefinition.EcsTaskDefinitionConfig{
		Family:                  jsii.String("nqdi-rest-api-task"),
		Cpu:                     jsii.String("256"),
		Memory:                  jsii.String("512"),
		NetworkMode:             jsii.String("awsvpc"),
		RequiresCompatibilities: jsii.Strings("FARGATE"),
		ExecutionRoleArn:        executionRole.Arn(),
		TaskRoleArn:             taskRole.Arn(),
		ContainerDefinitions:    jsii.String(taskDef),
	})

	ecs_service_security_group := sg.NewSecurityGroup(stack, jsii.String("nqdi-ecs-service-sg"), &sg.SecurityGroupConfig{
		VpcId:       vpc.Id(),
		Description: jsii.String("Allow ingress from ALB and connection out to internet and cockroach"),
		Name:        jsii.String("nqdi-ecs-service-sg"),
	})

	securitygroupingressrule.NewVpcSecurityGroupIngressRule(stack, jsii.String("nqdi-ecs-service-sg-rule-ssh-in"), &securitygroupingressrule.VpcSecurityGroupIngressRuleConfig{
		SecurityGroupId: ecs_service_security_group.Id(),
		FromPort:        jsii.Number(22),
		ToPort:          jsii.Number(22),
		IpProtocol:      jsii.String("tcp"),
		CidrIpv4:        jsii.String("0.0.0.0/0"),
	})

	securitygroupegressrule.NewVpcSecurityGroupEgressRule(stack, jsii.String("nqdi-ecs-service-sg-rule-internet-out"), &securitygroupegressrule.VpcSecurityGroupEgressRuleConfig{
		SecurityGroupId: ecs_service_security_group.Id(),
		FromPort:        jsii.Number(1),
		ToPort:          jsii.Number(65535),
		IpProtocol:      jsii.String("tcp"),
		CidrIpv4:        jsii.String("0.0.0.0/0"),
	})

	securitygroupingressrule.NewVpcSecurityGroupIngressRule(stack, jsii.String("nqdi-ecs-service-sg-rule-alb-in"), &securitygroupingressrule.VpcSecurityGroupIngressRuleConfig{
		SecurityGroupId:           ecs_service_security_group.Id(),
		ReferencedSecurityGroupId: alb_security_group.Id(),
		IpProtocol:                jsii.String("tcp"),
		FromPort:                  jsii.Number(1),
		ToPort:                    jsii.Number(65535),
		// CidrIpv4:                  jsii.String("0.0.0.0/0"),
	})

	securitygroupegressrule.NewVpcSecurityGroupEgressRule(stack, jsii.String("nqdi-ecs-service-sg-rule-alb-out"), &securitygroupegressrule.VpcSecurityGroupEgressRuleConfig{
		SecurityGroupId:           ecs_service_security_group.Id(),
		ReferencedSecurityGroupId: alb_security_group.Id(),
		IpProtocol:                jsii.String("tcp"),
		FromPort:                  jsii.Number(1),
		ToPort:                    jsii.Number(65535),
		// CidrIpv4:                  jsii.String("0.0.0.0/0"),
	})

	// ECS Service
	ecsservice.NewEcsService(stack, jsii.String("nqdi-fargate-service"), &ecsservice.EcsServiceConfig{
		Name:           jsii.String("golang-api-service"),
		Cluster:        cluster.Id(),
		TaskDefinition: taskDefinition.Arn(),
		DesiredCount:   jsii.Number(1),
		LaunchType:     jsii.String("FARGATE"),
		NetworkConfiguration: &ecsservice.EcsServiceNetworkConfiguration{
			Subnets:        &[]*string{privateSubnet.Id(), privateSubnet2.Id()},
			AssignPublicIp: jsii.Bool(false),
			SecurityGroups: &[]*string{ecs_service_security_group.Id()},
		},
		LoadBalancer: &[]*ecsservice.EcsServiceLoadBalancer{
			{
				TargetGroupArn: targetGroup.Arn(),
				ContainerName:  jsii.String("nqdi-api-container"),
				ContainerPort:  jsii.Number(80),
			},
		},
	})

	// let's leave route53 until later on, hey?

	// Route53 (replace with your actual domain and hosted zone ID)
	// zone := awsroute53.NewZone(stack, jsii.String("nqdi-route53-zone"), &awsroute53.ZoneConfig{
	// 	Name: jsii.String("example.com"), // Replace with your domain
	// 	// ... (configure other zone settings)
	// })

	// awsroute53.NewRecord(stack, jsii.String("nqdi-route53-record"), &awsroute53.RecordConfig{
	// 	Name: jsii.String("api"),
	// 	Type: jsii.String("A"),
	// 	Zone: zone.Id(),
	// 	Aliases: &[]*awsroute53.RecordAlias{{
	// 		Name:                 alb.DnsName(),
	// 		Zone:                 alb.ZoneId(),
	// 		EvaluateTargetHealth: jsii.Bool(true),
	// 	}},
	// })

	// // ACM (optional, for HTTPS)
	// // Replace with your actual domain name
	// certificate := awsacm.NewCertificate(stack, jsii.String("nqdi-acm-certificate"), &awsacm.CertificateConfig{
	// 	DomainName:       jsii.String("api.example.com"),
	// 	ValidationMethod: jsii.String("DNS"),
	// })

	// ... (configure DNS validation for the certificate)

	// Outputs
	cdktf.NewTerraformOutput(stack, jsii.String("alb_dns_name"), &cdktf.TerraformOutputConfig{
		Value: alb.DnsName(),
	})

	// Add this to the allow list on the cockroachdb cluster
	cdktf.NewTerraformOutput(stack, jsii.String("nat_gateway_ip"), &cdktf.TerraformOutputConfig{
		Value: eip.PublicIp(),
	})

	return stack
}

func main() {
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
