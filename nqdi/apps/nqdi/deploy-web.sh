# Unless you have nx installed globally and if you have an npx alias (alias nx="npx nx"), source this script:
# . ./deploy-web.sh

LOCAL_FOLDER="dist/"
BUCKET_NAME="nqdi-noodle-test"
CLOUDFRONT_DISTRIBUTION_ID="EXAZZB4TDDO"

# Build the web bundle
nx export nqdi --platform web

# Get the S3 bucket from infra (somehow)
## Maybe infra prints it out to a file, maybe we can query via cdktf?


# Upload the files to S3
echo "Deleting existing files in s3://$BUCKET_NAME..."
aws s3 rm s3://$BUCKET_NAME --recursive
if [ $? -ne 0 ]; then
  echo "ERROR: Failed to delete files from S3. Exiting."
  exit 1
fi

echo "Uploading files from $LOCAL_FOLDER to s3://$BUCKET_NAME..."
aws s3 sync "$LOCAL_FOLDER" s3://$BUCKET_NAME
if [ $? -ne 0 ]; then
  echo "ERROR: Failed to upload files to S3. Exiting."
  exit 1
fi

# Get the cloudfront dist id


# Run the invalidation on index.html
echo "Invalidating /index.html in CloudFront distribution $CLOUDFRONT_DISTRIBUTION_ID..."
aws cloudfront create-invalidation --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" --paths "/index.html"
if [ $? -ne 0 ]; then
  echo "ERROR: Failed to create CloudFront invalidation. Exiting."
  exit 1
fi

echo "All operations completed successfully!"
