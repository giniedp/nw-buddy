package game_test

import (
	"log/slog"
	"nw-buddy/tools/game"
	"nw-buddy/tools/rtti/nwt"
	"nw-buddy/tools/utils/env"
	"nw-buddy/tools/utils/logging"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestApplyVariation(t *testing.T) {
	slog.SetDefault(logging.DefaultTerminalHandler())

	assets, err := game.InitPackedAssets(env.GameDir())
	require.NoError(t, err)

	file, _ := assets.Archive.Lookup("slices/master_lootlock.dynamicslice")
	require.NotNil(t, file)

	slice, err := assets.LoadSliceComponent(file)
	require.NoError(t, err)

	entity := game.FindEntityById(slice, nwt.AzUInt64(5626112460221845901))
	require.NotNil(t, entity)

	entityPrefab := game.FindPrefabSpawnerComponent(entity)
	require.NotNil(t, entityPrefab)
	require.Equal(t, "E00122FF-C572-5DBA-847A-E9A1A0DE96F3", entityPrefab.M_sliceAsset.Guid)

	game.ApplyVariationData(assets, slice)
	entityPrefab2 := game.FindPrefabSpawnerComponent(entity)
	require.NotNil(t, entityPrefab2)
	require.Equal(t, "", entityPrefab2.M_sliceAsset.Guid)
}
