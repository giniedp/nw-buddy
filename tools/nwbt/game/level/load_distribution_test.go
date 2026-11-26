package level_test

import (
	"encoding/binary"
	"log/slog"
	"math"
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
	// types, posX, posY (u16), scales (u8), padding to 4 bytes, rotations (u32)
	rotationOffset := (header.Count*7 + 3) / 4 * 4
	require.Len(t, data, rotationOffset+header.Count*4)

	for i := range header.Count {
		typeIndex := binary.LittleEndian.Uint16(data[i*2:])
		require.Less(t, int(typeIndex), len(header.Types))

		q := distribution.UnpackRotation(binary.LittleEndian.Uint32(data[rotationOffset+i*4:]))
		require.InDelta(t, 1, math.Sqrt(float64(q[0]*q[0]+q[1]*q[1]+q[2]*q[2]+q[3]*q[3])), 1e-4)
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
