package models

import (
	"fmt"
	"log/slog"
	"nw-buddy/tools/formats/gltf/importer"
	"nw-buddy/tools/game"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/rtti/nwt"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/logging"
	"nw-buddy/tools/utils/math"
	"nw-buddy/tools/utils/progress"
	"path"
	"strings"

	"github.com/spf13/cobra"
)

var cmdCollectHousing = &cobra.Command{
	Use:   "housing",
	Short: "Converts housing items",

	Run: runCollectHousing,
}

func init() {
	cmdCollectHousing.Flags().AddFlagSet(Cmd.Flags())
	cmdCollectHousing.Flags().StringVar(&flgIds, "ids", "", "comma separated list of ids to process")
}

func runCollectHousing(ccmd *cobra.Command, args []string) {
	ids := getCommaSeparatedList(flgIds)
	slog.SetDefault(logging.DefaultFileHandler())
	c := utils.Must(initCollector())
	c.CollectHousing(ids...)
	c.Process()
	slog.SetDefault(logging.DefaultTerminalHandler())
}

func (c *Collector) CollectHousing(ids ...string) {
	for table := range c.EachDatasheet() {
		if !strings.HasPrefix(table.Table, "HouseItems") {
			continue
		}
		bar := progress.Bar(len(table.Rows), table.Table)
		countStart := c.models.Len()

		data := table.RowsAsJSON()
		for _, row := range data {
			id := row.GetString("HouseItemID")
			bar.Add(1)
			bar.Detail(id)

			if !matchFilter(ids, id) {
				continue
			}

			prefabPath := row.GetString("PrefabPath")
			if prefabPath == "" {
				continue
			}
			slicePath := nwfs.NormalizePath(path.Join("slices", prefabPath))
			file := c.outputPath(slicePath)
			if !c.shouldProcess(file) {
				continue
			}

			group := c.collectPrefabPath(slicePath + ".dynamicslice")
			if len(group.Meshes) > 0 {
				group.TargetFile = file
				c.models.Store(group.TargetFile, group)
			}
		}

		bar.Detail(fmt.Sprintf("%d models", c.models.Len()-countStart))
		bar.Close()
	}
}

func (c *Collector) collectPrefabPath(sliceFile string) importer.AssetGroup {
	group := importer.AssetGroup{}
	file, ok := c.Archive.Lookup(sliceFile)
	if !ok {
		slog.Error("file not found", "slice", sliceFile)
		return group
	}

	c.WalkSlice(file, func(node *game.SliceNode) {
		for _, component := range node.Components {
			switch v := component.(type) {
			case nwt.MeshComponent:
				if !v.Static_Mesh_Render_Node.Visible {
					continue
				}
				modelAsset := v.Static_Mesh_Render_Node.Static_Mesh
				modelFile, err := c.LookupFileByAsset(modelAsset)
				if err != nil {
					slog.Error("model file not found", "asset", modelAsset, "err", err)
					continue
				}
				if modelFile == nil {
					continue
				}
				model := modelFile.Path()

				materialAsset := v.Static_Mesh_Render_Node.Material_Override_Asset
				materialFile, err := c.LookupFileByAsset(materialAsset)
				if err != nil {
					slog.Error("material not found", "asset", materialAsset, "err", err)
				}
				material := ""
				if materialFile != nil {
					material = materialFile.Path()
				}
				model, material = c.ResolveCgfAndMtl(model, material)

				group.Meshes = append(group.Meshes, importer.GeometryAsset{
					GeometryFile: model,
					MaterialFile: material,
					Entity: importer.Entity{
						Name:      string(node.Entity.Name),
						Transform: math.CryToGltfMat4(node.Transform),
					},
				})
			case nwt.SkinnedMeshComponent:
				if !v.Skinned_Mesh_Render_Node.Visible {
					continue
				}
				modelAsset := v.Skinned_Mesh_Render_Node.Skinned_Mesh
				modelFile, err := c.LookupFileByAsset(modelAsset)
				if err != nil {
					slog.Error("model file not found", "asset", modelAsset, "err", err)
					continue
				}
				if modelFile == nil {
					continue
				}
				model := modelFile.Path()
				materialAsset := v.Skinned_Mesh_Render_Node.Material_Override_Asset
				materialFile, err := c.LookupFileByAsset(materialAsset)
				if err != nil {
					slog.Error("material not found", "asset", materialAsset, "err", err)
				}
				material := ""
				if materialFile != nil {
					material = materialFile.Path()
				}
				if path.Ext(model) == ".cdf" {
					cdf, err := c.LoadCdf(model)
					if err != nil {
						slog.Warn("failed to resolve cdf asset", "file", model, "err", err)
						continue
					}
					attachments := cdf.SkinAndClothAttachments()
					for _, attch := range attachments {
						if attch.Material == "" && attch.AName == "outline" {
							// TODO: review
							// - /housing/house_housingitem_pet_entitlement_wolf_grim
							// - /housing/house_housingitem_pet_entitlement_tiger_black
							continue
						}
						if model, mtl := c.ResolveCgfAndMtl(attch.Binding, attch.Material, material); model != "" {
							group.Meshes = append(group.Meshes, importer.GeometryAsset{
								GeometryFile: model,
								MaterialFile: mtl,
								Entity: importer.Entity{
									Name:      string(node.Entity.Name),
									Transform: math.CryToGltfMat4(node.Transform),
								},
							})
						}
					}
				} else {
					if model, material = c.ResolveCgfAndMtl(model, material); model != "" {
						group.Meshes = append(group.Meshes, importer.GeometryAsset{
							GeometryFile: model,
							MaterialFile: material,
							Entity: importer.Entity{
								Name:      string(node.Entity.Name),
								Transform: math.CryToGltfMat4(node.Transform),
							},
						})
					}
				}
			case nwt.PrefabSpawnerComponent:
				node.WalkAsset(v.M_sliceAsset)
			default:
				break
			}
		}

	})
	return group
}
