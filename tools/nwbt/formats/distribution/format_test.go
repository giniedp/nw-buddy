package distribution_test

import (
	"math"
	"nw-buddy/tools/formats/distribution"
	"nw-buddy/tools/utils/json"
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestRead(t *testing.T) {
	data, err := os.ReadFile("samples/region.distribution")
	assert.NoError(t, err)

	rec, err := distribution.Parse(data, "r_+03_+03/region.distribution")
	assert.NoError(t, err)
	assert.Equal(t, rec.Region[0], uint32(3))
	assert.Equal(t, rec.Region[1], uint32(3))
	json, err := json.MarshalJSON(rec, "", "\t")
	assert.NoError(t, err)
	os.WriteFile("samples/region.json", json, 0644)
}

func TestPlacements(t *testing.T) {
	data, err := os.ReadFile("samples/region.distribution")
	assert.NoError(t, err)
	rec, err := distribution.Parse(data, "r_+03_+03/region.distribution")
	assert.NoError(t, err)

	assert.Len(t, rec.Rotations, len(rec.Positions))
	assert.Len(t, rec.Scales, len(rec.Positions))
	for _, packed := range rec.Rotations {
		q := distribution.UnpackRotation(packed)
		length := math.Sqrt(float64(q[0]*q[0] + q[1]*q[1] + q[2]*q[2] + q[3]*q[3]))
		assert.InDelta(t, 1, length, 1e-4)
	}
	t.Logf("version height modes %d, point layers %d / %d", len(rec.HeightModes), len(rec.Positions2), len(rec.Positions3))
	t.Logf("types2 %v", distinct(rec.Types2))
	t.Logf("types3 %v", distinct(rec.Types3))
	t.Logf("scales %v", distinct(rec.Scales))
}

func distinct(values []byte) []byte {
	seen := map[byte]bool{}
	result := make([]byte, 0)
	for _, v := range values {
		if !seen[v] {
			seen[v] = true
			result = append(result, v)
		}
	}
	return result
}
