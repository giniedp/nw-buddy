package scan_test

import (
	"nw-buddy/tools/commands/pull/scan"
	"nw-buddy/tools/rtti/nwt"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestCollateVitals(t *testing.T) {
	_, vitals, _ := scan.CollateVitals([]scan.VitalsEntry{
		{
			VitalsID:    "vitals_id",
			Position:    nwt.AzVec3{1, 0, 0},
			MapID:       "map_id",
			DamageTable: "",
		},
		{
			VitalsID:    "vitals_id",
			Position:    nwt.AzVec3{1, 0, 0},
			MapID:       "map_id",
			DamageTable: "damage_table",
		},
	}, []scan.ScannedTerritory{}, make(map[string]float32), make(map[string]float32))

	assert.Equal(t, 1, len(vitals))
	assert.Equal(t, 1, len(vitals[0].Tables))

}
