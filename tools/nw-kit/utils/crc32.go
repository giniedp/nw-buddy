package utils

import (
	"hash/crc32"
	"strings"
)

// Calculates the CRC32 checksum of the given data.
func Crc32(data []byte) uint32 {
	return crc32.ChecksumIEEE(data)
}

// Calculates the CRC32 checksum of the given string.
// The string is converted to lowercase.
func Crc32FromString(data string) uint32 {
	return Crc32([]byte(strings.ToLower(data)))
}
