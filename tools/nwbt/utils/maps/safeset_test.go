package maps_test

import (
	"nw-buddy/tools/utils/maps"
	"slices"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestSafeSet(t *testing.T) {
	m := maps.NewSafeSet[string]()
	m.Store("Baz")
	m.Store("Foo")
	m.Store("Bar")

	assert.Equal(t, 3, m.Len())
	assert.True(t, m.Has("Foo"))
	assert.EqualValues(t, []string{"Baz", "Foo", "Bar"}, m.Values())
	assert.EqualValues(t, []string{"Baz", "Foo", "Bar"}, slices.Collect(m.Iter()))

	m.Delete("Foo")
	assert.Equal(t, 2, m.Len())
	assert.False(t, m.Has("Foo"))
	assert.EqualValues(t, []string{"Baz", "Bar"}, m.Values())
	assert.EqualValues(t, []string{"Baz", "Bar"}, slices.Collect(m.Iter()))

	m.Clear()
	assert.Equal(t, 0, m.Len())
	assert.False(t, m.Has("Foo"))
	assert.Empty(t, m.Values())
	assert.Empty(t, slices.Collect(m.Iter()))
}
