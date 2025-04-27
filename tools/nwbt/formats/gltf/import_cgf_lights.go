package gltf

import (
	"nw-buddy/tools/formats/gltf/importer"
	"nw-buddy/tools/utils/math/mat4"
)

func (d *Document) ImportCgfLights(lights []importer.LightAsset, intensityScale float32) {
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
		if light.Type == 2 {
			data[i]["type"] = "spot"
			data[i]["spot"] = map[string]any{
				"innerConeAngle": light.InnerConeAngle,
				"outerConeAngle": light.OuterConeAngle,
			}
		}

		node, _ := d.NewNode()
		node.Name = light.Entity.Name
		node.Extensions = map[string]any{
			"KHR_lights_punctual": map[string]any{
				"light": i,
			},
		}
		node.Matrix = mat4.ToFloat64(light.Entity.Transform)
		d.AddToScene(d.DefaultScene(), node)
	}
	if d.Extensions == nil {
		d.Extensions = map[string]any{}
	}
	d.Extensions["KHR_lights_punctual"] = map[string]any{
		"lights": data,
	}
}
