package utils_test

import (
	"nw-buddy/tools/utils"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestNextIndex(t *testing.T) {
	r := utils.NewByteReaderLE([]byte{0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08})
	i := r.NextIndex([]byte{0x10})
	assert.Equal(t, -1, i)

	i = r.NextIndex([]byte{0x03, 0x04})
	assert.Equal(t, 2, i)

	e := r.SeekRelative(i)
	assert.NoError(t, e)

	i = r.NextIndex([]byte{0x10})
	assert.Equal(t, -1, i)

	i = r.NextIndex([]byte{0x06, 0x07})
	assert.Equal(t, 3, i)

	b, e := r.ReadBytes(i)
	assert.NoError(t, e)
	assert.Equal(t, []byte{0x03, 0x04, 0x05}, b)
}
