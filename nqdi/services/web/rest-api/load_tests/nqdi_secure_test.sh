TOKEN="XXX"

curl --request GET \
  --url http://localhost:8000/secure \
  --header "authorization: Bearer $TOKEN"