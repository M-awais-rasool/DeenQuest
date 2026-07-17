package level

import "strings"

func CourseTypeFromString(raw string) (CourseType, bool) {
	switch CourseType(strings.ToLower(strings.TrimSpace(raw))) {
	case CourseQaida:
		return CourseQaida, true
	case CoursePractice:
		return CoursePractice, true
	default:
		return "", false
	}
}

func CourseTypeOrDefault(raw string) (CourseType, bool) {
	if strings.TrimSpace(raw) == "" {
		return CourseQaida, true
	}
	return CourseTypeFromString(raw)
}
