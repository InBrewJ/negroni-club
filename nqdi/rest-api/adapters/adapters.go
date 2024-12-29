package adapters

import (
	"fmt"
	"time"

	"rest-api/secrets"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var CockroachConnectionString = secrets.GetSecretFromEnvFile("CCS")

type Insight struct {
	gorm.Model
	Body         string
	CollectionId uint
}

type NegroniQualityDiscoveryIndex struct {
	gorm.Model
	Bite        uint
	Accessories uint
	Mouthfeel   uint
	Sweetness   uint
	Lat         string
	Long        string
	Country     string
	DrinkerId   int8
}

type PreferredNegroniQualityDiscoveryIndex struct {
	gorm.Model
	Bite        uint
	Accessories uint
	Mouthfeel   uint
	Sweetness   uint
	DrinkerId   int8
}

type TheDrinker struct {
	gorm.Model
	Codename       string
	ExternalAuthId string
	HomeCountry    string
}

func CreateSchema(db *gorm.DB) error {
	var now time.Time
	db.Raw("SELECT NOW()").Scan(&now)

	fmt.Println(now)

	// Migrate the schema
	db.AutoMigrate(&Insight{})
	db.AutoMigrate(&NegroniQualityDiscoveryIndex{})
	db.AutoMigrate(&PreferredNegroniQualityDiscoveryIndex{})
	err := db.AutoMigrate(&TheDrinker{})
	return err
}

func createAndStuff(db *gorm.DB) {
	// Create
	db.Create(&Insight{Body: "I have become death, destroyer of worlds", CollectionId: 88})

	// Read
	var insight Insight
	// db.First(&insight, 1030222329665486849)     // find insight with integer primary key, is cockroach setting the id to something big and mad? Probs...
	db.First(&insight, "collection_id = ?", 88) // find insight with CollectionId 66

	// Update - update insight's Body to 200
	db.Model(&insight).Update("Body", "The first draft of anything is shit")

	// Update - update multiple fields
	db.Model(&insight).Updates(Insight{Body: "In the service, one must choose the lesser of two weevils", CollectionId: 88}) // non-zero fields

	db.Model(&insight).Updates(map[string]interface{}{"Body": "I LURRVE YOUUUU and let us pray for Nina", "CollectionId": 89})
}

func Connect(connectionString string) (*gorm.DB, error) {
	db, err := gorm.Open(postgres.Open(connectionString), &gorm.Config{})
	return db, err
}
