package models

import (
	"log/slog"
	"nw-buddy/tools/formats/capitals"
	"nw-buddy/tools/formats/gltf"
	"nw-buddy/tools/formats/gltf/importer"
	"nw-buddy/tools/game"
	"nw-buddy/tools/rtti/nwt"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/logging"
	"nw-buddy/tools/utils/progress"
	"path"
	"strings"

	"github.com/spf13/cobra"
)

var cmdCollectCapitals = &cobra.Command{
	Use:   "capitals",
	Short: "Converts .capitals.json files to gltf",
	Long: strings.Trim(`
  Walks the .capitals.json files and the referenced slices to collect the models and materials.
  Capitals are found a level directory like
    - sharedassets/coatlicue/LEVEL_NAME/regions/REGION_NAME/capitals/**/CAPITAL_NAME.capitals.json.`, "\n"),
	Run: runCollectCapitals,
	Example: strings.Trim(`
  nwbt models capitals --level nw_opr_004_trench
  nwbt models capitals --level nw_opr_004_trench --region r_+00_+00
  nwbt models capitals --level nw_opr_004_trench --name *_art`, "\n"),
}

func init() {
	cmdCollectCapitals.Flags().AddFlagSet(Cmd.Flags())
	cmdCollectCapitals.Flags().StringVar(&flgLevel, "level", "ftue_v2", "The LEVEL_NAME in the coatlicue directory. Can be a glob expression.")
	cmdCollectCapitals.Flags().StringVar(&flgRegion, "region", "**", "The REGION_NAME in the coatlicue directory. Can be a glob expression.")
	cmdCollectCapitals.Flags().StringVar(&flgName, "name", "*", "The CAPITAL_NAME to process. Can be a glob expression.")
	cmdCollectCapitals.Flags().StringVarP(&flgOutFile, "file", "f", "", "If set, all capitals are merged into a single file. ")
}

func runCollectCapitals(ccmd *cobra.Command, args []string) {
	glob := path.Join("**", "coatlicue", flgLevel, "regions", flgRegion, "**", flgName+".capitals.json")
	slog.SetDefault(logging.DefaultFileHandler())
	c := utils.Must(initCollector())
	c.CollectCapitals(glob)
	c.Convert()
	slog.SetDefault(logging.DefaultTerminalHandler())
}

func (c *Collector) CollectCapitals(glob string) {
	merge := flgOutFile != ""
	files, _ := c.Archive.Glob(glob)
	bar := progress.Bar(len(files), "capitals")
	defer func() {
		bar.Detail("")
		bar.Close()
	}()

	group := importer.AssetGroup{}
	for _, file := range files {
		bar.Detail(file.Path())
		bar.Add(1)
		if !merge {
			group = importer.AssetGroup{}
		}
		if !strings.HasSuffix(file.Path(), ".capitals.json") {
			continue
		}
		capital, err := capitals.Load(file)
		if err != nil {
			slog.Error("capital not loaded", "file", file.Path(), "error", err)
			continue
		}
		for _, cap := range capital.Capitals {
			file := c.ResolveDynamicSliceNameToFile(cap.SliceName)
			if file == nil {
				slog.Error("file not found", "slice", cap.SliceName)
				continue
			}
			c.WalkSlice(file, func(node *game.EntityNode) {

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
						model, material = c.ResolveModelMaterialPair(model, material)

						group.Meshes = append(group.Meshes, importer.GeometryAsset{
							GeometryFile: model,
							MaterialFile: material,
							Entity: importer.Entity{
								Name:      string(node.Entity.Name),
								Transform: gltf.CryToGltfMat4(gltf.Mat4Multiply(cap.Transform().ToMat4(), node.Transform)),
							},
						})
					//case nwt.SkinnedMeshComponent:
					// do something with v
					case nwt.PrefabSpawnerComponent:
						node.WalkAsset(v.M_sliceAsset)
					default:
						break
					}
				}

			})
		}
		if !merge && len(group.Meshes) > 0 {
			group.TargetFile = c.targetPath(utils.ReplaceExt(file.Path(), ""))
			c.models.Store(group.TargetFile, group)
		}
	}

	if merge && len(group.Meshes) > 0 {
		group.TargetFile = c.targetPath(utils.ReplaceExt(flgOutFile, ""))
		c.models.Store(group.TargetFile, group)
	}
}
