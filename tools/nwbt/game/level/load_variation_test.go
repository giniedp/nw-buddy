package level_test

import (
	"log/slog"
	"nw-buddy/tools/game"
	"nw-buddy/tools/game/level"
	"nw-buddy/tools/utils/env"
	"nw-buddy/tools/utils/logging"
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
)

// spawnedByEntity maps the entity names of a slice to the lower case slice files their prefab spawners spawn
func spawnedByEntity(slice level.ViewerSlice) map[string]string {
	result := make(map[string]string)
	for _, entity := range slice.Entities {
		for _, component := range entity.Components {
			if spawner, ok := component.(level.ViewerPrefabSpawnerComponent); ok {
				result[entity.Name] = strings.ToLower(spawner.Slice.Hint)
			}
		}
	}
	return result
}

func TestLoadSliceVariant(t *testing.T) {
	slog.SetDefault(logging.DefaultTerminalHandler())

	assets, err := game.InitPackedAssets(env.GameDir())
	require.NoError(t, err)
	file, ok := assets.Archive.Lookup("slices/gatherables/master_quest_instanced.dynamicslice")
	require.True(t, ok)

	load := func(variant string) map[string]string {
		slice, err := level.LoadViewerSlice(assets, file, variant, nil)
		require.NoError(t, err)
		return spawnedByEntity(slice)
	}

	// the master shows its default visual, the cart
	master := load("")
	require.Contains(t, master["Visual_Healthy"], "brokencart")

	// a row without visual slices spawns no visual
	none := load("09a_m15_imprisonspell")
	for _, name := range []string{"Visual_Healthy", "Visual_Depleted", "Visual_NotOnRequiredQuest", "Visual_Basemesh"} {
		require.NotContains(t, none, name)
	}

	// the base mesh of the row
	basemesh := load("0402_gruelbarrel")
	require.Equal(t, "slices/interactobjects/gruel/worldevent_object_0402_gruelbarrel_01.dynamicslice", basemesh["Visual_Basemesh"])
	require.NotContains(t, basemesh, "Visual_Healthy")

	// a player on no quest sees the NotOnRequiredQuest visual
	notOnQuest := load("0302_hidingbarrel")
	require.Contains(t, notOnQuest["Visual_NotOnRequiredQuest"], "hidingbarrel")
	require.NotContains(t, notOnQuest, "Visual_Healthy")
	require.NotContains(t, notOnQuest, "Visual_Depleted")
}
