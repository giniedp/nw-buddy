package scanner

import (
	"nw-buddy/tools/rtti/nwt"
	"testing"

	"github.com/stretchr/testify/require"
)

func testVitalModel(id string, cdf string, content string) *VitalModel {
	result := &VitalModel{content: content}
	result.Id = id
	result.Cdf = cdf
	result.Model = "vitals/" + id
	return result
}

func testVitalEntry(id string, model *VitalModel, x float32) VitalsEntry {
	result := VitalsEntry{VitalsID: id, Model: model, Level: 10}
	result.MapID = "map"
	result.Position = nwt.AzVec3{nwt.AzFloat32(x), 0, 0}
	return result
}

func testVitalTemplate(id string, model *VitalModel) VitalsEntry {
	return VitalsEntry{VitalsID: id, Model: model, Level: 20, Template: true}
}

func collateTestVitals(baseIds map[string]string, rows ...VitalsEntry) (map[string]ScannedVitalModel, map[string]*ScannedVital) {
	models, vitals, _ := CollateVitals(rows, nil, nil, nil, baseIds)
	modelsById := make(map[string]ScannedVitalModel)
	for _, it := range models {
		modelsById[it.Id] = it
	}
	vitalsById := make(map[string]*ScannedVital)
	for _, it := range vitals {
		vitalsById[it.VitalsID] = it
	}
	return modelsById, vitalsById
}

func TestCollateVitalsGroupsSpawns(t *testing.T) {
	a := testVitalModel("slices/a", "a.cdf", "")
	b := testVitalModel("slices/b", "b.cdf", "")
	models, vitals := collateTestVitals(nil,
		testVitalEntry("Wolf", b, 3),
		testVitalEntry("Wolf", a, 2),
		testVitalEntry("wolf", a, 1),
		// both at one position
		testVitalEntry("Wolf", a, 4),
		testVitalEntry("Wolf", b, 4),
	)
	require.Len(t, models, 2)
	wolf := vitals["wolf"]
	require.Equal(t, []string{"slices/a", "slices/b"}, wolf.Models)
	spawns := wolf.Spawns["map"]
	require.Len(t, spawns, 3)
	require.Equal(t, []Position{{1, 0}, {2, 0}}, spawns[0].Positions)
	require.Equal(t, []int{0}, spawns[0].Models)
	require.Equal(t, []Position{{3, 0}}, spawns[1].Positions)
	require.Equal(t, []int{1}, spawns[1].Models)
	require.Equal(t, []Position{{4, 0}}, spawns[2].Positions)
	require.Equal(t, []int{0, 1}, spawns[2].Models)
}

func TestCollateVitalsTemplates(t *testing.T) {
	a := testVitalModel("slices/a", "a.cdf", "")
	b := testVitalModel("slices/b", "b.cdf", "")
	models, vitals := collateTestVitals(nil,
		testVitalEntry("placed", a, 1),
		testVitalTemplate("placed", b),
		testVitalEntry("placedWithoutModel", nil, 1),
		testVitalTemplate("placedWithoutModel", b),
		testVitalTemplate("templateOnly", b),
	)
	require.Equal(t, []string{"slices/a"}, vitals["placed"].Models)
	require.Equal(t, []string{"slices/b"}, vitals["placedwithoutmodel"].Models)
	require.Equal(t, []int{10}, vitals["placedwithoutmodel"].Levels)
	require.Equal(t, []string{"slices/b"}, vitals["templateonly"].Models)
	require.Equal(t, []int{20}, vitals["templateonly"].Levels)
	require.Empty(t, vitals["templateonly"].Spawns)
	require.Equal(t, []string{"placedWithoutModel", "templateOnly"}, models["slices/b"].VitalIds)
}

func TestCollateVitalsMergesSliceCopies(t *testing.T) {
	models, vitals := collateTestVitals(nil,
		testVitalEntry("tower", testVitalModel("coatgen/1/tower_1", "", "parts"), 1),
		testVitalEntry("tower", testVitalModel("slices/tower", "", "parts"), 2),
		testVitalEntry("tower", testVitalModel("coatgen/2/tower_2", "", "other parts"), 3),
		testVitalEntry("pair", testVitalModel("slices/pair", "", "left"), 1),
		testVitalEntry("pair", testVitalModel("slices/pair-2", "", "right"), 2),
	)
	require.Len(t, models, 4)
	require.Equal(t, []string{"coatgen/2/tower_2", "slices/tower"}, vitals["tower"].Models)
	require.Equal(t, []string{"slices/pair", "slices/pair-2"}, vitals["pair"].Models)
}

func TestVitalModelFile(t *testing.T) {
	require.Equal(t, "vitals/a/boar.cdf", vitalModelFile("a/boar.cdf", "", ""))
	require.Equal(t, "vitals/a/boar.cdf~green", vitalModelFile("a/boar.cdf", "m/green.mtl", ""))
	require.Equal(t, "vitals/a/boar.cdf~~coat", vitalModelFile("a/boar.cdf", "", "m/coat.mtl"))
	require.Equal(t, "vitals/a/boar.cdf~green~~coat", vitalModelFile("a/boar.cdf", "m/green.mtl", "m/coat.mtl"))
}

func TestVitalModelKeyWithOvercoat(t *testing.T) {
	a := testVitalModel("slices/a", "a.cdf", "")
	b := testVitalModel("slices/a", "a.cdf", "")
	require.Equal(t, vitalModelKey(a), vitalModelKey(b))
	b.Overcoat = "coat.mtl"
	require.NotEqual(t, vitalModelKey(a), vitalModelKey(b))
}

func TestCollateVitalsRelatedModels(t *testing.T) {
	a := testVitalModel("slices/a", "a.cdf", "")
	_, vitals := collateTestVitals(
		map[string]string{"wolf_10": "wolf", "wolf_20": "wolf", "bear_10": "bear"},
		testVitalEntry("wolf_10", a, 1),
	)
	require.Empty(t, vitals["wolf_10"].RelatedModels)
	require.Empty(t, vitals["wolf_20"].Models)
	require.Equal(t, []string{"slices/a"}, vitals["wolf_20"].RelatedModels)
	require.NotContains(t, vitals, "bear_10")
}
