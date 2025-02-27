package str

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestSuffix(t *testing.T) {
	su := NewSuffixArray([]string{"foo/bar", "baz/bar", "bar/foo"})
	found, _ := su.Lookup("foo")
	assert.Equal(t, "bar/foo", found)
}
