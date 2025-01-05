package core

import (
	"testing"
)

func TestGetIndexFromStore(t *testing.T) {
	id := 1
	result := GetIndexFromStore(id)
	if result != "Not implemented" {
		t.Error("Expected GetIndexFromStore to return something disappointing")
	}
}
