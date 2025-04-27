package gltf

import (
	"nw-buddy/tools/formats/gltf/importer"
)

func (d *Document) ImportCgfLights(lights []importer.LightAsset) {
	if len(lights) == 0 {
		return
	}
	data := make([]any, len(lights))
	for i, light := range lights {
		data = append(data, map[string]any{
			"type":      "point",
			"color":     light.Color,
			"intensity": light.Intensity,
			"range":     light.Range,
		})
		node, _ := d.NewNode()
		node.Extensions = map[string]any{
			"KHR_lights_punctual": map[string]any{
				"light": i,
			},
		}
		d.AddToScene(d.DefaultScene(), node)
	}
	if d.Extensions == nil {
		d.Extensions = map[string]any{}
	}
	d.Extensions["KHR_lights_punctual"] = map[string]any{
		"lights": data,
	}
}
