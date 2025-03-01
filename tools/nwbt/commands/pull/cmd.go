package pull

import (
	"fmt"
	"log/slog"
	"nw-buddy/tools/formats/datasheet"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/env"
	"nw-buddy/tools/utils/logging"
	"nw-buddy/tools/utils/maps"
	"os"
	"path"
	"slices"
	"time"

	"github.com/spf13/cobra"
)

var flgGameDir string
var flgOutDataDir string
var flgOutTypeDir string
var flgModes []string
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
	// heightmaps are not finished yet
	// TASK_HEIGHTMAP,
}

var Cmd = &cobra.Command{
	Use:           "pull",
	Short:         "pulls data from .pak files specifically for nw-buddy purposes.",
	Long:          ``,
	Run:           run,
	SilenceErrors: false,
	Args:          args,
	ValidArgs:     tasks,
}

func init() {
	Cmd.Flags().StringVarP(&flgGameDir, "game", "g", env.GameDir(), "game root directory")
	Cmd.Flags().StringVar(&flgOutDataDir, "out-data", env.PullDataDir(), "output directory for data")
	Cmd.Flags().StringVar(&flgOutTypeDir, "out-types", env.PullTypesDir(), "output directory for types ")
	Cmd.Flags().BoolVar(&flgUpdateImages, "update-images", false, "if true, existing images are ignored and re-processed")
	Cmd.Flags().Uint32VarP(&flgWorkerCount, "workers", "w", uint32(env.PreferredWorkerCount()), "number of workers to use for processing")
}

func args(cmd *cobra.Command, args []string) error {
	if len(args) == 0 {
		flgModes = tasks
		return nil
	}
	for _, arg := range args {
		if !slices.Contains(tasks, arg) {
			return fmt.Errorf("invalid task name: %s", arg)
		}
		flgModes = append(flgModes, arg)
	}
	return nil
}

func run(ccmd *cobra.Command, args []string) {
	startTime := time.Now()

	if flgWorkerCount == 0 {
		flgWorkerCount = 1
	}

	slog.SetDefault(logging.DefaultFileHandler())

	os.MkdirAll(flgOutDataDir, os.ModePerm)
	os.MkdirAll(env.TempDir(), os.ModePerm)

	fs := utils.Must(nwfs.NewPakFS(flgGameDir))
	var tables []*datasheet.Document
	var locales *maps.SafeDict[*maps.SafeDict[string]]
	for _, task := range BuildTaskList(flgModes) {
		switch task {
		case TASK_TABLES:
			tables = pullTables(fs, flgOutDataDir)
		case TASK_SPELLS:
			if tables == nil {
				panic("tables should not be nil")
			}
			pullSpells(tables, fs, path.Join(flgOutDataDir, "generated"))
		case TASK_SLICES:
			if tables == nil {
				panic("tables should not be nil")
			}
			pullSpawns(tables, fs, path.Join(flgOutDataDir, "generated"))
		case TASK_LOCALE:
			locales = pullLocales(fs, path.Join(flgOutDataDir, "localization"))
		case TASK_IMAGES:
			pullImages(fs, flgOutDataDir, flgUpdateImages)
		case TASK_SEARCH:
			if locales == nil {
				panic("locales should not be nil")
			}
			if tables == nil {
				panic("tables should not be nil")
			}
			pullSearch(tables, locales, path.Join(flgOutDataDir, "search"))
		case TASK_TYPES:
			if tables == nil {
				panic("tables should not be nil")
			}
			pullTypes(tables, flgOutTypeDir)
		case TASK_CONSTANTS:
			pullConstants(fs, flgOutTypeDir)
		case TASK_HEIGHTMAP:
			pullHeightmaps(fs, env.TempDir())
		}
	}
	slog.SetDefault(logging.DefaultTerminalHandler())
	stats.Print()
	slog.Info("pull complete", "duration", time.Since(startTime))
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

func BuildTaskList(tasks []string) []string {
	needsTables := []string{
		TASK_SLICES,
		TASK_TYPES,
		TASK_SPELLS,
		TASK_SEARCH,
	}
	needsLocale := []string{
		TASK_SEARCH,
	}

	if !slices.Contains(tasks, TASK_TABLES) {
		for _, task := range needsTables {
			if slices.Contains(tasks, task) {
				tasks = append(tasks, TASK_TABLES)
				break
			}
		}
	}

	if !slices.Contains(tasks, TASK_LOCALE) {
		for _, task := range needsLocale {
			if slices.Contains(tasks, task) {
				tasks = append(tasks, TASK_LOCALE)
				break
			}
		}
	}

	slices.SortFunc(tasks, func(a, b string) int {
		// TASK_TABLES and TASK_LOCALE should be done first, every thing else can be done in any order
		if a == TASK_TABLES && b == TASK_LOCALE {
			return -1
		}
		if a == TASK_LOCALE && b == TASK_TABLES {
			return 1
		}
		if a == TASK_TABLES || a == TASK_LOCALE {
			return -1
		}
		if b == TASK_TABLES || b == TASK_LOCALE {
			return 1
		}
		return 0
	})
	return tasks
}
