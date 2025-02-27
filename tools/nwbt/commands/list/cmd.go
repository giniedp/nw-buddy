package list

import (
	"log/slog"
	"nw-buddy/tools/formats/azcs"
	"nw-buddy/tools/formats/dds"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/env"
	"nw-buddy/tools/utils/progress"
	"path"
	"strings"

	"github.com/spf13/cobra"
)

var flgGameDir string
var flgGlobPattern string
var flgRegxPattern string
var flgShowAzcsExt bool
var Cmd = &cobra.Command{
	Use:           "list",
	Short:         "lists the file names",
	Long:          ``,
	Run:           run,
	SilenceErrors: false,
}

func init() {
	Cmd.Flags().StringVarP(&flgGameDir, "game", "g", env.GameDir(), "game root directory")
	Cmd.Flags().StringVar(&flgGlobPattern, "glob", "", "file glob pattern. Ignored if --regex is set")
	Cmd.Flags().StringVar(&flgRegxPattern, "regex", "", "regex pattern. If set, --glob is ignored")
	Cmd.Flags().BoolVar(&flgShowAzcsExt, "azcs", false, "lists file extensions that are found to be azoth compressed")
}

func run(ccmd *cobra.Command, args []string) {
	files := listFiles()

	if flgShowAzcsExt {
		for ext, count := range findAzcsExtensions(files) {
			slog.Info(ext, "count", count)
		}
	} else {
		for _, file := range files {
			slog.Info(file.Path())
		}
	}
	slog.Info("total files", "count", len(files))
}

func listFiles() []nwfs.File {
	fs := utils.Must(nwfs.NewPakFS(flgGameDir))
	var files []nwfs.File
	if flgRegxPattern != "" {
		flgRegxPattern = strings.ToLower(flgRegxPattern)
		flgRegxPattern = strings.ReplaceAll(flgRegxPattern, "\\\\", "\\")
		slog.Info("listing files with", "regex", flgRegxPattern)
		files = utils.Must(fs.Match(strings.Split(flgRegxPattern, ";")...))
	} else if flgGlobPattern != "" {
		flgGlobPattern = strings.ToLower(flgGlobPattern)
		slog.Info("listing files with", "glob", flgGlobPattern)
		files = utils.Must(fs.Glob(strings.Split(flgGlobPattern, ";")...))
	} else {
		slog.Info("listing all files")
		files = utils.Must(fs.List())
	}
	return files
}

func findAzcsExtensions(files []nwfs.File) map[string]int {
	result := make(map[string]int)
	progress.RunTasks(progress.TasksConfig[nwfs.File, string]{
		Description:   "Scanning",
		Tasks:         files,
		ProducerCount: 10,
		Producer: func(file nwfs.File) (output string, err error) {
			if dds.IsDDS(file.Path()) || dds.IsDDSSplitPart(file.Path()) {
				return
			}

			data, err := file.Read()
			if err != nil {
				return
			}
			if azcs.IsAzcs(data) {
				output = path.Ext(file.Path())
			}
			return
		},
		ConsumerCount: 1,
		Consumer: func(ext string, e error) (msg string, err error) {
			if ext != "" {
				result[ext]++
			}
			return "", e
		},
	})
	return result
}
