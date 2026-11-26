package inspect

import (
	"fmt"
	"io"
	"nw-buddy/tools/game"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/env"
	"nw-buddy/tools/utils/progress"
	"os"
	"path"
	"strings"
	"text/tabwriter"

	"github.com/spf13/cobra"
)

var flgGameDir string
var flgRegex bool
var flgRanges bool
var flgRangesJson string
var flgRoadsJson string
var flgDecalsJson string
var flgWaterJson string
var flgSliceDataJson string
var Cmd = &cobra.Command{
	Use:           "inspect",
	Short:         "inspects a file",
	Long:          ``,
	Run:           run,
	SilenceErrors: false,
}

func init() {
	Cmd.Flags().StringVarP(&flgGameDir, "game", "g", env.GameDir(), "game root directory")
	Cmd.Flags().BoolVar(&flgRanges, "ranges", false, "collects view distances (activation ranges) of slices instead of the default slice inspection")
	Cmd.Flags().StringVar(&flgRangesJson, "ranges-json", "", "writes the collected ranges as json rows to this file (implies --ranges)")
	Cmd.Flags().StringVar(&flgSliceDataJson, "slicedata-json", "", "writes the mesh entries of .slicedata files as json rows to this file")
	Cmd.Flags().StringVar(&flgRoadsJson, "roads-json", "", "collects road and river entities (RoadsAndRivers gem) with their splines and writes them as json rows to this file")
	Cmd.Flags().StringVar(&flgDecalsJson, "decals-json", "", "collects entities with decal and snow components and writes them as json to this file")
	Cmd.Flags().StringVar(&flgWaterJson, "water-json", "", "collects entities with water components (water volumes, ocean) and writes them as json rows to this file")
}

func run(ccmd *cobra.Command, args []string) {
	assets := utils.Must(game.InitPackedAssets(flgGameDir))
	files, err := listFiles(args, flgRegex, assets.Archive)
	if err != nil {
		panic(err)
	}
	inspectors := make(map[string]Inscpector)

	bar := progress.Bar(len(files), "Processing")
	for _, file := range files {
		ext := path.Ext(file.Path())
		switch ext {
		case ".skin":
			fallthrough
		case ".cgf":
			if inspectors[ext] == nil {
				inspectors[ext] = &CgfInspector{}
			}
			inspectors[ext].Inspect(assets, file)
		case ".mtl":
			if inspectors[ext] == nil {
				inspectors[ext] = NewMtlInspector()
			}
			inspectors[ext].Inspect(assets, file)
		case ".dynamicslice":
			if inspectors[ext] == nil && flgWaterJson != "" {
				inspectors[ext] = NewWaterInspector()
			}
			if inspectors[ext] == nil && flgRoadsJson != "" {
				inspectors[ext] = NewRoadInspector()
			}
			if inspectors[ext] == nil && flgDecalsJson != "" {
				inspectors[ext] = NewDecalInspector()
			}
			if inspectors[ext] == nil && (flgRanges || flgRangesJson != "") {
				inspectors[ext] = NewRangeInspector()
			}
			if inspectors[ext] == nil {
				inspectors[ext] = NewSliceInspector()
			}
			inspectors[ext].Inspect(assets, file)
		case ".meta":
			if inspectors[ext] == nil {
				inspectors[ext] = &SliceMetaInspector{}
			}
			inspectors[ext].Inspect(assets, file)
		case ".slicedata":
			if inspectors[ext] == nil {
				inspectors[ext] = NewSliceDataInspector()
			}
			inspectors[ext].Inspect(assets, file)
		default:
			if inspectors[ext] == nil {
				inspectors[ext] = &UnsupportedInspector{}
			}
			inspectors[ext].Inspect(assets, file)
		}
		bar.Add(1)
	}
	bar.Wait()
	for key := range inspectors {
		inspectors[key].Print(os.Stdout)
	}
}

func listFiles(args []string, regex bool, fs nwfs.Archive) ([]nwfs.File, error) {
	if len(args) == 0 {
		return fs.List()
	}
	if regex {
		for i := range args {
			args[i] = strings.ToLower(args[i])
			args[i] = strings.ReplaceAll(args[i], "\\\\", "\\")
		}
		return fs.Match(args...)
	}
	for i := range args {
		args[i] = strings.ToLower(args[i])
	}
	return fs.Glob(args...)
}

type Inscpector interface {
	Inspect(assets *game.Assets, file nwfs.File)
	Print(w io.Writer)
}

type UnsupportedInspector struct {
	count int
}

func (it *UnsupportedInspector) Inspect(assets *game.Assets, file nwfs.File) {
	it.count += 1
}
func (it *UnsupportedInspector) Print(w io.Writer) {
	tw := tabwriter.NewWriter(w, 0, 0, 1, ' ', 0)
	fmt.Fprintf(tw, "other\t%d\n", it.count)
	tw.Flush()
}
