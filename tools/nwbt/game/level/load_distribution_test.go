package level_test

import (
	"encoding/binary"
	"log/slog"
	"nw-buddy/tools/formats/distribution"
	"nw-buddy/tools/game"
	"nw-buddy/tools/game/level"
	"nw-buddy/tools/utils/env"
	"nw-buddy/tools/utils/logging"
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestLoadDistribution(t *testing.T) {
	slog.SetDefault(logging.DefaultTerminalHandler())

	assets, err := game.InitPackedAssets(env.GameDir())
	require.NoError(t, err)

	dir := level.NewRegionDirectory("newworld_vitaeeterna", "r_+04_+05")
	file, ok := assets.Archive.Lookup(dir.PathDistributionFile())
	require.True(t, ok)
	doc, err := distribution.Load(file)
	require.NoError(t, err)

	header, data := dir.LoadDistribution(assets)
	require.NotNil(t, header)
	require.Equal(t, doc.Region, header.Region)
	require.LessOrEqual(t, header.Count, len(doc.Positions))
	require.Greater(t, header.Count, 0)
	require.Len(t, data, header.Count*6)

	for i := range header.Count {
		typeIndex := binary.LittleEndian.Uint16(data[i*2:])
		require.Less(t, int(typeIndex), len(header.Types))
	}
	for _, item := range header.Types {
		require.NotEmpty(t, item.Meshes)
		for _, mesh := range item.Meshes {
			require.Less(t, mesh.Model, len(header.Models))
			require.Less(t, mesh.Material, len(header.Materials))
			require.NotContains(t, strings.ToLower(header.Models[mesh.Model]), "depleted")
		}
	}
}
