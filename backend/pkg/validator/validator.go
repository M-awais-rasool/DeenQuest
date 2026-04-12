package validator

import (
	"github.com/go-playground/validator/v10"
)

var validate *validator.Validate

func init() {
	validate = validator.New()
}

func Validate(s interface{}) error {
	return validate.Struct(s)
}

func FormatValidationErrors(err error) map[string]string {
	errors := make(map[string]string)

	if validationErrors, ok := err.(validator.ValidationErrors); ok {
		for _, e := range validationErrors {
			switch e.Tag() {
			case "required":
				errors[e.Field()] = e.Field() + " is required"
			case "email":
				errors[e.Field()] = "Invalid email format"
			case "min":
				errors[e.Field()] = e.Field() + " must be at least " + e.Param() + " characters"
			case "max":
				errors[e.Field()] = e.Field() + " must be at most " + e.Param() + " characters"
			case "oneof":
				errors[e.Field()] = e.Field() + " must be one of: " + e.Param()
			default:
				errors[e.Field()] = e.Field() + " is invalid"
			}
		}
	}

	return errors
}
