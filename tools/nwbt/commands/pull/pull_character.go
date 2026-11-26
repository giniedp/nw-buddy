package pull

import (
	"log/slog"
	"nw-buddy/tools/game"
	"nw-buddy/tools/game/scanner"
	"nw-buddy/tools/utils/logging"
	"os"
	"path"

	"github.com/dustin/go-humanize"
	"github.com/spf13/cobra"
)

var cmdPullCharacter = &cobra.Command{
	Use:   TASK_CHARACTER,
	Short: "Pulls the player's emotes and the equip types",
	Long:  "",
	Run:   runPullCharacter,
}

func runPullCharacter(ccmd *cobra.Command, args []string) {
	ctx := NewPullContext()
	slog.SetDefault(logging.DefaultFileHandler())
	ctx.PullCharacter()
	slog.SetDefault(logging.DefaultTerminalHandler())
	ctx.PrintStats()
}

func pullCharacter(assets *game.Assets, outDir string) {
	os.MkdirAll(outDir, os.ModePerm)

	emotes, err := scanner.ScanEmotes(assets)
	if err != nil {
		slog.Error("emotes not scanned", "err", err)
	} else {
		size := writeJson(emotes, path.Join(outDir, "emotes_metadata.json"))
		stats.Add("Emotes", "rows", len(emotes), "size", humanize.Bytes(size))
	}

	equipTypes, err := scanner.ScanEquipTypes(assets)
	if err != nil {
		slog.Error("equip types not scanned", "err", err)
	} else {
		size := writeJson(equipTypes, path.Join(outDir, "equip_types_metadata.json"))
		stats.Add("EquipTypes", "rows", len(equipTypes), "size", humanize.Bytes(size))
	}
}
