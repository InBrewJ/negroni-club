package main

import (
	"fmt"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"

	"rest-api/adapters"
	"rest-api/core"
	"rest-api/secrets"

	"github.com/gin-contrib/cors"
)

// env var candidates
const LocalAppUrl = "http://localhost:19000"
const LocalServeAppUrl = "http://localhost:8081"
const ProdAppUrl = "https://nqdi.urawizard.com"

// S3 HTTP URL, not in use
// const NoodleAppUrl = "https://nqdi-noodle-test.s3.eu-central-1.amazonaws.com"
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

	r.POST("/nqdi", func(c *gin.Context) {
		var newNqdi adapters.NegroniQualityDiscoveryIndex

		if err := c.BindJSON(&newNqdi); err != nil {
			c.JSON(http.StatusBadGateway, gin.H{
				"error":   "Could not bind NQDI data from form to gorm",
				"message": err,
			})
			return
		}

		// validation, is there something built in to Gin?
		// Or something like Zod in JS land?

		if newNqdi.Accessories > 10 && newNqdi.Accessories < 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Accessories should be between 0 and 10",
			})
			return
		}

		if newNqdi.Bite > 10 && newNqdi.Bite < 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Bite should be between 0 and 10",
			})
			return
		}

		if newNqdi.Sweetness > 10 && newNqdi.Sweetness < 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Sweetness should be between 0 and 10",
			})
			return
		}

		if newNqdi.Mouthfeel > 10 && newNqdi.Mouthfeel < 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Mouthfeel should be between 0 and 10",
			})
			return
		}

		fmt.Sprintf("New Negroni = %s", newNqdi)

		// loose validation end, is there something built in to Gin?

		var createResult, err = core.CreateNewNqdi(newNqdi)

		if err != nil {
			c.JSON(http.StatusBadGateway, gin.H{
				"error":   "Could not create NQDI, datastore problem",
				"message": err,
			})
			return
		}

		c.IndentedJSON(http.StatusCreated, createResult)
	})

	r.Run(":" + GetIngressPort())
}
