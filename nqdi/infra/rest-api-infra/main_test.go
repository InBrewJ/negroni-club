package main

import (
	"testing"

	"github.com/hashicorp/terraform-cdk-go/cdktf"
)

// The tests below are example tests, you can find more information at
// https://cdk.tf/testing

var runValidations bool = false

var stack = NewMyStack(cdktf.Testing_App(nil), "stack")
var synth = cdktf.Testing_Synth(stack, &runValidations)

func TestCheckValidity(t *testing.T) {
	assertion := cdktf.Testing_ToBeValidTerraform(cdktf.Testing_FullSynth(stack))

	if !*assertion {
		t.Error("Assertion Failed")
	}
}
