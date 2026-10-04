package serve

import (
	"log/slog"
	"nw-buddy/tools/formats/mission"
	"nw-buddy/tools/game/level"

	"github.com/spf13/cobra"
	"github.com/tkrajina/typescriptify-golang-structs/typescriptify"
)

var CmdTypegen = &cobra.Command{
	Use:   "typegen",
	Short: "Generates server response types for the web client",
	Long:  "",
	Run:   runTypegen,
}

type Mission = mission.Document

func runTypegen(cmd *cobra.Command, args []string) {
	converter := typescriptify.New()
	converter.CreateInterface = true
	converter.BackupDir = ""
	converter.Indent = "  "

	converter.Add(ServeApi{})
	converter.Add(ServeListResult{})
	converter.Add(ServeAssetIdResult{})
	converter.Add(ServeStatResult{})
	converter.Add(level.LevelIndex{})
	converter.Add(level.CoatlicueInfo{})
	converter.Add(level.RegionInfo{})
	converter.Add(level.RegionCapitalsData{})
	converter.Add(level.CapitalRuntimeData{})
	converter.Add(level.ChunkRuntimeData{})
	converter.Add(level.RegionDistributionData{})
	converter.Add(Mission{})

	err := converter.ConvertToFile("libs/nw-serve/generated.ts")
	if err != nil {
		slog.Error("Failed to generate types", "error", err)
	}
}
