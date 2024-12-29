package core

// models, messages between models
//
// negroni (rating/nqdi)
// rating
// negroni image
// drinker (with personal nqdi)
// comment
// recommendation (location)

type Nqdi struct {
	Bite        int
	Accessories int
	Mouthfeel   int
	Sweetness   int
}

func QualityIndex() Nqdi {

	var firstNqdi = Nqdi{
		Bite:        7,
		Accessories: 4,
		Mouthfeel:   9,
		Sweetness:   3,
	}

	return firstNqdi
}
