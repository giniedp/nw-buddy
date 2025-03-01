package str_test

import (
	"nw-buddy/tools/utils/str"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestCrc32(t *testing.T) {
	value := str.Crc32("Hello World")
	assert.Equal(t, uint32(0xd4a1185), value)
	assert.Equal(t, value, str.Crc32("HELLO WORLD"))
	assert.Equal(t, value, str.Crc32("hello world"))
}
