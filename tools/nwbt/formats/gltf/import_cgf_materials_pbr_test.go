package gltf

import (
	"math"
	"testing"

	"nw-buddy/tools/formats/mtl"

	"github.com/qmuntal/gltf"
)

func TestPbrMappingOfAllShaders(t *testing.T) {
	blended := map[string]bool{
		"Fxmeshadvancedtransp": true, "GeometryBeam": true, "GeometryBeamSimple": true, "GeometryFog": true,
		"GeometryFogNoVertAlpha": true, "MeshParticle": true, "ParticleImposter": true, "Particles": true,
		"DistanceClouds": true, "Silhouette_visible": true, "Silhouette_always": true, "Silhouette_xray": true,
	}
	shaders := []string{
		"Illum", "Illum_OceanSplash", "Vegetation", "HumanSkin", "Hair", "Glass", "FxMeshAdvanced", "Water", "WaterVolume",
		"TerrainTileComposite", "Hologram", "",
	}
	for shader := range blended {
		shaders = append(shaders, shader)
	}
	for _, shader := range shaders {
		doc := NewDocument()
		m := mtl.Material{}
		m.Shader = shader
		material := &gltf.Material{}
		doc.augmentMaterialWithPbr(material, &m, ImportCgfMaterialsOptions{})
		if material.PBRMetallicRoughness == nil || material.PBRMetallicRoughness.BaseColorFactor == nil {
			t.Errorf("%q: no base color", shader)
		}
		if got := material.AlphaMode == gltf.AlphaBlend; got != blended[shader] {
			t.Errorf("%q: blended %v", shader, got)
		}
	}
}

func fxTranspInputs(genMask string, emittance []float32, params map[string]string) pbrInputs {
	m := mtl.Material{}
	m.Shader = "Fxmeshadvancedtransp"
	m.StringGenMask = genMask
	m.Emittance = emittance
	m.Params = (*mtl.PublicParams)(nil).WithOverrides(params)
	return newPbrInputs(&m)
}

func TestFxTranspAlpha(t *testing.T) {
	near := func(a float64, b float64) bool {
		return math.Abs(a-b) < 1e-3
	}
	if got := fxTranspInputs("", nil, nil).fxTranspAlpha(); !near(got, 1) {
		t.Errorf("defaults: got %v", got)
	}
	got := fxTranspInputs("", nil, map[string]string{"GlobalAlphaFill": "2", "GlobalAlphaStrength": "0.15"}).fxTranspAlpha()
	if !near(got, 0.15) {
		t.Errorf("strength: got %v", got)
	}
	// spectral_green: the fade is at most 0.79^24.77
	got = fxTranspInputs("%USE_INTERSECTION_FADE", nil, map[string]string{
		"INTERSECT_FADE_INV": "0.21", "INTERSECT_FADE_FALLOFF": "24.77", "GlobalAlphaFalloff": "2.78",
	}).fxTranspAlpha()
	if !near(got, 0) {
		t.Errorf("fade: got %v", got)
	}
	// a rim is less than the full surface
	got = fxTranspInputs("%USE_INSIDE_FRESNEL_ALPHA", nil, map[string]string{"FRESNEL_IN_FALLOFF": "8"}).fxTranspAlpha()
	if got <= 0 || got >= 0.5 {
		t.Errorf("rim: got %v", got)
	}
}

func TestFxTranspTint(t *testing.T) {
	p := fxTranspInputs("", []float32{0.5, 0.25, 0, 4}, nil)
	material := &gltf.Material{PBRMetallicRoughness: &gltf.PBRMetallicRoughness{}, Extensions: gltf.Extensions{}}
	NewDocument().pbrFxTransp(material, p)
	got := *material.PBRMetallicRoughness.BaseColorFactor
	if got[0] != 1 || got[1] != 0.5 || got[2] != 0 {
		t.Errorf("hue: got %v", got)
	}
}
