package models

import (
	"log/slog"
	"nw-buddy/tools/formats/capitals"
	"nw-buddy/tools/formats/gltf/importer"
	"nw-buddy/tools/game"
	"nw-buddy/tools/rtti/nwt"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/logging"
	"nw-buddy/tools/utils/math"
	"nw-buddy/tools/utils/math/mat4"
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

const RAD_TO_DEG = 180.0 / 3.14159265358979323846
const DEG_TO_RAD = 3.14159265358979323846 / 180.0

func runCollectCapitals(ccmd *cobra.Command, args []string) {
	glob := path.Join("**", "coatlicue", flgLevel, "regions", flgRegion, "**", flgName+".capitals.json")
	slog.SetDefault(logging.DefaultFileHandler())
	c := utils.Must(initCollector())
	c.CollectCapitals(glob)
	c.Process()
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
			rootTransform := cap.Transform().ToMat4()
			file := c.ResolveDynamicSliceByName(cap.SliceName)
			if file == nil {
				slog.Error("file not found", "slice", cap.SliceName)
				continue
			}
			c.WalkSlice(file, func(node *game.SliceNode) {
				for _, component := range node.Components {
					switch v := component.(type) {
					case nwt.LightComponent:
						config := v.LightConfiguration
						if !config.Visible {
							break
						}
						switch config.LightType {
						case 0:
							group.Lights = append(group.Lights, importer.LightAsset{
								Type:      0,
								Color:     [3]float32{float32(config.Color[0]), float32(config.Color[1]), float32(config.Color[2])},
								Intensity: float32(config.DiffuseMultiplier),
								Range:     float32(config.PointMaxDistance),
								Entity: importer.Entity{
									Name:      string(node.Entity.Name),
									Transform: math.CryToGltfMat4(mat4.Multiply(rootTransform, node.Transform)),
								},
							})
						case 1: // area
							group.Lights = append(group.Lights, importer.LightAsset{
								Type:      0,
								Color:     [3]float32{float32(config.Color[0]), float32(config.Color[1]), float32(config.Color[2])},
								Intensity: float32(config.DiffuseMultiplier),
								Range:     float32(config.PointMaxDistance),
								Entity: importer.Entity{
									Name:      string(node.Entity.Name),
									Transform: math.CryToGltfMat4(mat4.Multiply(rootTransform, node.Transform)),
								},
							})
						case 2: // projector
							group.Lights = append(group.Lights, importer.LightAsset{
								Type:           0,
								Color:          [3]float32{float32(config.Color[0]), float32(config.Color[1]), float32(config.Color[2])},
								Intensity:      float32(config.DiffuseMultiplier),
								Range:          float32(config.PointMaxDistance),
								OuterConeAngle: float32(config.ProjectorFOV/2.0) * DEG_TO_RAD,
								Entity: importer.Entity{
									Name:      string(node.Entity.Name),
									Transform: math.CryToGltfMat4(mat4.Multiply(rootTransform, node.Transform)),
								},
							})
						case 3: // probe
						}
					case nwt.InstancedMeshComponent:
						meshNode := v.Instanced_mesh_render_node.BaseClass1
						if !meshNode.Visible {
							continue
						}
						modelAsset := meshNode.Static_Mesh
						modelFile, err := c.LookupFileByAsset(modelAsset)
						if err != nil {
							slog.Error("model file not found", "asset", modelAsset, "err", err)
							continue
						}
						if modelFile == nil {
							continue
						}
						model := modelFile.Path()

						materialAsset := meshNode.Material_Override_Asset
						materialFile, err := c.LookupFileByAsset(materialAsset)
						if err != nil {
							slog.Error("material not found", "asset", materialAsset, "err", err)
						}
						material := ""
						if materialFile != nil {
							material = materialFile.Path()
						}
						model, material = c.ResolveCgfAndMtl(model, material)
						for _, instance := range v.Instanced_mesh_render_node.Instance_transforms.Element {
							transform := mat4.FromAzTransform(instance)
							transform = mat4.Multiply(node.Transform, transform)
							group.Meshes = append(group.Meshes, importer.GeometryAsset{
								GeometryFile: model,
								MaterialFile: material,
								Entity: importer.Entity{
									Name:      string(node.Entity.Name),
									Transform: math.CryToGltfMat4(mat4.Multiply(rootTransform, transform)),
								},
							})
						}
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
								Transform: math.CryToGltfMat4(mat4.Multiply(rootTransform, node.Transform)),
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
						cdf, err := c.LoadCdf(model)
						if err != nil {
							slog.Warn("failed to resolve cdf asset", "file", model, "err", err)
							continue
						}

						for _, attachment := range cdf.SkinAndClothAttachments() {
							if model, mtl := c.ResolveCgfAndMtl(attachment.Binding, attachment.Material, material); model != "" {
								group.Meshes = append(group.Meshes, importer.GeometryAsset{
									Entity: importer.Entity{
										Name:      attachment.AName,
										Transform: math.CryToGltfMat4(mat4.Multiply(rootTransform, node.Transform)),
									},
									GeometryFile: model,
									MaterialFile: mtl,
									SkipSkin:     true,
								})
							}
						}
					case nwt.SpawnerComponent:
						facet, ok := v.BaseClass1.M_serverFacetPtr.(nwt.SpawnerComponentServerFacet)
						if !ok {
							break
						}
						if !node.WalkAsset(facet.M_aliasAsset) {
							node.WalkAsset(facet.M_sliceAsset)
						}
					case nwt.PrefabSpawnerComponent:
						if !node.WalkAsset(v.M_aliasAsset) {
							node.WalkAsset(v.M_sliceAsset)
						}
					case nwt.PointSpawnerComponent:
						if !node.WalkAsset(v.BaseClass1.M_aliasAsset) {
							node.WalkAsset(v.BaseClass1.M_sliceAsset)
						}
					case nwt.EncounterComponent:
						nodeTranform := node.Transform
						for _, timeline := range v.M_spawntimeline.Element {
							if len(timeline.M_spawnlocations.Element) == 0 && timeline.M_count > 0 {
								if !node.WalkAsset(timeline.M_aliasAsset) {
									node.WalkAsset(timeline.M_sliceAsset)
								}
							} else {
								for _, location := range timeline.M_spawnlocations.Element {
									entity := game.FindEntityById(node.Slice, location.EntityId.Id)
									if entity == nil {
										continue
									}
									node.Transform = mat4.Multiply(nodeTranform, game.FindTransformMat4(entity))
									if !node.WalkAsset(timeline.M_aliasAsset) {
										node.WalkAsset(timeline.M_sliceAsset)
									}
								}
							}
						}
						node.Transform = nodeTranform
					case nwt.AreaSpawnerComponent:
						facet, ok := v.BaseClass1.M_serverFacetPtr.(nwt.AreaSpawnerComponentServerFacet)
						if !ok {
							break
						}
						nodeTransform := node.Transform
						for _, location := range facet.M_locations.Element {
							entity := game.FindEntityById(node.Slice, location.EntityId.Id)
							if entity == nil {
								continue
							}
							node.Transform = mat4.Multiply(nodeTransform, game.FindTransformMat4(entity))
							if !node.WalkAsset(facet.M_aliasAsset) {
								node.WalkAsset(facet.M_sliceAsset)
							}
						}
						node.Transform = nodeTransform
					default:
						break
					}
				}

			})
		}
		if !merge && len(group.Meshes) > 0 {
			group.TargetFile = c.outputPath(utils.ReplaceExt(file.Path(), ""))
			c.models.Store(group.TargetFile, group)
		}
	}

	if merge && len(group.Meshes) > 0 {
		group.TargetFile = c.outputPath(utils.ReplaceExt(flgOutFile, ""))
		c.models.Store(group.TargetFile, group)
	}
}
