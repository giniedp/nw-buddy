package level

import (
	"log/slog"
	"nw-buddy/tools/formats/catalog"
	"nw-buddy/tools/game"
	"nw-buddy/tools/rtti/nwt"
	"path"
)

// rnrSubId is the catalog sub id of the RockNRoll shape asset that is a product of a .cgf
const rnrSubId = 100

// loadCollider converts a GameRigidBodyComponent. The shape comes from, in this order:
//   - the rnr asset of the configuration (or of the component)
//   - the inline collision shape (query shape)
//   - the LmbrCentral shape component on the same entity, e.g. polygon prism blockers
//   - the rnr product of the mesh on the same entity, bodies without explicit shape use the mesh collision
func loadCollider(assets *game.Assets, entity *nwt.AZ__Entity, body nwt.GameRigidBodyComponent) *ViewerColliderComponent {
	config := body.M_configuration
	result := &ViewerColliderComponent{
		Type:        ColliderComponentName,
		Filter:      firstString(string(config.M_strFilter), string(body.M_strFilter)),
		Dynamic:     bool(config.M_isDynamic || body.M_isDynamic),
		ScaleShapes: bool(config.M_scaleShapes || body.M_scaleShapes),
	}

	for _, asset := range []nwt.AzAsset{config.M_rnrAsset, body.M_rnrAsset} {
		if file, _ := assets.LookupFileByAsset(asset); file != nil {
			result.Rnr = file.Path()
			return result
		}
	}

	center := config.M_center
	if isZeroVec3(center) {
		center = body.M_center
	}
	for _, shape := range []any{config.M_collisionShape.Element, body.M_collisionShape.Element} {
		if result.Shape = convertQueryShape(shape, center); result.Shape != nil {
			return result
		}
	}

	if result.Shape = findLmbrShape(entity); result.Shape != nil {
		return result
	}

	if file := findMeshRnr(assets, entity); file != "" {
		result.Rnr = file
		return result
	}

	slog.Debug("rigid body without shape", "entity", entity.Name)
	return nil
}

// loadVolume converts query and trigger volumes. Volumes without a query shape use the LmbrCentral shape
// component of the entity.
func loadVolume(entity *nwt.AZ__Entity, component any) *ViewerVolumeComponent {
	result := &ViewerVolumeComponent{
		Type: VolumeComponentName,
	}
	var shape *ViewerShape
	switch v := component.(type) {
	case nwt.HitVolumeComponent:
		result.Volume = "hit"
		result.Filter = string(v.M_strFilter)
		result.Name = string(v.M_volumeName)
		shape = convertQueryShape(v.M_shape.Element, v.M_center)
	case nwt.DetectionVolumeComponent:
		result.Volume = "detection"
		result.Filter = string(v.M_strFilter)
		shape = convertQueryShape(v.M_shape.Element, v.M_center)
	case nwt.TriggerAreaComponent:
		result.Volume = "trigger"
	default:
		return nil
	}
	if shape == nil {
		shape = findLmbrShape(entity)
	}
	if shape == nil {
		return nil
	}
	result.Shape = *shape
	return result
}

