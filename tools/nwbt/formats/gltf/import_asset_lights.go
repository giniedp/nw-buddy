package gltf

import (
	"nw-buddy/tools/formats/gltf/importer"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/math/mat4"
)

// spotFromProjector rotates 90° about Y: local -Z onto local -X
var spotFromProjector = mat4.Data{
	0, 0, -1, 0,
	0, 1, 0, 0,
	1, 0, 0, 0,
	0, 0, 0, 1,
}

// ImportAssetEntities adds empty nodes at the entity transforms, their Extra becomes the node extras (e.g. the game's
// time of day zones and fog volumes of a scene export)
func (doc *Document) ImportAssetEntities(entities []importer.Entity) {
	for _, entity := range entities {
		node, _ := doc.NewNode()
		node.Name = entity.Name
		node.Matrix = mat4.ToFloat64(entity.Transform)
		if len(entity.Extra) > 0 {
			node.Extras = entity.Extra
		}
		doc.AddToScene(doc.DefaultScene(), node)
	}
}

func (doc *Document) ImportAssetLights(lights []importer.LightAsset, intensityScale float32) {
	if len(lights) == 0 {
		return
	}
	data := make([]map[string]any, len(lights))
	for i, light := range lights {

		data[i] = map[string]any{
			"type":      "point",
			"color":     light.Color,
			"intensity": light.Intensity * intensityScale,
			"range":     light.Range,
		}
		if len(light.Extras) > 0 {
			data[i]["extras"] = light.Extras
		}
		if light.Type == 2 {
			data[i]["type"] = "spot"
			data[i]["spot"] = map[string]any{
				"innerConeAngle": light.InnerConeAngle,
				"outerConeAngle": light.OuterConeAngle,
			}
		}

		node, _ := doc.NewNode()
		node.Name = light.Entity.Name
		node.Extensions = map[string]any{
			"KHR_lights_punctual": map[string]any{
				"light": i,
			},
		}
		transform := light.Entity.Transform
		if light.Type == 2 {
			// projectors emit along the game's local +X, which is glTF's local -X; glTF spots emit along local -Z
			transform = mat4.Multiply(transform, spotFromProjector)
		}
		node.Matrix = mat4.ToFloat64(transform)
		doc.AddToScene(doc.DefaultScene(), node)
	}
	doc.ExtensionsUsed = utils.AppendUniq(doc.ExtensionsUsed, "KHR_lights_punctual")
	if doc.Extensions == nil {
		doc.Extensions = map[string]any{}
	}
	doc.Extensions["KHR_lights_punctual"] = map[string]any{
		"lights": data,
	}
}
