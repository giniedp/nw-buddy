package level

import (
	"nw-buddy/tools/rtti/nwt"
)

const (
	WaterOceanComponentName = "WaterOcean"
)

// ViewerWaterOceanComponent is the ocean of a level (WaterModule WaterOceanComponent, mission entities).
// With the water feature enabled the game takes the ocean animation from the selected component and ignores the
// mission <OceanAnimation> values.
type ViewerWaterOceanComponent struct {
	Type string `json:"type"` // WaterOcean
	// OceanSettings.animation
	WindDirection float32 `json:"windDirection"`
	WindSpeed     float32 `json:"windSpeed"`
	WavesAmount   float32 `json:"wavesAmount"`
	WavesSize     float32 `json:"wavesSize"`
	WavesSpeed    float32 `json:"wavesSpeed"`
}

// LoadViewerWaterOcean converts a WaterOceanComponent
func LoadViewerWaterOcean(v nwt.WaterOceanComponent) *ViewerWaterOceanComponent {
	a := v.Data.Animation
	return &ViewerWaterOceanComponent{
		Type:          WaterOceanComponentName,
		WindDirection: float32(a.AnimationWindDirection),
		WindSpeed:     float32(a.AnimationWindSpeed),
		WavesAmount:   float32(a.AnimationWavesAmount),
		WavesSize:     float32(a.AnimationWavesSize),
		WavesSpeed:    float32(a.AnimationWavesSpeed),
	}
}
