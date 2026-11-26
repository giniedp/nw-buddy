package level

import (
	"fmt"
	"nw-buddy/tools/rtti/nwt"
)

const (
	RoadComponentName  = "Road"
	RiverComponentName = "River"
)

// ViewerRoadComponent is a road or river of the RoadsAndRivers gem: a strip of geometry along the entity spline,
// rendered with the material (decal for roads). Spline vertices are in entity space.
type ViewerRoadComponent struct {
	Type     string `json:"type"` // Road | River
	Material string `json:"material"`
	// DefaultWidth of the spline geometry, Widths are per spline vertex offsets added to it
	Width                  float32      `json:"width"`
	Widths                 []float32    `json:"widths,omitempty"`
	SegmentLength          float32      `json:"segmentLength"`
	TileLength             float32      `json:"tileLength"`
	SortPriority           int32        `json:"sortPriority"`
	MinSpec                uint32       `json:"minSpec"`
	ViewDistanceMultiplier float32      `json:"viewDistanceMultiplier"`
	Spline                 ViewerSpline `json:"spline"`
	River                  *ViewerRiver `json:"river,omitempty"`
}

type ViewerSpline struct {
	Type        string             `json:"type"` // Linear | Bezier | CatmullRom
	Closed      bool               `json:"closed"`
	Vertices    [][3]float32       `json:"vertices"`
	Bezier      []ViewerBezierData `json:"bezier,omitempty"`
	Granularity uint16             `json:"granularity,omitempty"`
	// CatmullRom knot parameterization, 0 uniform, 0.5 centripetal, 1 chordal
	KnotParameterization float32 `json:"knotParameterization,omitempty"`
}

// ViewerBezierData holds the control points of a bezier spline vertex, absolute in entity space like the vertex
type ViewerBezierData struct {
	Back    [3]float32 `json:"back"`
	Forward [3]float32 `json:"forward"`
	Angle   float32    `json:"angle"`
}

type ViewerRiver struct {
	TileWidth           float32    `json:"tileWidth"`
	WaterVolumeDepth    float32    `json:"waterVolumeDepth"`
	WaterStreamSpeed    float32    `json:"waterStreamSpeed"`
	WaterFogDensity     float32    `json:"waterFogDensity"`
	FogColor            [4]float32 `json:"fogColor"`
	FogColorScale       float32    `json:"fogColorScale"`
	WidthFadeDist       float32    `json:"widthFadeDist"`
	LengthStartFadeDist float32    `json:"lengthStartFadeDist"`
	LengthEndFadeDist   float32    `json:"lengthEndFadeDist"`
}

// LoadViewerRoad reads the road or river and the spline component of an entity, nil if it has none of them
func LoadViewerRoad(entity *nwt.AZ__Entity) *ViewerRoadComponent {
	var result *ViewerRoadComponent
	var spline *nwt.SplineComponent
	for _, component := range entity.Components.Element {
		switch v := component.(type) {
		case nwt.RoadComponent:
			result = newViewerRoad(RoadComponentName, v.Road.BaseClass1, string(v.Road.Material.BaseClass1.AssetPath))
		case nwt.RiverComponent:
			river := v.River
			result = newViewerRoad(RiverComponentName, river.BaseClass1, string(river.Material.BaseClass1.AssetPath))
			result.River = &ViewerRiver{
				TileWidth:           float32(river.TileWidth),
				WaterVolumeDepth:    float32(river.WaterVolumeDepth),
				WaterStreamSpeed:    float32(river.WaterStreamSpeed),
				WaterFogDensity:     float32(river.WaterFogDensity),
				FogColor:            [4]float32{float32(river.FogColor[0]), float32(river.FogColor[1]), float32(river.FogColor[2]), float32(river.FogColor[3])},
				FogColorScale:       float32(river.FogColorScale),
				WidthFadeDist:       float32(river.WidthFadeDist),
				LengthStartFadeDist: float32(river.LengthStartFadeDist),
				LengthEndFadeDist:   float32(river.LengthEndFadeDist),
			}
		case nwt.SplineComponent:
			s := v
			spline = &s
		}
	}
	if result == nil || spline == nil {
		return nil
	}
	result.Spline = loadViewerSpline(spline)
	if len(result.Spline.Vertices) < 2 {
		return nil
	}
	return result
}

func newViewerRoad(kind string, geo nwt.SplineGeometry, material string) *ViewerRoadComponent {
	result := &ViewerRoadComponent{
		Type:                   kind,
		Material:               material,
		Width:                  float32(geo.Width.DefaultWidth),
		SegmentLength:          float32(geo.SegmentLength),
		TileLength:             float32(geo.TileLength),
		SortPriority:           int32(geo.SortPriority),
		MinSpec:                uint32(geo.MinSpec),
		ViewDistanceMultiplier: float32(geo.ViewDistanceMultiplier),
	}
	for _, w := range geo.Width.WidthAttribute.Elements.Element {
		result.Widths = append(result.Widths, float32(w))
	}
	return result
}

func loadViewerSpline(c *nwt.SplineComponent) ViewerSpline {
	result := ViewerSpline{}
	var base *nwt.Spline
	switch s := c.Configuration.Spline.Element.(type) {
	case nwt.LinearSpline:
		result.Type = "Linear"
		base = &s.BaseClass1
	case *nwt.LinearSpline:
		result.Type = "Linear"
		base = &s.BaseClass1
	case nwt.BezierSpline:
		result.Type = "Bezier"
		base = &s.BaseClass1
		result.Granularity = uint16(s.Granularity)
		result.Bezier = loadBezierData(s.Bezier_Data.Element)
	case *nwt.BezierSpline:
		result.Type = "Bezier"
		base = &s.BaseClass1
		result.Granularity = uint16(s.Granularity)
		result.Bezier = loadBezierData(s.Bezier_Data.Element)
	case nwt.CatmullRomSpline:
		result.Type = "CatmullRom"
		base = &s.BaseClass1
		result.Granularity = uint16(s.Granularity)
		result.KnotParameterization = float32(s.KnotParameterization)
	case *nwt.CatmullRomSpline:
		result.Type = "CatmullRom"
		base = &s.BaseClass1
		result.Granularity = uint16(s.Granularity)
		result.KnotParameterization = float32(s.KnotParameterization)
	default:
		result.Type = fmt.Sprintf("%T", s)
	}
	if base == nil {
		return result
	}
	result.Closed = bool(base.Closed)
	for _, v := range base.Vertices.Vertices.Element {
		result.Vertices = append(result.Vertices, [3]float32{float32(v[0]), float32(v[1]), float32(v[2])})
	}
	return result
}

func loadBezierData(list []nwt.BezierData) []ViewerBezierData {
	result := make([]ViewerBezierData, 0, len(list))
	for _, b := range list {
		result = append(result, ViewerBezierData{
			Back:    [3]float32{float32(b.Back[0]), float32(b.Back[1]), float32(b.Back[2])},
			Forward: [3]float32{float32(b.Forward[0]), float32(b.Forward[1]), float32(b.Forward[2])},
			Angle:   float32(b.Angle),
		})
	}
	return result
}
