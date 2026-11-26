package level

import (
	"nw-buddy/tools/rtti/nwt"
)

const (
	FogVolumeComponentName = "FogVolume"
)

// ViewerFogVolumeComponent is a local fog volume (LmbrCentral FogVolumeComponent), injected into the froxel
// volumetric fog (InjectFogDensityCS).
//
// The values are the configuration as the engine receives it (FogUtils::FogConfigToFogParams). The volume is centered
// on the entity, Size comes from the BoxShapeComponent of the same entity (FogVolumeConfiguration::
// UpdateSizeFromEntityShape) and is scaled by the entity transform.
type ViewerFogVolumeComponent struct {
	Type string `json:"type"` // FogVolume
	// 0 = ellipsoid, 1 = box (rectangular prism)
	VolumeType int `json:"volumeType"`
	// full extent along the local axes (box shape dimensions), at least 0.001
	Size              [3]float32 `json:"size"`
	Color             [4]float32 `json:"color"`
	UseGlobalFogColor bool       `json:"useGlobalFogColor,omitempty"`
	IgnoresVisAreas   bool       `json:"ignoresVisAreas,omitempty"`
	AffectsAreaOnly   bool       `json:"affectsThisAreaOnly,omitempty"`
	// at least 0.01 (FogConfigToFogParams)
	GlobalDensity float32 `json:"globalDensity"`
	DensityOffset float32 `json:"densityOffset,omitempty,omitzero"`
	NearCutoff    float32 `json:"nearCutoff,omitempty,omitzero"`
	HdrDynamic    float32 `json:"hdrDynamic,omitempty,omitzero"`
	SoftEdges     float32 `json:"softEdges,omitempty,omitzero"`
	// height falloff: direction in degrees (longitude, latitude), shift and scale
	FallOffDirLong     float32 `json:"fallOffDirLong,omitempty,omitzero"`
	FallOffDirLatitude float32 `json:"fallOffDirLatitude,omitempty,omitzero"`
	FallOffShift       float32 `json:"fallOffShift,omitempty,omitzero"`
	FallOffScale       float32 `json:"fallOffScale,omitempty,omitzero"`
	// distance ramp from the camera
	RampStart     float32 `json:"rampStart,omitempty,omitzero"`
	RampEnd       float32 `json:"rampEnd,omitempty,omitzero"`
	RampInfluence float32 `json:"rampInfluence,omitempty,omitzero"`
	WindInfluence float32 `json:"windInfluence,omitempty,omitzero"`
	// 3D density noise
	DensityNoiseScale         float32    `json:"densityNoiseScale,omitempty,omitzero"`
	DensityNoiseOffset        float32    `json:"densityNoiseOffset,omitempty,omitzero"`
	DensityNoiseTimeFrequency float32    `json:"densityNoiseTimeFrequency,omitempty,omitzero"`
	DensityNoiseFrequency     [3]float32 `json:"densityNoiseFrequency,omitempty,omitzero"`
	// view distance multiplier of the render node
	DistMult   float32 `json:"distMult,omitempty,omitzero"`
	EngineSpec uint32  `json:"engineSpec,omitempty,omitzero"`
}

// LoadViewerFogVolume converts a FogVolumeComponent, the size is taken from the BoxShapeComponent of the entity
func LoadViewerFogVolume(entity *nwt.AZ__Entity, v nwt.FogVolumeComponent) *ViewerFogVolumeComponent {
	c := v.FogVolumeConfiguration
	if c.VolumeType < 0 {
		return nil
	}
	size := [3]float32{1, 1, 1}
	for _, component := range entity.Components.Element {
		if box, ok := component.(nwt.BoxShapeComponent); ok {
			d := box.Configuration.Dimensions
			size = [3]float32{float32(d[0]), float32(d[1]), float32(d[2])}
		}
	}
	for i := range size {
		size[i] = max(size[i], 0.001)
	}
	return &ViewerFogVolumeComponent{
		Type:                      FogVolumeComponentName,
		VolumeType:                int(c.VolumeType),
		Size:                      size,
		Color:                     [4]float32{float32(c.Color[0]), float32(c.Color[1]), float32(c.Color[2]), float32(c.Color[3])},
		UseGlobalFogColor:         bool(c.UseGlobalFogColor),
		IgnoresVisAreas:           bool(c.IgnoresVisAreas),
		AffectsAreaOnly:           bool(c.AffectsThisAreaOnly),
		GlobalDensity:             max(0.01, float32(c.GlobalDensity)),
		DensityOffset:             float32(c.DensityOffset),
		NearCutoff:                float32(c.NearCutoff),
		HdrDynamic:                float32(c.HdrDynamic),
		SoftEdges:                 float32(c.SoftEdges),
		FallOffDirLong:            float32(c.FallOffDirLong),
		FallOffDirLatitude:        float32(c.FallOffDirLatitude),
		FallOffShift:              float32(c.FallOffShift),
		FallOffScale:              float32(c.FallOffScale),
		RampStart:                 float32(c.RampStart),
		RampEnd:                   float32(c.RampEnd),
		RampInfluence:             float32(c.RampInfluence),
		WindInfluence:             float32(c.WindInfluence),
		DensityNoiseScale:         float32(c.DensityNoiseScale),
		DensityNoiseOffset:        float32(c.DensityNoiseOffset),
		DensityNoiseTimeFrequency: float32(c.DensityNoiseTimeFrequency),
		DensityNoiseFrequency:     [3]float32{float32(c.DensityNoiseFrequency[0]), float32(c.DensityNoiseFrequency[1]), float32(c.DensityNoiseFrequency[2])},
		DistMult:                  float32(c.DistMult),
		EngineSpec:                uint32(c.EngineSpec),
	}
}
