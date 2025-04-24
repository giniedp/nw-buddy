package game_test

import (
	"nw-buddy/tools/game"
	"nw-buddy/tools/utils/env"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestRegionEntities(t *testing.T) {
	assets, err := game.InitPackedAssets(env.GameDir())
	require.NoError(t, err)

	names := game.ListLevelNames(assets.Archive)
	require.Contains(t, names, "nw_opr_004_trench")

	level := game.NewLevelCollection(assets).Level("nw_opr_004_trench")
	require.NotNil(t, level)
	require.Len(t, level.Info().Regions, 1)

	region := level.Region("r_+00_+00")
	require.NotNil(t, region)

	entities := region.Entities()
	require.NotNil(t, entities)
}
