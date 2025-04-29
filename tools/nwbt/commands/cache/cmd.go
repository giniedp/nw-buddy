package cache

import (
	"log/slog"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/env"
	"os"
	"path"

	"github.com/dustin/go-humanize"
	"github.com/goreleaser/fileglob"
	"github.com/spf13/cobra"
)

var flgCacheDir string
var flgTempDir string
var Cmd = &cobra.Command{
	Use:           "cache",
	Short:         "shows cache and temp directory stats",
	Long:          ``,
	Run:           run,
	SilenceErrors: false,
}

func init() {
	Cmd.Flags().StringVarP(&flgCacheDir, "cache", "c", env.CacheDir(), "The cache directory")
	Cmd.Flags().StringVarP(&flgTempDir, "temp", "t", env.TempDir(), "The temporary directory")
	Cmd.AddCommand(cmdClear)
}

func run(ccmd *cobra.Command, args []string) {
	statDir("cache", flgCacheDir)
	statDir("temp", flgTempDir)
}

func statDir(name, dir string) {
	files := utils.Must(fileglob.Glob(path.Join(dir, "**"), fileglob.MaybeRootFS))
	size := uint64(0)
	for _, file := range files {
		info := utils.Must(os.Stat(file))
		size += uint64(info.Size())
	}
	slog.Info(name, "size", humanize.Bytes(size), "files", len(files), "dir", dir)
}
