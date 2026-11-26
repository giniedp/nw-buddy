package level

import (
	"nw-buddy/tools/rtti/nwt"
)

const WaterVolumeComponentName = "WaterVolume"

// ViewerWaterVolumeComponent is a water volume (Water gem): a flat water surface on top of the entity shape.
// The shape is in entity space, see findLmbrShape. Box and cylinder surfaces are at +height/2, prisms at +height.
type ViewerWaterVolumeComponent struct {
	Type     string       `json:"type"` // WaterVolume
	Material string       `json:"material"`
	Shape    *ViewerShape `json:"shape"`
	// FogColor is already multiplied with the FogColorMultiplier
	FogColor              [3]float32 `json:"fogColor"`
	FogDensity            float32    `json:"fogDensity"`
	FogColorAffectedBySun bool       `json:"fogColorAffectedBySun"`
	// texture coordinates per world unit
	SurfaceUScale          float32 `json:"surfaceUScale"`
	SurfaceVScale          float32 `json:"surfaceVScale"`
	MinSpec                uint32  `json:"minSpec"`
	ViewDistanceMultiplier float32 `json:"viewDistanceMultiplier"`
}

// LoadViewerWaterVolume reads the water volume and its shape component, nil if the entity has none of them
func LoadViewerWaterVolume(entity *nwt.AZ__Entity) *ViewerWaterVolumeComponent {
	var water *nwt.WaterVolumeCommon
	for _, component := range entity.Components.Element {
		if v, ok := component.(nwt.WaterVolumeComponent); ok {
			common := v.Common
			water = &common
			break
		}
	}
	if water == nil {
		return nil
	}
	shape := findLmbrShape(entity)
	if shape == nil || (shape.Kind != "box" && shape.Kind != "cylinder" && shape.Kind != "prism") {
		return nil
	}
	multiplier := float32(water.FogColorMultiplier)
	return &ViewerWaterVolumeComponent{
		Type:     WaterVolumeComponentName,
		Material: string(water.MaterialAsset.BaseClass1.AssetPath),
		Shape:    shape,
		FogColor: [3]float32{
			float32(water.FogColor[0]) * multiplier,
			float32(water.FogColor[1]) * multiplier,
			float32(water.FogColor[2]) * multiplier,
		},
		FogDensity:             float32(water.FogDensity),
		FogColorAffectedBySun:  bool(water.FogColorAffectedBySun),
		SurfaceUScale:          float32(water.SurfaceUScale),
		SurfaceVScale:          float32(water.SurfaceVScale),
		MinSpec:                uint32(water.MinSpec),
		ViewDistanceMultiplier: float32(water.ViewDistanceMultiplier),
	}
}
