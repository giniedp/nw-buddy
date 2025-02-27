package types

import (
	"bufio"
	"fmt"
	"log/slog"
	"net/http"
	"nw-buddy/tools/rtti"
	"nw-buddy/tools/utils"
	"regexp"
	"strconv"
)

func scanNwTools() (crc rtti.CrcTable, table rtti.UuidTable, err error) {
	defer utils.HandleRecover(&err)

	// just lazy parsing for now
	// TODO: import go module or ask for json files

	reg := regexp.MustCompile("\"(.+)\": \"(.+)\",")
	table = rtti.NewUuidTable()
	err = fetchLines("https://github.com/new-world-tools/new-world-tools/raw/refs/heads/master/azcs/typeData.go", func(line string) {
		matches := reg.FindStringSubmatch(line)
		if len(matches) >= 3 {
			table.Put(rtti.NormalizeUUID(matches[1]), matches[2])
		}
	})

	if err != nil {
		return nil, nil, err
	}

	reg = regexp.MustCompile(`(0x[0-9a-zA-Z]+):\s*"(.+)",`)
	crc = rtti.NewCrcTable()
	err = fetchLines("https://github.com/new-world-tools/new-world-tools/raw/refs/heads/master/azcs/hashCustomData.go", func(line string) {
		matches := reg.FindStringSubmatch(line)
		if len(matches) >= 3 {
			num, err := strconv.ParseUint(matches[1], 0, 32)
			if err != nil {
				slog.Warn(fmt.Sprintf("%v\n", err))
				return
			}
			crc.Put(uint32(num), matches[2])
		}
	})
	if err != nil {
		return nil, nil, err
	}
	return
}

func fetchLines(url string, fn func(line string)) error {
	slog.Info(fmt.Sprintf("Get %s", url))
	resp := utils.Must(http.Get(url))
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("failed to fetch typeData.go: %s", resp.Status)
	}

	scanner := bufio.NewScanner(resp.Body)
	for scanner.Scan() {
		fn(scanner.Text())
	}
	return nil
}
