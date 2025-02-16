package doctor

import (
	"fmt"
	"log/slog"
	"nw-buddy/tools/nw-kit/nwfs"
	"nw-buddy/tools/nw-kit/utils"
	"strings"

	"github.com/spf13/cobra"
)

var flgGameDir string
var Cmd = &cobra.Command{
	Use:           "doctor",
	Short:         "runs various checks",
	Long:          ``,
	Run:           run,
	SilenceErrors: false,
}

func init() {
	Cmd.Flags().StringVarP(&flgGameDir, "game", "g", utils.GetEnvGameDir(), "game root directory")
}

func run(ccmd *cobra.Command, args []string) {
	checkTexconv()
	checkCwebp()
	checkNvtt()
	checkOodle()
	fs := utils.Must(nwfs.NewPakFS(flgGameDir))
	checkDubplicates(fs)
}

func checkDubplicates(fs nwfs.FileSystem) {
	slog.Info("Checking for duplicate file paths in pak files")
	dubCounter := make(map[string][]nwfs.File)
	files := utils.Must(fs.List())
	for _, entry := range files {
		file := entry.Path()
		dubCounter[file] = append(dubCounter[file], entry)
	}
	hasDubs := false
	for file, list := range dubCounter {
		if len(list) <= 1 {
			continue
		}
		hasDubs = true
		slog.Warn(fmt.Sprintf("%s is duplicated %d times", file, len(list)))
		for _, entry := range list {
			slog.Warn(fmt.Sprintf("  in package %s", entry.Package()))
		}
	}
	if !hasDubs {
		slog.Info("\tOK")
	}
}

func checkTexconv() {
	if p, ok := utils.Texconv.Check(); ok {
		slog.Info("Texconv found at", "path", p)
		// slog.Info(strings.TrimSpace(utils.Texconv.Info()))
	} else {
		slog.Warn("Texconv not found int PATH")
		slog.Warn(strings.TrimSpace(utils.Texconv.Info()))
	}
}

func checkCwebp() {
	if p, ok := utils.Cwebp.Check(); ok {
		slog.Info("Cwebp found at", "path", p)
		// slog.Info(strings.TrimSpace(utils.Cwebp.Info()))
	} else {
		slog.Warn("Cwebp not found int PATH")
		slog.Warn(strings.TrimSpace(utils.Cwebp.Info()))
	}
}
func checkNvtt() {
	if p, ok := utils.Nvtt.Check(); ok {
		slog.Info("NVTT found at", "path", p)
		// slog.Info(strings.TrimSpace(utils.Nvtt.Info()))
	} else {
		slog.Warn("NVTT not found int PATH")
		slog.Warn(strings.TrimSpace(utils.Nvtt.Info()))
	}
}
func checkOodle() {
	if p, ok := utils.OodleLib.Check(); ok {
		slog.Info("Oodle found at", "path", p)
		//slog.Info(strings.TrimSpace(utils.Oodlei.Info()))
	} else {
		slog.Warn("Oodle not found int PATH")
		//slog.Warn(strings.TrimSpace(utils.Oodlei.Info()))
	}
}
