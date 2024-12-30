package core

// models, messages between models
//
// negroni (rating/nqdi)
// rating
// negroni image
// drinker (with personal nqdi)
// comment
// recommendation (location)

import (
	"fmt"
	"log"
	"rest-api/adapters"
)

type Nqdi struct {
	Bite        int
	Accessories int
	Mouthfeel   int
	Sweetness   int
}

func DummyQualityIndex() Nqdi {

	var firstNqdi = Nqdi{
		Bite:        7,
		Accessories: 4,
		Mouthfeel:   9,
		Sweetness:   3,
	}

	return firstNqdi
}

/////////////// STORE /////////////

func InitStore() bool {

	db, err := adapters.Connect(adapters.CockroachConnectionString)

	if err != nil {
		log.Fatal("failed to connect database", err)
	}

	err = adapters.CreateSchema(db)

	if err != nil {
		log.Fatal("failed to create schema", err)
	}

	// Does this go in the configurator?
	return true
}

func GetIndexFromStore(id int) string {
	return "Not implemented"
}

func GetRecentNqdi() adapters.NegroniQualityDiscoveryIndex {
	db, err := adapters.Connect(adapters.CockroachConnectionString)

	if err != nil {
		log.Fatal("failed to connect database", err)
	}

	var nqdi adapters.NegroniQualityDiscoveryIndex
	db.Order("updated_at DESC").First(&nqdi)

	fmt.Println(nqdi)

	return nqdi
}

func CreateRecentNqdi() adapters.NegroniQualityDiscoveryIndex {
	db, err := adapters.Connect(adapters.CockroachConnectionString)

	if err != nil {
		log.Fatal("failed to connect database", err)
	}

	var nqdi adapters.NegroniQualityDiscoveryIndex

	nqdi.Accessories = 9
	nqdi.Mouthfeel = 5
	nqdi.Sweetness = 2
	nqdi.Bite = 10

	// House of Tides location
	nqdi.Lat = "54.9679758"
	nqdi.Long = "-1.6102649"
	nqdi.Country = "UK"
	nqdi.DrinkerId = 2

	db.Where(adapters.NegroniQualityDiscoveryIndex{DrinkerId: nqdi.DrinkerId}).FirstOrCreate(&nqdi)

	return nqdi
}
