package models

import (
	"log/slog"
	"nw-buddy/tools/formats/catalog"
	"nw-buddy/tools/formats/gltf/importer"
	"nw-buddy/tools/formats/impostors"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/logging"
	"nw-buddy/tools/utils/math"
	"nw-buddy/tools/utils/math/mat4"
	"nw-buddy/tools/utils/progress"
	"path"
	"strings"

	"github.com/spf13/cobra"
)

var cmdCollectImpostors = &cobra.Command{
	Use:   "impostors",
	Short: "Converts impostors.json files to gltf",
	Long: strings.Trim(`
  Walks the impostors.json files to collect the geometries into a single model.
  Impostors are found a level directory like
    - sharedassets/coatlicue/LEVEL_NAME/regions/REGION_NAME/impostors.json
    - sharedassets/coatlicue/LEVEL_NAME/regions/REGION_NAME/poi_impostors.json`, "\n"),
	Run: runCollectImpostors,
	Example: strings.Trim(`
  nwbt models impostors --level nw_opr_004_trench
  nwbt models impostors --level nw_opr_004_trench --region r_+00_+00`, "\n"),
}

func init() {
	cmdCollectImpostors.Flags().AddFlagSet(Cmd.Flags())
	cmdCollectImpostors.Flags().StringVar(&flgLevel, "level", "nw_opr_004_trench", "The LEVEL_NAME in the coatlicue directory. Can be a glob expression.")
	cmdCollectImpostors.Flags().StringVar(&flgRegion, "region", "**", "The REGION_NAME in the coatlicue directory. Can be a glob expression.")
	cmdCollectImpostors.Flags().StringVarP(&flgOutFile, "file", "f", "", "If set, all impostors are merged into a single file. ")

}

func runCollectImpostors(ccmd *cobra.Command, args []string) {
	glob := path.Join("**", "coatlicue", flgLevel, "regions", flgRegion, "*impostors.json")
	slog.SetDefault(logging.DefaultFileHandler())
	c := utils.Must(initCollector())
	c.CollectImpostors(glob)
	c.Process()
	slog.SetDefault(logging.DefaultTerminalHandler())
}

func (c *Collector) CollectImpostors(glob string) {
	merge := flgOutFile != ""
	files, _ := c.Archive.Glob(glob)
	bar := progress.Bar(len(files), "impostors")
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

		if !strings.HasSuffix(file.Path(), "impostors.json") {
			continue
		}
		doc, err := impostors.Load(file)
		if err != nil {
			slog.Error("impostors not loaded", "file", file.Path(), "error", err)
			continue
		}
		for _, impostor := range doc.Impostors {

			assetId, _ := catalog.ParseAssetId(impostor.MeshAssetID)
			if assetId.IsZeroOrEmpty() {
				continue
			}
			asset := c.Catalog.LookupById(assetId)
			if asset == nil {
				slog.Error("asset not found", "asset", assetId)
				continue
			}
			modelFile, ok := c.Archive.Lookup(asset.File)
			if !ok {
				slog.Error("asset file not found", "asset", assetId, "file", asset.File)
				continue
			}
			model, material := c.ResolveCgfAndMtl(modelFile.Path(), "")

			transform := mat4.Identity()
			transform[12] = float32(impostor.WorldPosition.X)
			transform[13] = float32(impostor.WorldPosition.Y)

			group.Meshes = append(group.Meshes, importer.GeometryAsset{
				GeometryFile: model,
				MaterialFile: material,
				Entity: importer.Entity{
					//Name:      string(node.Entity.Name),
					Transform: math.CryToGltfMat4(transform),
				},
			})

		}
		if !merge && len(group.Meshes) > 0 {
			group.TargetFile = c.outputPath(utils.ReplaceExt(file.Path(), ""))
			c.models.Store(group.TargetFile, group)
		}
	}

	if merge && len(group.Meshes) > 0 {
		group.TargetFile = utils.ReplaceExt(flgOutFile, "")
		c.models.Store(flgOutFile, group)
	}
}
