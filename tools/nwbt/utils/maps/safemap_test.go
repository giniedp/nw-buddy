package maps_test

import (
	"nw-buddy/tools/utils/maps"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestSafeDict(t *testing.T) {
	m := maps.NewSafeDict[string]()
	m.Store("Baz", "1")
	m.Store("Foo", "2")
	m.Store("Bar", "3")

	assert.EqualValues(t, []string{"Bar", "Baz", "Foo"}, m.SortedKeys())
	assert.EqualValues(t, []string{"3", "1", "2"}, m.SortedValues())

	m.Delete("Foo")
	assert.EqualValues(t, []string{"Bar", "Baz"}, m.SortedKeys())
	assert.EqualValues(t, []string{"3", "1"}, m.SortedValues())

	v, loaded := m.LoadOrStore("Baz", "5")
	assert.Equal(t, "1", v)
	assert.True(t, loaded)

	v, loaded = m.LoadOrStore("Foo", "5")
	assert.Equal(t, "5", v)
	assert.False(t, loaded)

	v, loaded = m.Load("Unknown")
	assert.Equal(t, "", v)
	assert.False(t, loaded)

	m.Clear()
	assert.Empty(t, m.SortedKeys())
	assert.Empty(t, m.SortedValues())
}
