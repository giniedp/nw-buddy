package models

import (
	"log/slog"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/logging"

	"github.com/spf13/cobra"
)

var cmdCollectAppearances = &cobra.Command{
	Use:   "appearances",
	Short: "scans datasheets for ArmorAppearanceDefinitions and WeaponAppearanceDefinitions and collects models",
	Long:  "",
	Run:   runCollectAppearances,
}

func init() {
	cmdCollectAppearances.Flags().AddFlagSet(Cmd.Flags())
	cmdCollectAppearances.Flags().StringVar(&flgIds, "ids", "", "comma separated list of ids to process")
}

func runCollectAppearances(ccmd *cobra.Command, args []string) {
	ids := getCommaSeparatedList(flgIds)
	slog.SetDefault(logging.DefaultFileHandler())
	c := utils.Must(initCollector())
	c.CollectAppearancesArmor(ids...)
	c.CollectAppearancesWeapons(ids...)
	c.Process()
	slog.SetDefault(logging.DefaultTerminalHandler())
}
