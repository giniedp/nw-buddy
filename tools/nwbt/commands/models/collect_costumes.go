package models

import (
	"fmt"
	"nw-buddy/tools/formats/gltf/importer"
	"nw-buddy/tools/utils/progress"
	"path"
	"strings"
)

func (c *Collector) CollectCostumes() {
	for _, table := range c.tables {
		if table.Schema != "CostumeChangeData" {
			continue
		}
		bar := progress.Bar(len(table.Rows), table.Table)
		countStart := c.models.Len()

		data := table.RowsAsJSON()
		for _, row := range data {
			id := row.GetString("CostumeChangeId")
			bar.Add(1)
			bar.Detail(id)

			model := row.GetString("CostumeChangeMesh")
			file := strings.ToLower(path.Join("costumechanges", id))

			if path.Ext(model) != ".cdf" {
				continue
			}
			asset, err := c.resolveCdfAsset(model, false)
			if err != nil {
				continue
			}
			group := importer.AssetGroup{}
			group.TargetFile = file
			for _, mesh := range asset.attachments {
				model, mtl := c.resolveModelMaterial(mesh.Binding, mesh.Material)
				if model != "" {
					group.Meshes = append(group.Meshes, importer.MeshAsset{
						ModelFile: model,
						MtlFile:   mtl,
					})
				}
			}
			if len(group.Meshes) > 0 {
				group.TargetFile = file
				c.models.Store(file, group)
			}
		}

		bar.Detail(fmt.Sprintf("%d models", c.models.Len()-countStart))
		bar.Close()
	}
}
