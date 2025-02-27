package scan_test

import (
	"nw-buddy/tools/nw-kit/commands/pull/scan"
	"nw-buddy/tools/nw-kit/nwfs"
	"nw-buddy/tools/nw-kit/rtti/nwt"
	"nw-buddy/tools/nw-kit/utils/env"
	"slices"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestFindSliceComponent(t *testing.T) {

	fs, err := nwfs.NewPakFS(env.GameDir())
	assert.NoError(t, err)

	ctx, err := scan.NewScanner(fs)
	assert.NoError(t, err)

	slice, ok := fs.Lookup("slices/structures/settlements/v2_settlements/fortress_brightwood_complete.dynamicslice")
	assert.True(t, ok)

	cmp, err := ctx.LoadSliceComponent(slice)
	assert.NoError(t, err)

	e1 := ctx.ScanSliceComponentForData(cmp, "")
	e2 := ctx.ScanSliceComponentForData(cmp, "")
	assert.True(t, e1[0].Entity == e2[0].Entity)

	ids1 := make([]nwt.AzUInt64, 0)
	ids2 := make([]nwt.AzUInt64, 0)
	for _, it := range cmp.Entities.Element {
		id := it.Id.Id
		ids1 = append(ids1, id)
		if !slices.Contains(ids2, id) {
			ids2 = append(ids2, id)
		}
	}
	assert.Equal(t, len(ids1), len(ids2))
	assert.EqualValues(t, ids1, ids2)

}
