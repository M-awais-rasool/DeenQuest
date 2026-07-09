package progress

import "strings"

// CourseTypeFromString normalizes user input into a supported course type.
func CourseTypeFromString(raw string) (CourseType, bool) {
	switch CourseType(strings.ToLower(strings.TrimSpace(raw))) {
	case CourseQaida:
		return CourseQaida, true
	default:
		return "", false
	}
}

// CourseTypeOrDefault keeps older level API callers on the original Qaida path.
func CourseTypeOrDefault(raw string) (CourseType, bool) {
	if strings.TrimSpace(raw) == "" {
		return CourseQaida, true
	}
	return CourseTypeFromString(raw)
}
