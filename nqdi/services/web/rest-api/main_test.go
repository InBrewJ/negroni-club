package main

import (
	"testing"
)

func TestSmoke(t *testing.T) {
	result := Smoke()
	if result != "fire!" {
		t.Error("Expected Smoke to return 'fire'")
	}
}
