package stat

import (
	"log/slog"
	"nw-buddy/tools/game"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/env"
	"strings"

	"github.com/spf13/cobra"
)

var flgGameDir string
var flgRegex bool
var Cmd = &cobra.Command{
	Use:           "stat",
	Short:         "prints file stat",
	Long:          ``,
	Run:           run,
	SilenceErrors: false,
}

func init() {
	Cmd.Flags().StringVarP(&flgGameDir, "game", "g", env.GameDir(), "game root directory")
}

func run(ccmd *cobra.Command, args []string) {
	assets := utils.Must(game.InitPackedAssets(flgGameDir))
	files, err := listFiles(args, flgRegex, assets.Archive)
	if err != nil {
		panic(err)
	}
	for _, file := range files {
		asset := assets.Catalog.FindByFile(file.Path())
		slog.Info(file.Path(), "stat", file.Stat())
		if asset != nil {
			slog.Info("\t", "assetId", asset.AssetId, "guid", asset.Guid, "type", asset.Type, "size", asset.Size)
		} else {
			slog.Warn("\t not found in catalog")
		}
	}
}

func listFiles(args []string, regex bool, fs nwfs.Archive) ([]nwfs.File, error) {

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
