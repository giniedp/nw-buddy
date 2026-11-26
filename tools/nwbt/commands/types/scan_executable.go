package types

import (
	"fmt"
	"log/slog"
	"nw-buddy/tools/rtti"
	"os"
	"regexp"
)

func scanExecutable(filePath string) (rtti.UuidTable, error) {
	slog.Info(fmt.Sprintf("Inspecting %s", filePath))
	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, err
	}

	table := rtti.NewUuidTable()
	dataStr := string(data)
	// match for UUIDs like {8309995F-A628-57DA-AAFE-2E04A257EC40}
	reg := regexp.MustCompile("{[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}}")
	// walk through all matches getting the index of the match
	for _, match := range reg.FindAllStringIndex(dataStr, -1) {
		// get the match from the data string
		uuid := dataStr[match[0]:match[1]]
		value, _ := findStringBeforeIndex(dataStr, match[0])
		if value == "" {
			continue
		}

		if reg.Match([]byte(value)) {
			continue
		}

		uuid = rtti.NormalizeUUID(uuid)
		if !table.Has(uuid) {
			table.Put(uuid, value)
			continue
		}

		prev := table.Get(uuid)
		if prev == value {
			continue
		}
		slog.Warn(fmt.Sprintf("%s already has value %s, incoming %s", uuid, prev, value))
	}

	return table, nil
}

func findStringBeforeIndex(data string, index int) (string, int) {
	if data[index-1] != 0 {
		return "", -1
	}
	// skip null bytes
	iEnd := index - 1
	for data[iEnd] == 0 {
		iEnd--
	}
	iStart := iEnd
	// scan back to find the start of the string, only ascii characters
	for data[iStart] != 0 {
		if data[iStart] < 32 || data[iStart] > 126 {
			return "", -1
		}
		iStart--
	}
	iStart++
	iEnd++
	return data[iStart:iEnd], iEnd
}

func isAlphaNumeric(r rune) bool {
	return r >= 48 && r <= 57 || r >= 65 && r <= 90 || r >= 97 && r <= 122
}

func isASCII(r rune) bool {
	return r >= 32 && r <= 126
}
