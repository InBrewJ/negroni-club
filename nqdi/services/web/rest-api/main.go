package main

import (
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"

	"rest-api/core"
	"rest-api/secrets"

	"github.com/gin-contrib/cors"
)

// env var candidates
const LocalAppUrl = "http://localhost:19000"
const LocalServeAppUrl = "http://localhost:8081"
const ProdAppUrl = "https://nqdi.urawizard.com"

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

	// CORS for *AppUrl origins, allowing:
	// - GET methods
	// - Origin header
	// - Credentials share
	// - Preflight requests cached for 12 hours
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{LocalAppUrl, ProdAppUrl, LocalServeAppUrl},
		AllowMethods:     []string{"GET"},
		AllowHeaders:     []string{"Origin"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

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
