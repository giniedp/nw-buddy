package level

import (
	"nw-buddy/tools/rtti/nwt"
)

const (
	SnowComponentName = "Snow"
)

// ViewerSnowComponent is a snow volume (Snow gem SnowComponent). The engine keeps one global snow volume
// (C3DEngine::SetSnowSurfaceParams / SetSnowFallParams), centered on the entity position. It drives the deferred
// snow layer (FX_DeferredSnowLayer, DeferredSnow.cfx) and the falling snow (CSceneSnow).
type ViewerSnowComponent struct {
	Type    string `json:"type"` // Snow
	Enabled bool   `json:"enabled"`
	// surface (FX_DeferredSnowLayer)
	Radius          float32 `json:"radius"`
	SnowAmount      float32 `json:"snowAmount"`
	FrostAmount     float32 `json:"frostAmount"`
	SurfaceFreezing float32 `json:"surfaceFreezing"`
	SnowBrightness  float32 `json:"snowBrightness"`
	FrostBrightness float32 `json:"frostBrightness"`
	// falling snow (CSceneSnow)
	SnowFlakeCount         uint32  `json:"snowFlakeCount"`
	SnowFlakeSize          float32 `json:"snowFlakeSize"`
	SnowFallBrightness     float32 `json:"snowFallBrightness"`
	SnowFallGravityScale   float32 `json:"snowFallGravityScale"`
	SnowFallWindScale      float32 `json:"snowFallWindScale"`
	SnowFallTurbulence     float32 `json:"snowFallTurbulence"`
	SnowFallTurbulenceFreq float32 `json:"snowFallTurbulenceFreq"`
}

// LoadViewerSnow converts a SnowComponent
func LoadViewerSnow(v nwt.SnowComponent) *ViewerSnowComponent {
	o := v.Snow_Options
	return &ViewerSnowComponent{
		Type:                   SnowComponentName,
		Enabled:                bool(v.Enabled),
		Radius:                 float32(o.Radius),
		SnowAmount:             float32(o.SnowAmount),
		FrostAmount:            float32(o.FrostAmount),
		SurfaceFreezing:        float32(o.SurfaceFreezing),
		SnowBrightness:         float32(o.SnowBrightness),
		FrostBrightness:        float32(o.FrostBrightness),
		SnowFlakeCount:         uint32(o.SnowFlakeCount),
		SnowFlakeSize:          float32(o.SnowFlakeSize),
		SnowFallBrightness:     float32(o.SnowFallBrightness),
		SnowFallGravityScale:   float32(o.SnowFallGravityScale),
		SnowFallWindScale:      float32(o.SnowFallWindScale),
		SnowFallTurbulence:     float32(o.SnowFallTurbulence),
		SnowFallTurbulenceFreq: float32(o.SnowFallTurbulenceFreq),
	}
}
