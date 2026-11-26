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

// TestApplyVariation checks ApplyVariationData against the variations the game data currently has:
// a "Change Prefab Spawner Slice" variant clears the spawner when its column is empty, else it sets the alias hint.
// The expectations are read from the data, so the test does not break when the slice's content changes.
func TestApplyVariation(t *testing.T) {
	if env.GameDir() == "" {
		t.Skip("NW_GAME is not set")
	}
	slog.SetDefault(logging.DefaultTerminalHandler())

	assets, err := game.InitPackedAssets(env.GameDir())
	require.NoError(t, err)

	file, ok := assets.Archive.Lookup("slices/master_lootlock.dynamicslice")
	if !ok {
		t.Skip("slices/master_lootlock.dynamicslice not found")
	}
	slice, err := assets.LoadSliceComponent(file)
	require.NoError(t, err)

	type expectation struct {
		entity nwt.AzUInt64
		value  string
	}
	expected := make([]expectation, 0)
	for _, entity := range slice.Entities.Element {
		variation := game.FindVariationDataComponent(&entity)
		if variation == nil || variation.M_variationTableUniqueName == "" || variation.M_selectedVariant == "" {
			continue
		}
		row := assets.FindTableRow(string(variation.M_variationTableUniqueName), "VariantID", string(variation.M_selectedVariant))
		if row == nil {
			continue
		}
		for _, data := range variation.M_variantData.Element {
			if data.M_action != "Change Prefab Spawner Slice" {
				continue
			}
			target := game.FindEntityById(slice, data.M_entity.EntityId.Id)
			if game.FindPrefabSpawnerComponent(target) == nil {
				continue
			}
			expected = append(expected, expectation{
				entity: data.M_entity.EntityId.Id,
				value:  row.GetString(string(data.M_colName)),
			})
		}
	}
	if len(expected) == 0 {
		t.Skip("the slice has no prefab spawner variations")
	}

	game.ApplyVariationData(assets, slice)

	for _, it := range expected {
		prefab := game.FindPrefabSpawnerComponent(game.FindEntityById(slice, it.entity))
		require.NotNil(t, prefab)
		if it.value == "" {
			require.Empty(t, prefab.M_sliceAsset.Guid, "entity %v: an empty variant clears the slice", it.entity)
			require.Empty(t, prefab.M_aliasAsset.Hint, "entity %v: an empty variant clears the alias", it.entity)
		} else {
			require.Equal(t, it.value, string(prefab.M_aliasAsset.Hint), "entity %v: the variant sets the alias", it.entity)
		}
	}
}