// convertQueryShape converts a Javelin query shape (QueryShapeBox, ...) to a viewer shape.
//
// Conventions (see nw-model physics.rs): box is the full size, aabb are half extents,
// capsule height is the segment length along the axis (Z if zero), cylinder height is the full height along Z.
func convertQueryShape(shape any, center nwt.AzVec3) *ViewerShape {
	var result *ViewerShape
	switch v := shape.(type) {
	case nwt.QueryShapeBox:
		result = &ViewerShape{Kind: "box", HalfExtents: &[3]float32{float32(v.M_box[0]) * 0.5, float32(v.M_box[1]) * 0.5, float32(v.M_box[2]) * 0.5}}
	case nwt.QueryShapeAabb:
		result = &ViewerShape{Kind: "box", HalfExtents: &[3]float32{float32(v.M_aabb[0]), float32(v.M_aabb[1]), float32(v.M_aabb[2])}}
	case nwt.QueryShapeSphere:
		result = &ViewerShape{Kind: "sphere", Radius: float32(v.M_radius)}
	case nwt.QueryShapeCapsule:
		result = &ViewerShape{Kind: "capsule", Radius: float32(v.M_radius), Height: float32(v.M_height)}
		if !isZeroVec3(v.M_axis) {
			result.Axis = &[3]float32{float32(v.M_axis[0]), float32(v.M_axis[1]), float32(v.M_axis[2])}
		}
	case nwt.QueryShapeCylinder:
		result = &ViewerShape{Kind: "cylinder", Radius: float32(v.M_radius), Height: float32(v.M_height)}
	default:
		return nil
	}
	if !isZeroVec3(center) {
		result.Center = &[3]float32{float32(center[0]), float32(center[1]), float32(center[2])}
	}
	return result
}

// findLmbrShape converts the first LmbrCentral shape component of the entity.
//
// Conventions (Lumberyard): box dimensions are the full size, cylinder and capsule height is the full height
// along Z (capsule including the caps), the polygon prism is extruded along Z.
func findLmbrShape(entity *nwt.AZ__Entity) *ViewerShape {
	for _, component := range entity.Components.Element {
		switch v := component.(type) {
		case nwt.BoxShapeComponent:
			d := v.Configuration.Dimensions
			return &ViewerShape{Kind: "box", HalfExtents: &[3]float32{float32(d[0]) * 0.5, float32(d[1]) * 0.5, float32(d[2]) * 0.5}}
		case nwt.SphereShapeComponent:
			return &ViewerShape{Kind: "sphere", Radius: float32(v.Configuration.Radius)}
		case nwt.CylinderShapeComponent:
			return &ViewerShape{Kind: "cylinder", Radius: float32(v.Configuration.Radius), Height: float32(v.Configuration.Height)}
		case nwt.CapsuleShapeComponent:
			radius := float32(v.Configuration.Radius)
			return &ViewerShape{Kind: "capsule", Radius: radius, Height: max(float32(v.Configuration.Height)-2*radius, 0)}
		case nwt.PolygonPrismShapeComponent:
			prism := v.Configuration.PolygonPrism.Element
			vertices := make([][2]float32, 0, len(prism.VertexContainer.Vertices.Element))
			for _, it := range prism.VertexContainer.Vertices.Element {
				vertices = append(vertices, [2]float32{float32(it[0]), float32(it[1])})
			}
			if len(vertices) < 3 {
				return nil
			}
			return &ViewerShape{Kind: "prism", Height: float32(prism.Height), Vertices: vertices}
		}
	}
	return nil
}

// findMeshRnr returns the rnr product of the mesh on the entity, if any
func findMeshRnr(assets *game.Assets, entity *nwt.AZ__Entity) string {
	for _, component := range entity.Components.Element {
		var mesh nwt.AzAsset
		switch v := component.(type) {
		case nwt.MeshComponent:
			mesh = v.Static_Mesh_Render_Node.Static_Mesh
		case nwt.InstancedMeshComponent:
			mesh = v.Instanced_Mesh_Render_Node.BaseClass1.Static_Mesh
		default:
			continue
		}
		if catalog.UUID(mesh.Guid).IsZeroOrEmpty() {
			continue
		}
		asset := assets.Catalog.Lookup(mesh.Guid, rnrSubId)
		if asset != nil && path.Ext(asset.File) == ".rnr" {
			return asset.File
		}
	}
	return ""
}

func isZeroVec3(v nwt.AzVec3) bool {
	return v[0] == 0 && v[1] == 0 && v[2] == 0
}

func firstString(values ...string) string {
	for _, v := range values {
		if v != "" {
			return v
		}
	}
	return ""
}
