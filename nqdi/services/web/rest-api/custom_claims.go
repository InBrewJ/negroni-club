package main

// This is heavily copy + pasted from here:
// https://github.com/auth0/go-jwt-middleware/blob/master/examples/gin-example/main.go
//
// Presumably the custom claims will be useful when Names / user ids enter into the scene?

import (
	"context"
	"errors"
)

// CustomClaimsExample contains custom data we want from the token.
type CustomClaimsExample struct {
	Name         string `json:"name"`
	Username     string `json:"username"`
	ShouldReject bool   `json:"shouldReject,omitempty"`
}

// Validate errors out if `ShouldReject` is true.
func (c *CustomClaimsExample) Validate(ctx context.Context) error {
	if c.ShouldReject {
		return errors.New("should reject was set to true")
	}
	return nil
}
