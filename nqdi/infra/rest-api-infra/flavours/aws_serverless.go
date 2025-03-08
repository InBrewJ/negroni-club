package flavours

// API gateway / lambda goes here
// I guess in an ideal world there would be one lambda per route
// How does database connection pooling work?
//   - generally, put database connection code outside the handler
//   - if there is enough usage of a given lambda invocation, the connection
//     will reused
//
// Also see: Firebase for Go? https://medium.com/google-cloud/firebase-developing-serverless-functions-in-go-963cb011265d

func serverless() {

	// SO we need
	// API gateway
	// some definition of the routes (via an OpenAPI definition?)
	// at least one lambda function to connect to Cockroach and return stuff
	//// If the cockroach stack could be referenced for the connection string
	//// that would be neat
	//// The lambda also definitively needs outbound internet access
	// S3 bucket to house the lambda binaries - ah no, do we use the OS-only runtime?
	//// https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtimes.html
	//// Or do we just use the docker container we have? (modified to accept
	//// API gateway events ofc)
	//
	// https://docs.aws.amazon.com/lambda/latest/dg/lambda-golang.html

	// Peripheral note:
	//// the app doesn't need to be an HTTP server anymore
	//// it'll take in an API gateway event and return a web response, though
	//// so at this stage there still needs to be some web framework involved
	//// if only for the response

	// Start here for lambda:
	// https://github.com/aws/aws-lambda-go
	// https://github.com/aws/aws-lambda-go?tab=readme-ov-file#for-developers-on-linux
	// Let's try and build with GOARCH=arm64, why the hello world not

	// First draft approach (without OpenAPI spec for now)
	// API Gateway HTTP API (just seems simpler)
	// os only ARM runtime (do the zip thing)
	// place lambda in private subnet + NAT gateway again (damn)
	// ...slight cost savings but still dwarfed by the NAT gateway at low usage

	// Is there some way we can map a SQL schema onto a serverless canvas?

}
