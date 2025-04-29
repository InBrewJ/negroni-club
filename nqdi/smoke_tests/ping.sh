frontend_response=$(curl -L -sS https://negroni.club | grep NQDI)

errors=()

if [[ $frontend_response != '    <title>NQDI</title>' ]]
then
    echo 'webapp is down'
    echo 'it returned this:'
    echo "*******************************"
    echo $frontend_response
    echo "*******************************"
    errors+=('frontend is borked!')
else
    echo 'webapp returned the right thing'
fi


rest_api_response=$(curl -L -sS https://gin.negroni.club/ping | grep pong)


if [[ $rest_api_response != '{"hiddenMessage":"pang!","message":"pong!","nqdi":{"Bite":7,"Accessories":4,"Mouthfeel":9,"Sweetness":3}}' ]]
then
    echo 'gin rest api is down'
    echo 'it returned this:'
    echo "*******************************"
    echo $rest_api_response
    echo "*******************************"
    errors+=('backend is borked!')
else
    echo 'gin rest api returned the right thing'
fi

if [ ${#errors[@]} -eq 0 ]; then
    echo -e "\n\nAll is well\n"
    exit 0;
else
    echo -e "\n\nsort it out: \n\n"
    echo "--------------------------------"
    for each in "${errors[@]}"
    do
        echo "$each"
    done
    echo "--------------------------------"
fi

