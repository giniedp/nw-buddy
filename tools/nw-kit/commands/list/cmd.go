package list

import (
	"log/slog"
	"nw-buddy/tools/nw-kit/nwfs"
	"nw-buddy/tools/nw-kit/utils"
	"nw-buddy/tools/nw-kit/utils/env"
	"strings"

	"github.com/spf13/cobra"
)

var flgGameDir string
var flgGlobPattern string
var flgRegxPattern string
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
}

func run(ccmd *cobra.Command, args []string) {
	files := listFiles()
	for _, file := range files {
		slog.Info(file.Path())
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
