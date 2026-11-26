package chrparams

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestCompileAnimationPattern(t *testing.T) {
	// a wildcard folder takes the folder itself and every folder below it (turkey: the clips are in the folder)
	match, err := compileAnimationPattern("anims/turkey/*/*.caf")
	assert.NoError(t, err)
	assert.True(t, match("anims/turkey/turkey_idle.caf"))
	assert.True(t, match("anims/turkey/blendspaces/x.caf"))
	assert.True(t, match("anims/turkey/a/b/c.caf"))
	assert.False(t, match("anims/turkey/a/b/c.bspace"))
	assert.False(t, match("anims/turkeys.caf"))
	assert.False(t, match("anims/other/turkey_idle.caf"))

	// the folder before the first wildcard is a prefix, the files must be below it
	match, err = compileAnimationPattern("anims/tur*/walk_*.caf")
	assert.NoError(t, err)
	assert.True(t, match("anims/turkey/walk_fast.caf"))
	assert.True(t, match("anims/turkey/x/walk_slow.caf"))
	assert.False(t, match("anims/turkey/run.caf"))
	assert.False(t, match("anims/walk_x.caf"))

	// no wildcard folder: the folder only
	match, err = compileAnimationPattern("anims/turkey/*.caf")
	assert.NoError(t, err)
	assert.True(t, match("anims/turkey/turkey_idle.caf"))
	assert.False(t, match("anims/turkey/blendspaces/x.caf"))
}
