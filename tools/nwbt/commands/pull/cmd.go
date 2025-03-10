package pull

import (
	"fmt"
	"log/slog"
	"nw-buddy/tools/constants"
	"nw-buddy/tools/formats/datasheet"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/env"
	"nw-buddy/tools/utils/logging"
	"nw-buddy/tools/utils/maps"
	"os"
	"path"
	"time"

	"github.com/spf13/cobra"
)

var flgGameDir string
var flgOutDataDir string
var flgOutTypeDir string
var flgUpdateImages bool
var flgWorkerCount uint32
var stats = &Stats{}

const (
	TASK_TABLES    = "tables"
	TASK_SLICES    = "slices"
	TASK_LOCALE    = "locale"
	TASK_IMAGES    = "images"
	TASK_SEARCH    = "search"
	TASK_SPELLS    = "spells"
	TASK_HEIGHTMAP = "heightmap"
	TASK_TYPES     = "types"
	TASK_CONSTANTS = "constants"
)

var tasks = []string{
	TASK_TABLES,
	TASK_LOCALE,
	TASK_SEARCH,
	TASK_TYPES,
	TASK_SLICES,
	TASK_SPELLS,
	TASK_IMAGES,
	TASK_CONSTANTS,
}

var description = fmt.Sprintf("%s%s", constants.NW_BUDDY_BANNER, `
Pulls data from .pak files specifically for nw-buddy purposes.
`)

var Cmd = &cobra.Command{
	Use:           "pull",
	Short:         "pulls data from .pak files specifically for nw-buddy purposes.",
	Long:          description,
	Run:           run,
	SilenceErrors: false,
}

func init() {
	Cmd.Flags().StringVarP(&flgGameDir, "game", "g", env.GameDir(), "game root directory")
	Cmd.Flags().StringVar(&flgOutDataDir, "out-data", env.PullDataDir(), "output directory for data")
	Cmd.Flags().StringVar(&flgOutTypeDir, "out-types", env.PullTypesDir(), "output directory for types ")
	Cmd.Flags().BoolVar(&flgUpdateImages, "update-images", false, "if true, existing images are ignored and re-processed")
	Cmd.Flags().Uint32VarP(&flgWorkerCount, "workers", "w", uint32(env.PreferredWorkerCount()), "number of workers to use for processing")

	Cmd.AddCommand(
		cmdPullConstants,
		cmdPullHeightmaps,
		cmdPullImages,
		cmdPullLocales,
		cmdPullSearch,
		cmdPullSpawns,
		cmdPullSpells,
		cmdPullTables,
		cmdPullTypes,
	)
}

func run(ccmd *cobra.Command, args []string) {
	if len(args) > 0 {
		slog.Error("unknown arguments", "args", args)
		return
	}
	ctx := NewPullContext()
	slog.SetDefault(logging.DefaultFileHandler())
	ctx.PullTables()
	ctx.PullLocales()
	ctx.PullSpells()
	ctx.PullSlices()
	ctx.PullImages()
	ctx.PullSearch()
	ctx.PullTypes()
	ctx.PullConstants()
	// ctx.PullHeightmaps()
	slog.SetDefault(logging.DefaultTerminalHandler())
	ctx.PrintStats()
}

type PullContext struct {
	tables       []*datasheet.Document
	locales      *maps.SafeDict[*maps.SafeDict[string]]
	archive      nwfs.Archive
	outDataDir   string
	outTypeDir   string
	updateImages bool
	workerCount  uint32
	startedAt    time.Time
}

func NewPullContext() *PullContext {
	ctx := &PullContext{}
	ctx.archive = utils.Must(nwfs.NewPakFS(flgGameDir))
	ctx.startedAt = time.Now()
	ctx.outDataDir = flgOutDataDir
	ctx.outTypeDir = flgOutTypeDir
	ctx.updateImages = flgUpdateImages
	ctx.workerCount = flgWorkerCount
	if ctx.workerCount == 0 {
		ctx.workerCount = 1
	}
	os.MkdirAll(ctx.outDataDir, os.ModePerm)
	os.MkdirAll(env.TempDir(), os.ModePerm)
	return ctx
}

func (ctx *PullContext) PullTables() {
	ctx.tables = pullTables(ctx.archive, ctx.outDataDir)
}

func (ctx *PullContext) PullSpells() {
	if ctx.tables == nil {
		ctx.PullTables()
	}
	pullSpells(ctx.tables, ctx.archive, path.Join(ctx.outDataDir, "generated"))
}

func (ctx *PullContext) PullSlices() {
	if ctx.tables == nil {
		ctx.PullTables()
	}
	pullSpawns(ctx.tables, ctx.archive, path.Join(ctx.outDataDir, "generated"))
}

func (ctx *PullContext) PullLocales() {
	ctx.locales = pullLocales(ctx.archive, path.Join(ctx.outDataDir, "localization"))
}

func (ctx *PullContext) PullImages() {
	pullImages(ctx.archive, ctx.outDataDir, ctx.updateImages)
}

func (ctx *PullContext) PullSearch() {
	if ctx.tables == nil {
		ctx.PullTables()
	}
	if ctx.locales == nil {
		ctx.PullLocales()
	}
	pullSearch(ctx.tables, ctx.locales, path.Join(ctx.outDataDir, "search"))
}

func (ctx *PullContext) PullTypes() {
	if ctx.tables == nil {
		ctx.PullTables()
	}
	pullTypes(ctx.tables, ctx.outTypeDir)
}

func (ctx *PullContext) PullConstants() {
	pullConstants(ctx.archive, ctx.outTypeDir)
}

func (ctx *PullContext) PullHeightmaps() {
	pullHeightmaps(ctx.archive, path.Join(ctx.outDataDir, "lyshineui", "worldtiles"))
}

func (ctx *PullContext) PrintStats() {
	slog.SetDefault(logging.DefaultTerminalHandler())
	stats.Print()
	slog.Info("pull complete", "duration", time.Since(ctx.startedAt))
}

type Blob struct {
	Path string
	Data []byte
}

func writeBlob(value *Blob, e error) (msg string, err error) {
	if value != nil {
		msg = value.Path
	}
	if e != nil {
		err = e
		return
	}
	outFile := value.Path
	os.MkdirAll(path.Dir(outFile), os.ModePerm)
	err = os.WriteFile(value.Path, value.Data, os.ModePerm)
	return
}

func findLocaleFiles(fs nwfs.Archive) []nwfs.File {
	return utils.Must(fs.Glob("localization/**.loc.xml"))
}

func findDatasheets(fs nwfs.Archive) []nwfs.File {
	return utils.Must(fs.Glob("**.datasheet"))
}
