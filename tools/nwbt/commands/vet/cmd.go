package vet

import (
	"fmt"
	"log/slog"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/env"
	"strings"

	"github.com/spf13/cobra"
)

var flgGameDir string
var Cmd = &cobra.Command{
	Use:           "vet",
	Short:         "runs various checks",
	Long:          ``,
	Run:           run,
	SilenceErrors: false,
}

func init() {
	Cmd.Flags().StringVarP(&flgGameDir, "game", "g", env.GameDir(), "game root directory")
}

func run(ccmd *cobra.Command, args []string) {
	env.PrintStatus()
	checkTexconv()
	checkCwebp()
	checkNvtt()
	checkOodle()
	checkMagick()
	checkKtx()
	fs := utils.Must(nwfs.NewPackedArchive(flgGameDir))
	checkDubplicates(fs)
}

func checkDubplicates(fs nwfs.Archive) {

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
		slog.Info("No duplicate file paths in pak files")
	}
}

func checkTexconv() {
	if p, ok := utils.Texconv.Check(); ok {
		slog.Info("Texconv\tfound at", "path", p)
		// slog.Info(strings.TrimSpace(utils.Texconv.Info()))
	} else {
		slog.Warn("Texconv\tnot found in PATH")
		slog.Warn(strings.TrimSpace(utils.Texconv.Info()))
	}
}

func checkCwebp() {
	if p, ok := utils.Cwebp.Check(); ok {
		slog.Info("Cwebp\tfound at", "path", p)
		// slog.Info(strings.TrimSpace(utils.Cwebp.Info()))
	} else {
		slog.Warn("Cwebp\tnot found in PATH")
		slog.Warn(strings.TrimSpace(utils.Cwebp.Info()))
	}
}
func checkNvtt() {
	if p, ok := utils.Nvtt.Check(); ok {
		slog.Info("NVTT\tfound at", "path", p)
		// slog.Info(strings.TrimSpace(utils.Nvtt.Info()))
	} else {
		slog.Warn("NVTT\tnot found in PATH")
		slog.Warn(strings.TrimSpace(utils.Nvtt.Info()))
	}
}
func checkKtx() {
	if p, ok := utils.Ktx.Check(); ok {
		slog.Info("ktx\tfound at", "path", p)
		// slog.Info(strings.TrimSpace(utils.Ktx.Info()))
	} else {
		slog.Warn("ktx\tnot found in PATH")
		slog.Warn(strings.TrimSpace(utils.Ktx.Info()))
	}
}
func checkOodle() {
	if p, ok := utils.OodleLib.Check(); ok {
		slog.Info("Oodle\tfound at", "path", p)
		//slog.Info(strings.TrimSpace(utils.Oodlei.Info()))
	} else {
		slog.Warn("Oodle\tnot found in PATH")
		//slog.Warn(strings.TrimSpace(utils.Oodlei.Info()))
	}
}

func checkMagick() {
	if p, ok := utils.Magick.Check(); ok {
		slog.Info("Image Magick found at", "path", p)
		//slog.Info(strings.TrimSpace(utils.Oodlei.Info()))
	} else {
		slog.Warn("Image Magick not found in PATH")
		//slog.Warn(strings.TrimSpace(utils.Oodlei.Info()))
	}
}
