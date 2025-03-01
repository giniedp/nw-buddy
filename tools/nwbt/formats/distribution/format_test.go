package distribution_test

import (
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
