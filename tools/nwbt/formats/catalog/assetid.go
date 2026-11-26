package catalog

import (
	"fmt"
	"regexp"
	"strconv"
	"strings"
)

type AssetId struct {
	Guid  string `json:"guid"`
	SubID uint32 `json:"subId"`
}

var uuidReg = regexp.MustCompile(`([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})`)
var uuid2Reg = regexp.MustCompile(`([0-9a-fA-F]{8})([0-9a-fA-F]{4})([0-9a-fA-F]{4})([0-9a-fA-F]{4})([0-9a-fA-F]{12})`)
var subidReg = regexp.MustCompile(`:([0-9a-fA-F]+)$`)

func ParseAssetId(assetIdString string) (assetId AssetId, ok bool) {
	if uuid, parsed := ParseUUID(assetIdString); parsed {
		assetId.Guid = uuid.String()
		ok = true
	}

	match := subidReg.FindStringSubmatch(assetIdString)
	if len(match) == 2 {
		value, _ := strconv.ParseUint(match[1], 16, 32)
		assetId.SubID = uint32(value)
	}
	return
}

func (id *AssetId) IsZeroOrEmpty() bool {
	return UUID(id.Guid).IsZeroOrEmpty()
}

func ToAssetId(guid string, subid uint) AssetId {
	return AssetId{
		Guid:  strings.ToLower(guid),
		SubID: uint32(subid),
	}
}

type UUID string

func (u UUID) String() string {
	return string(u)
}

func (u UUID) IsZeroOrEmpty() bool {
	return u == "" || u == "00000000-0000-0000-0000-000000000000"
}

func ParseUUID(uuidString string) (uuid UUID, ok bool) {
	match := uuidReg.FindStringSubmatch(uuidString)
	if len(match) == 2 {
		return UUID(strings.ToLower(match[1])), true
	}
	match = uuid2Reg.FindStringSubmatch(uuidString)
	if len(match) == 6 {
		uuidStr := fmt.Sprintf("%s-%s-%s-%s-%s", match[1], match[2], match[3], match[4], match[5])
		return UUID(strings.ToLower(uuidStr)), true
	}
	ok = false
	return
}

// 00000002-0000-0000-0000-000000000000 -> = 2
// 2 -> = 2
func ParseUUIDprefixToInt(value string) (uint32, error) {
	part, _, _ := strings.Cut(value, "-")
	val, err := strconv.ParseInt(part, 16, 64)
	return uint32(val), err
}
