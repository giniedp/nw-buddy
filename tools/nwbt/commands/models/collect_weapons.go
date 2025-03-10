package models

import (
	"fmt"
	"nw-buddy/tools/formats/gltf/importer"
	"nw-buddy/tools/utils/progress"
	"path"
	"strings"
)

func (c *Collector) CollectWeapons() {
	for _, table := range c.tables {
		if table.Schema != "WeaponItemDefinitions" {
			continue
		}
		bar := progress.Bar(len(table.Rows), table.Table)
		countStart := c.models.Len()

		data := table.RowsAsJSON()
		for _, row := range data {
			id := row.GetString("WeaponID")
			bar.Add(1)
			bar.Detail(id)

			file := strings.ToLower(path.Join("weapons", fmt.Sprintf("%s-%s", id, "SkinOverride1")))
			if !c.models.Has(file) {
				model := row.GetString("SkinOverride1")
				material := row.GetString("MaterialOverride1")
				model, material = c.resolveModelMaterial(model, material)
				if model != "" {
					group := importer.AssetGroup{}
					group.TargetFile = file
					group.Meshes = append(group.Meshes, importer.MeshAsset{
						ModelFile: model,
						MtlFile:   material,
					})
					c.models.Store(file, group)
				}
			}

			file = strings.ToLower(path.Join("weapons", fmt.Sprintf("%s-%s", id, "SkinOverride2")))
			if !c.models.Has(file) {
				model := row.GetString("SkinOverride2")
				material := row.GetString("MaterialOverride2")
				model, material = c.resolveModelMaterial(model, material)
				if model != "" {
					group := importer.AssetGroup{}
					group.TargetFile = file
					group.Meshes = append(group.Meshes, importer.MeshAsset{
						ModelFile: model,
						MtlFile:   material,
					})
					c.models.Store(file, group)
				}
			}

		}

		bar.Detail(fmt.Sprintf("%d models", c.models.Len()-countStart))
		bar.Close()
	}
}
