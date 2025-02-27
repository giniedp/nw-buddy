package nwfs_test

import (
	"nw-buddy/tools/nwfs"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestCompileGlob(t *testing.T) {

	type PatternTest struct {
		pattern []string
		samples map[string]bool
	}

	var table = []PatternTest{
		{
			pattern: []string{".{foo,bar,baz}"},
			samples: map[string]bool{
				".foo":  true,
				".bar":  true,
				".baz":  true,
				"a.foo": false,
				"a.bar": false,
				"a.baz": false,
			},
		},
		{
			pattern: []string{"*.baz"},
			samples: map[string]bool{
				"foo.baz":     true,
				"foo.bar.baz": true,
				"foo/bar.baz": false,
			},
		},
		{
			pattern: []string{"**.baz"},
			samples: map[string]bool{
				"foo.baz":     true,
				"foo.bar.baz": true,
				"foo/bar.baz": true,
			},
		},
		{
			pattern: []string{"**bar.baz"},
			samples: map[string]bool{
				"foo.baz":     false,
				"bar.baz":     true,
				"foobar.baz":  true,
				"foo/bar.baz": true,
			},
		},
		{
			pattern: []string{"foo/bar.baz.*"},
			samples: map[string]bool{
				"foo/bar.baz":     false,
				"foo/bar.baz.1":   true,
				"foo/bar.baz.a":   true,
				"foo/bar.baz.a1":  true,
				"foo/bar.baz.a/b": false,
			},
		},
	}
	for _, test := range table {
		match, err := nwfs.CompileGlob(test.pattern...)
		assert.NoError(t, err, "Creating glob with %v", test.pattern)
		for sample, expected := range test.samples {
			actual := match(sample)
			assert.Equal(t, expected, actual, "Matching '%v' with %v", sample, test.pattern)
		}
	}
}

func TestCompileRegexp(t *testing.T) {

	type PatternTest struct {
		pattern []string
		samples map[string]bool
	}

	var table = []PatternTest{
		{
			pattern: []string{"\\.baz$"},
			samples: map[string]bool{
				".baz":    true,
				"bar.baz": true,
				"_baz":    false,
			},
		},
	}
	for _, test := range table {
		match, err := nwfs.CompileRegexp(test.pattern...)
		assert.NoError(t, err, "Creating regex with %v", test.pattern)
		for sample, expected := range test.samples {
			actual := match(sample)
			assert.Equal(t, expected, actual, "Matching '%v' with %v", sample, test.pattern)
		}
	}
}
