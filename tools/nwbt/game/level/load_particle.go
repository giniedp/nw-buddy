package level

import (
	"log/slog"
	"nw-buddy/tools/game"
	"nw-buddy/tools/rtti/nwt"
)

const ParticleComponentName = "Particle"

// ViewerParticleComponent is a particle emitter (ParticleComponent) that spawns an effect of a particle library.
// The library is a CryEngine particle library xml, served as is. The settings scale the effect (SpawnParams).
type ViewerParticleComponent struct {
	Type string `json:"type"` // Particle
	// file path of the particle library, e.g. libs/particles/buildables.xml
	Library string `json:"library"`
	// full effect name, library name first, e.g. Buildables.Global.Candle_Flame_01
	Emitter string `json:"emitter"`

	Color      [4]nwt.AzFloat32 `json:"color"`
	AlphaScale float32          `json:"alphaScale"`
	CountScale float32          `json:"countScale"`
	SizeScale  float32          `json:"sizeScale"`
	// ParticleSizeX/Y/Z and ParticleSizeRandom, per axis particle size scale
	ParticleSize       [3]float32 `json:"particleSize"`
	ParticleSizeRandom float32    `json:"particleSizeRandom,omitempty,omitzero"`
	SpeedScale         float32    `json:"speedScale"`
	TimeScale          float32    `json:"timeScale"`
	// emitter strength, negative uses the emitter age
	Strength    float32 `json:"strength"`
	PulsePeriod float32 `json:"pulsePeriod,omitempty,omitzero"`
	// simulate the effect to its steady state before it is shown
	Preroll                bool    `json:"preroll,omitempty"`
	IgnoreRotation         bool    `json:"ignoreRotation,omitempty"`
	NotAttached            bool    `json:"notAttached,omitempty"`
	ViewDistanceMultiplier float32 `json:"viewDistanceMultiplier"`
	UseLOD                 bool    `json:"useLod,omitempty"`
}

// LoadViewerParticle reads the particle emitter of the component, nil if it is disabled, invisible or has no effect
func LoadViewerParticle(assets *game.Assets, v nwt.ParticleComponent) *ViewerParticleComponent {
	settings := v.Particle
	if !bool(settings.Enable) || !bool(settings.Visible) || settings.SelectedEmitter == "" {
		return nil
	}
	file, err := assets.LookupFileByAssetId(v.ParticleLibraryAssetId)
	if err != nil || file == nil {
		if err != nil {
			slog.Warn("particle library not found", "emitter", settings.SelectedEmitter, "err", err)
		}
		return nil
	}
	return &ViewerParticleComponent{
		Type:                   ParticleComponentName,
		Library:                file.Path(),
		Emitter:                string(settings.SelectedEmitter),
		Color:                  [4]nwt.AzFloat32(settings.Color),
		AlphaScale:             float32(settings.Alpha_Scale),
		CountScale:             float32(settings.Particle_Count_Scale),
		SizeScale:              float32(settings.GlobalSizeScale),
		ParticleSize:           [3]float32{float32(settings.ParticleSizeX), float32(settings.ParticleSizeY), float32(settings.ParticleSizeZ)},
		ParticleSizeRandom:     float32(settings.ParticleSizeRandom),
		SpeedScale:             float32(settings.Speed_Scale),
		TimeScale:              float32(settings.Time_Scale),
		Strength:               float32(settings.Strength),
		PulsePeriod:            float32(settings.Pulse_Period),
		Preroll:                bool(settings.Pre_roll),
		IgnoreRotation:         bool(settings.Ignore_Rotation),
		NotAttached:            bool(settings.Not_Attached),
		ViewDistanceMultiplier: float32(settings.View_Distance_Multiplier),
		UseLOD:                 bool(settings.Use_LOD),
	}
}
