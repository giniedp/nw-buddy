package utils

import "regexp"

var uuidReg = regexp.MustCompile(`([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})`)

func ExtractUUID(value string) string {
	match := uuidReg.FindStringSubmatch(value)
	if len(match) == 2 {
		return match[1]
	}
	return ""
}
