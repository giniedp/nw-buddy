package utils_test

import (
	"nw-buddy/tools/utils"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestReplaceExt(t *testing.T) {
	assert.Equal(t, "foo.json", utils.ReplaceExt("foo", ".json"))
	assert.Equal(t, "foo.json", utils.ReplaceExt("foo.bar", ".json"))
	assert.Equal(t, "foo/bar.json", utils.ReplaceExt("foo/bar.baz", ".json"))
}
