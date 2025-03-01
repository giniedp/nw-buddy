package str

import (
	"hash/crc32"
	"strings"
)

// Calculates the CRC32 checksum of the given string.
// The string is converted to lowercase.
func Crc32(data string) uint32 {
	return crc32.ChecksumIEEE([]byte(strings.ToLower(data)))
}
