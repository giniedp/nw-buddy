package models

import (
	"log/slog"
	"nw-buddy/tools/formats/capitals"
	"nw-buddy/tools/formats/gltf/importer"
	"nw-buddy/tools/game"
	"nw-buddy/tools/game/slicemodel"
	"nw-buddy/tools/rtti/nwt"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/logging"
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
			slicemodel.Collect(c.Assets, file, slicemodel.Options{
				Root: &rootTransform,
				Visit: func(node *game.SliceNode, component any, world mat4.Data, group *importer.AssetGroup) {
					light, ok := component.(nwt.LightComponent)
					if !ok || !bool(light.LightConfiguration.Visible) {
						return
					}
					if asset, ok := c.lightAsset(string(node.Entity.Name), light.LightConfiguration, world); ok {
						group.Lights = append(group.Lights, asset)
					}
				},
			}, &group)
		}
		if !merge && len(group.Geometries) > 0 {
			group.TargetFile = c.outputPath(utils.ReplaceExt(file.Path(), ""))
			c.models.Store(group.TargetFile, group)
		}
	}

	if merge && len(group.Geometries) > 0 {
		group.TargetFile = c.outputPath(utils.ReplaceExt(flgOutFile, ""))
		c.models.Store(group.TargetFile, group)
	}
}
