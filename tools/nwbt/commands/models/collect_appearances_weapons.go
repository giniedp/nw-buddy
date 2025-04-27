package models

import (
	"fmt"
	"nw-buddy/tools/formats/gltf/importer"
	"nw-buddy/tools/utils/progress"
	"path"
)

func (c *Collector) CollectAppearancesWeapons(ids ...string) {
	for table := range c.EachDatasheet() {
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

			if !matchFilter(ids, id) {
				continue
			}

			scope := "weaponappearances"
			file := c.outputPath(path.Join(scope, fmt.Sprintf("%s-%s", id, "SkinOverride1")))
			if c.shouldProcess(file) {
				model := row.GetString("SkinOverride1")
				material := row.GetString("MaterialOverride1")
				if model != "" {
					group := importer.AssetGroup{}
					group.TargetFile = file
					group.Meshes = append(group.Meshes, importer.GeometryAsset{
						GeometryFile: model,
						MaterialFile: material,
					})
					c.models.Store(file, group)
				}
			}

			file = c.outputPath(path.Join(scope, fmt.Sprintf("%s-%s", id, "SkinOverride2")))
			if c.shouldProcess(file) {
				model := row.GetString("SkinOverride2")
				material := row.GetString("MaterialOverride2")
				if model != "" {
					group := importer.AssetGroup{}
					group.TargetFile = file
					group.Meshes = append(group.Meshes, importer.GeometryAsset{
						GeometryFile: model,
						MaterialFile: material,
					})
					c.models.Store(file, group)
				}
			}

			meshOverride := row.GetString("MeshOverride")
			if path.Ext(meshOverride) == ".cdf" {
				file = c.outputPath(path.Join(scope, fmt.Sprintf("%s-%s", id, "MeshOverride")))
				if c.shouldProcess(file) {
					cdf, _ := c.LoadCdf(meshOverride)
					if cdf != nil {
						group := importer.AssetGroup{TargetFile: file}
						for _, mesh := range cdf.SkinAndClothAttachments() {
							model, material := c.ResolveCgfAndMtl(mesh.Binding, mesh.Material)
							if model != "" {
								group.Meshes = append(group.Meshes, importer.GeometryAsset{
									GeometryFile: model,
									MaterialFile: material,
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
				file = c.outputPath(path.Join(scope, fmt.Sprintf("%s-%s", id, "MeshOverride")))
				if c.shouldProcess(file) {
					model, material := c.ResolveCgfAndMtl(meshOverride, "")
					if model != "" {
						group := importer.AssetGroup{TargetFile: file}
						group.Meshes = append(group.Meshes, importer.GeometryAsset{
							GeometryFile: model,
							MaterialFile: material,
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
