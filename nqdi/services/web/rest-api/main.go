package main

import (
	"net/http"
	"os"

	"github.com/gin-gonic/gin"

	"rest-api/core"
	"rest-api/secrets"

	"github.com/gin-contrib/cors"
)

// env var candidates
const LocalAppUrl = "http://localhost:19000"
const LocalServeAppUrl = "http://localhost:8081"
const ProdAppUrl = "https://nqdi.urawizard.com"
const NoodleAppUrl = "https://nqdi-noodle-test.s3.eu-central-1.amazonaws.com"
const ClubAppUrlWww = "https://www.negroni.club"
const ClubAppUrl = "https://negroni.club"

func Smoke() string {
	return "fire!"
}

func GetIngressPort() string {
	// https://gobyexample.com/environment-variables

	if os.Getenv("LOCAL_DEV") == "TRUE" {
		return secrets.GetSecretFromEnvFile("INGRESS_PORT_LOCAL")
	}

	return secrets.GetSecretFromEnvFile("INGRESS_PORT_PROD")
}

func main() {
	// database init (driven port + cockroach adapter?)
	// maybe the adapter inits itself and is passed
	// into the core?
	core.InitStore()

	// gin init (through driving port?)
	r := gin.Default()

	// https://github.com/gin-contrib/cors?tab=readme-ov-file#using-defaultconfig-as-start-point
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{
		LocalAppUrl,
		ProdAppUrl,
		LocalServeAppUrl,
		NoodleAppUrl,
		ClubAppUrlWww,
		ClubAppUrl,
	}

	r.Use(cors.New(config))

	r.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "pong!",
			"nqdi":    core.DummyQualityIndex(),
		})
	})

	r.GET("/nqdi/recent", func(c *gin.Context) {
		core.CreateRecentNqdi()
		c.JSON(http.StatusOK, gin.H{
			"nqdi": core.GetRecentNqdi(),
		})
	})

	r.Run(":" + GetIngressPort()) // listen and serve on 0.0.0.0:8080 (for windows "localhost:8080")
}
