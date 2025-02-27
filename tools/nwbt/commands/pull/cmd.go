package pull

import (
	"fmt"
	"nw-buddy/tools/formats/datasheet"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/env"
	"os"
	"path"
	"slices"

	"github.com/spf13/cobra"
)

var flgGameDir string
var flgOutputDir string
var flgModes []string
var flgUpdateImages bool
var flgWorkerCount uint32

const (
	TASK_TABLES    = "tables"
	TASK_SLICES    = "slices"
	TASK_LOCALE    = "locale"
	TASK_IMAGES    = "images"
	TASK_SEARCH    = "search"
	TASK_HEIGHTMAP = "heightmap"
	TASK_TYPES     = "types"
)

var tasks = []string{
	TASK_TABLES,
	TASK_LOCALE,
	TASK_TYPES,
	TASK_SLICES,
	TASK_IMAGES,
	TASK_SEARCH,
	TASK_HEIGHTMAP,
}

var Cmd = &cobra.Command{
	Use:           "pull",
	Short:         "pulls data from .pak files specifically for nw-buddy purposes.",
	Long:          ``,
	Run:           run,
	SilenceErrors: false,
	Args:          args,
}

func init() {
	Cmd.Flags().StringVarP(&flgGameDir, "game", "g", env.GameDir(), "game root directory")
	Cmd.Flags().StringVarP(&flgOutputDir, "out", "o", env.PullDataDir(), "output directory")
	Cmd.Flags().BoolVar(&flgUpdateImages, "update-images", false, "if true, existing images are ignored and re-processed")
	Cmd.Flags().Uint32VarP(&flgWorkerCount, "workers", "w", 10, "number of workers to use for processing")
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
	if flgWorkerCount == 0 {
		flgWorkerCount = 1
	}

	os.MkdirAll(flgOutputDir, os.ModePerm)
	os.MkdirAll(env.TempDir(), os.ModePerm)

	fs := utils.Must(nwfs.NewPakFS(flgGameDir))
	var tables []*datasheet.Document
	var locales *utils.Record[*utils.Record[string]]
	for _, task := range BuildTaskList(flgModes) {
		switch task {
		case TASK_TABLES:
			tables = pullTables(fs, flgOutputDir)
		case TASK_SLICES:
			if tables == nil {
				panic("tables should not be nil")
			}
			pullSpawns(tables, fs, path.Join(flgOutputDir, "generated"))
		case TASK_LOCALE:
			locales = pullLocales(fs, flgOutputDir)
		case TASK_IMAGES:
			pullImages(fs, flgOutputDir, flgUpdateImages)
		case TASK_SEARCH:
			if locales == nil {
				panic("locales should not be nil")
			}
			if tables == nil {
				panic("tables should not be nil")
			}
			pullSearch(tables, locales, path.Join(flgOutputDir, "search"))
		case TASK_TYPES:
			if tables == nil {
				panic("tables should not be nil")
			}
			pullTypes(tables, flgOutputDir)
		case TASK_HEIGHTMAP:
			// runHeightmap(fs, flgOutputDir)
		}
	}
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
	if slices.Contains(tasks, TASK_SEARCH) && !slices.Contains(tasks, TASK_TABLES) {
		tasks = append(tasks, TASK_TABLES)
	}
	if slices.Contains(tasks, TASK_SEARCH) && !slices.Contains(tasks, TASK_LOCALE) {
		tasks = append(tasks, TASK_LOCALE)
	}
	if slices.Contains(tasks, TASK_TYPES) && !slices.Contains(tasks, TASK_TABLES) {
		tasks = append(tasks, TASK_TABLES)
	}
	if slices.Contains(tasks, TASK_SLICES) && !slices.Contains(tasks, TASK_TABLES) {
		tasks = append(tasks, TASK_TABLES)
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
