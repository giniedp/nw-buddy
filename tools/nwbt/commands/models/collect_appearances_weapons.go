package models

import (
	"fmt"
	"nw-buddy/tools/formats/gltf/importer"
	"nw-buddy/tools/utils/progress"
	"path"
	"strings"
)

func (c *Collector) CollectAppearancesWeapons() {
	for _, table := range c.tables {
		if table.Schema != "WeaponAppearanceDefinitions" {
			continue
		}
		bar := progress.Bar(len(table.Rows), table.Table)
		data := table.RowsAsJSON()
		countStart := c.models.Len()
		for _, row := range data {
			id := row.GetString("WeaponAppearanceID")
			bar.Add(1)
			bar.Detail(id)

			scope := "weapons"
			if strings.Contains(strings.ToLower(table.Table), "instrument") {
				scope = "instruments"
			}
			if strings.Contains(strings.ToLower(table.Table), "mounts") {
				scope = "mounts"
			}

			file := strings.ToLower(path.Join(scope, fmt.Sprintf("%s-%s", id, "SkinOverride1")))
			if !c.models.Has(file) {
				model := row.GetString("SkinOverride1")
				material := row.GetString("MaterialOverride1")
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

			file = strings.ToLower(path.Join(scope, fmt.Sprintf("%s-%s", id, "SkinOverride2")))
			if !c.models.Has(file) {
				model := row.GetString("SkinOverride2")
				material := row.GetString("MaterialOverride2")
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

			meshOverride := row.GetString("MeshOverride")
			if path.Ext(meshOverride) == ".cdf" {
				file = strings.ToLower(path.Join(scope, fmt.Sprintf("%s-%s", id, "MeshOverride")))
				if !c.models.Has(file) {
					asset, _ := c.resolveCdfAsset(meshOverride, false)
					if asset != nil {
						group := importer.AssetGroup{}
						group.TargetFile = file
						for _, mesh := range asset.attachments {
							model, material := c.resolveModelMaterial(mesh.Binding, mesh.Material)
							if model != "" {
								group.Meshes = append(group.Meshes, importer.MeshAsset{
									ModelFile: model,
									MtlFile:   material,
								})
							}
						}
						if len(group.Meshes) > 0 {
							c.models.Store(file, group)
						}
					}
				}
			}
			if path.Ext(meshOverride) == ".cgf" {
				file = strings.ToLower(path.Join(scope, fmt.Sprintf("%s-%s", id, "MeshOverride")))
				if !c.models.Has(file) {
					model, material := c.resolveModelMaterial(meshOverride, "")
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
		}

		bar.Detail(fmt.Sprintf("%d models", c.models.Len()-countStart))
		bar.Close()
	}
}
