VERSION="0.0.7"
TAG="inbrewj/nqdi-rest-api:$VERSION"

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
