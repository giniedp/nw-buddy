package list

import (
	"log/slog"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/env"
	"strings"

	"github.com/spf13/cobra"
)

var flgGameDir string
var flgRegex bool
var Cmd = &cobra.Command{
	Use:           "list",
	Short:         "lists the file names",
	Long:          ``,
	Run:           run,
	SilenceErrors: false,
}

func init() {
	Cmd.Flags().StringVarP(&flgGameDir, "game", "g", env.GameDir(), "game root directory")
	Cmd.Flags().BoolVarP(&flgRegex, "reg", "e", false, "whether argument is a regular expression")
}

func run(ccmd *cobra.Command, args []string) {
	files, err := listFiles(args, flgRegex)
	if err != nil {
		panic(err)
	}
	for _, file := range files {
		slog.Info(file.Path())
	}
	slog.Info("total files", "count", len(files))
}

func listFiles(args []string, regex bool) ([]nwfs.File, error) {
	fs := utils.Must(nwfs.NewPakFS(flgGameDir))
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
