VERSION="0.0.10"

# (for the Digital Ocean Container Registry)

# docker login registry.digitalocean.com -u secret -p secret

TAG="registry.digitalocean.com/gin-barrel/gin-backend:$VERSION"


# (for the Vultr container registry version)
# docker login https://fra.vultrcr.com/ginbarrel -u secret -p secret

# docker run -p 8080:80 -d -e CRDB_CONNECTION_STRING=secret -e GIN_MODE=release -e INGRESS_PORT_PROD=80 fra.vultrcr.com/ginbarrel/gin-backend:$VERSION

# TAG="fra.vultrcr.com/ginbarrel/gin-backend:$VERSION"

# Build the dockerfile
docker build --tag $TAG .

# (for the dockerhub version)
## tag inbrewj/nqdi:0.0.x
## push to dockerhub
docker push $TAG

# (for the ECS version)
## sign in to ECR
## tag with urawizard/nqdi:0.0.x
## push to ECR

# save tag to env var / file

# run infra::deploy with cdktf, update the task definition with the tag saved above
