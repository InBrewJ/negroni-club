package secrets

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
)

// the 'secrets' package is part of the configurator, I would assume?

func GetSecretFromEnvFile(k string) string {

	// check the os env first
	// function is now badly named
	if val, present := os.LookupEnv(k); present && val != "" {
		return val
	}

	var myEnv map[string]string
	myEnv, err := godotenv.Read()

	if err != nil {
		message := fmt.Sprintf("DOTENV FILE ERROR: Could not fetch secret with key %s", k)
		log.Fatal(message, err)
	}

	secretValue, ok := myEnv[k]

	if !ok {
		message := fmt.Sprintf("DOTENV KEY ERROR: Could not fetch secret with key %s", k)
		log.Fatal(message, err)
	}

	return secretValue
}
