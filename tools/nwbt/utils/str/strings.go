package str

// IsNumeric checks if the string is composed of only numeric characters (0-9).
func IsNmeric(value string) bool {
	for _, c := range value {
		if c >= '0' && c <= '9' {
			continue
		}
		return false
	}
	return true
}

// IsAlpha checks if the string is composed of only alphabetic characters (a-z, A-Z).
func IsAlpha(value string) bool {
	for _, c := range value {
		if (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') {
			continue
		}
		return false
	}
	return true
}

// IsAlphaNumeric checks if the string is composed of only alphanumeric characters (a-z, A-Z, 0-9).
func IsAlphaNumeric(value string) bool {
	for _, c := range value {
		if (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') {
			continue
		}
		return false
	}
	return true
}

// IsValidJsSymbol checks if the string is a valid JavaScript symbol (a-z, A-Z, 0-9, _).
func IsValidJsSymbol(value string) bool {
	if len(value) == 0 {
		return false
	}
	if value[0] >= '0' && value[0] <= '9' {
		return false
	}
	for _, c := range value {
		if (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || c == '_' {
			continue
		}
		return false
	}
	return true
}

func EscapeJsSymbol(value string) string {
	if IsValidJsSymbol(value) {
		return value
	}
	return "'" + value + "'"
}
