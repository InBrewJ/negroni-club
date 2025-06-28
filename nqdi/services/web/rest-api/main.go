package main

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"

	"rest-api/adapters"
	"rest-api/core"
	"rest-api/secrets"

	"github.com/gin-contrib/cors"

	jwtmiddleware "github.com/auth0/go-jwt-middleware/v2"
	"github.com/auth0/go-jwt-middleware/v2/validator"
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

	if secrets.GetSecretFromEnvFile("LOCAL_DEV") == "TRUE" {
		fmt.Println("LOCAL_DEV == TRUE")
		return secrets.GetSecretFromEnvFile("INGRESS_PORT_LOCAL")
	}

	fmt.Println("PROBABLY IN PROD")
	return secrets.GetSecretFromEnvFile("INGRESS_PORT_PROD")
}

func main() {
	// database init (driven port + cockroach adapter?)
	// maybe the adapter inits itself and is passed
	// into the core?
	core.InitStore()

	// gin init (through driving port? Or configurator?)
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
			"message":       "pong!",
			"hiddenMessage": "pang!",
			"nqdi":          core.DummyQualityIndex(),
		})
	})

	r.GET("/nqdi/recent", func(c *gin.Context) {
		core.CreateRecentNqdi()
		c.JSON(http.StatusOK, gin.H{
			"nqdi": core.GetRecentNqdi(),
		})
	})

	r.POST("/nqdi", checkJWT(), func(c *gin.Context) {
		// unDRY boilerplate, sort it out ya
		_, ok := c.Request.Context().Value(jwtmiddleware.ContextKey{}).(*validator.ValidatedClaims)
		if !ok {
			c.AbortWithStatusJSON(
				http.StatusInternalServerError,
				map[string]string{"message": "Failed to get validated JWT claims."},
			)
			return
		}

		var newNqdi adapters.NegroniQualityDiscoveryIndex

		if err := c.BindJSON(&newNqdi); err != nil {
			c.JSON(http.StatusBadGateway, gin.H{
				"error":   "Could not bind NQDI data from form to gorm",
				"message": err,
			})
			return
		}

		// validation, is there something built in to Gin or GORM?
		// note the uint problem - if -1 appears in the form is it
		// mapped back to 0?
		//
		// Or something like Zod in JS land?

		if newNqdi.Accessories > 10 || newNqdi.Accessories < 1 {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Accessories should be between 0 and 10",
			})
			return
		}

		if newNqdi.Bite > 10 || newNqdi.Bite < 1 {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Bite should be between 0 and 10",
			})
			return
		}

		if newNqdi.Sweetness > 10 || newNqdi.Sweetness < 1 {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Sweetness should be between 0 and 10",
			})
			return
		}

		if newNqdi.Mouthfeel > 10 || newNqdi.Mouthfeel < 1 {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Mouthfeel should be between 0 and 10",
			})
			return
		}

		_ = fmt.Sprintf("New Negroni = %s", newNqdi)

		// loose validation end, is there something built in to Gin or GORM?

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

	r.GET("/secure", checkJWT(), func(ctx *gin.Context) {
		claims, ok := ctx.Request.Context().Value(jwtmiddleware.ContextKey{}).(*validator.ValidatedClaims)
		if !ok {
			ctx.AbortWithStatusJSON(
				http.StatusInternalServerError,
				map[string]string{"message": "Failed to get validated JWT claims."},
			)
			return
		}

		ctx.JSON(http.StatusOK, gin.H{
			"secrets": "abound, within and here",
			"claims":  claims,
		})
	})

	r.Run(":" + GetIngressPort())
}
