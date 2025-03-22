package cat

import (
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/env"
	"os"
	"strings"

	"github.com/spf13/cobra"
)

var flgGameDir string
var flgRegex bool
var Cmd = &cobra.Command{
	Use:           "cat",
	Short:         "concatenate files and print on the standard output",
	Long:          ``,
	Run:           run,
	SilenceErrors: false,
}

func init() {
	Cmd.Flags().StringVarP(&flgGameDir, "game", "g", env.GameDir(), "game root directory")
	Cmd.Flags().BoolVarP(&flgRegex, "regex", "e", false, "if set, arguments are treated as regular expressions")
}

func run(ccmd *cobra.Command, args []string) {
	files, err := listFiles(args, flgRegex)
	if err != nil {
		panic(err)
	}
	for _, file := range files {
		data, err := file.Read()
		if err != nil {
			panic(err)
		}
		_, err = os.Stdout.Write(data)
		if err != nil {
			panic(err)
		}
	}
}

func listFiles(args []string, regex bool) ([]nwfs.File, error) {
	fs := utils.Must(nwfs.NewPackedArchive(flgGameDir))
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
