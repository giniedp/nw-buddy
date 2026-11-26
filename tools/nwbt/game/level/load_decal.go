package level

import (
	"nw-buddy/tools/rtti/nwt"
)

const (
	DecalComponentName = "Decal"
)

// ViewerDecalComponent is a projected decal (LmbrCentral DecalComponent).
//
// The decal box is the entity transform (rotation and scale = decal size, unit box ±1), scaled by Depth along its
// local z and moved by Offset, the projection runs along the box's local z (DecalComponent.h, DecalRenderNode).
type ViewerDecalComponent struct {
	Type     string `json:"type"` // Decal
	Material string `json:"material"`
	// deferred decals are drawn into the GBuffer as boxes, the game has 99% deferred (ProjectionType 2)
	Deferred       bool `json:"deferred,omitempty"`
	ProjectionType int  `json:"projectionType"`
	// box depth along the projection axis
	Depth float32 `json:"depth,omitempty,omitzero"`
	// box offset in entity space
	Offset       [3]float32 `json:"offset,omitempty,omitzero"`
	Opacity      float32    `json:"opacity,omitempty,omitzero"`
	SortPriority uint32     `json:"sortPriority,omitempty,omitzero"`
	Color        [4]float32 `json:"color,omitempty,omitzero"`
	// view distance: Max_View_Distance with the override flag, else the automatic distance
	MaxViewDistance        float32 `json:"maxViewDistance,omitempty,omitzero"`
	ViewDistanceMultiplier float32 `json:"viewDistanceMultiplier,omitempty,omitzero"`
	MinSpec                uint32  `json:"minSpec,omitempty,omitzero"`
}

// LoadViewerDecal converts a DecalComponent, nil for invisible decals or decals without a material
func LoadViewerDecal(v nwt.DecalComponent) *ViewerDecalComponent {
	c := v.DecalConfiguration
	material := string(c.Material.BaseClass1.AssetPath)
	if !bool(c.Visible) || material == "" {
		return nil
	}
	maxViewDistance := float32(c.Automatic_Max_View_Distance)
	if bool(c.Override_Automatic_Max_View_Distance) {
		maxViewDistance = float32(c.Max_View_Distance)
	}
	return &ViewerDecalComponent{
		Type:                   DecalComponentName,
		Material:               material,
		Deferred:               bool(c.Deferred),
		ProjectionType:         int(c.ProjectionType),
		Depth:                  float32(c.Depth),
		Offset:                 [3]float32{float32(c.Offset[0]), float32(c.Offset[1]), float32(c.Offset[2])},
		Opacity:                float32(c.Opacity),
		SortPriority:           uint32(c.SortPriority),
		Color:                  [4]float32{float32(c.Color[0]), float32(c.Color[1]), float32(c.Color[2]), float32(c.Color[3])},
		MaxViewDistance:        maxViewDistance,
		ViewDistanceMultiplier: float32(c.View_Distance_Multiplier),
		MinSpec:                uint32(c.Min_Spec),
	}
}
