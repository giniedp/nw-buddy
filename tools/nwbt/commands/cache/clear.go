package cache

import (
	"log/slog"
	"os"

	"github.com/spf13/cobra"
)

var cmdClear = &cobra.Command{
	Use:   "clear",
	Short: "clears the current cache directory",
	Long:  "",
	Run:   runClear,
}

func init() {
	cmdClear.Flags().AddFlagSet(Cmd.Flags())
}

func runClear(ccmd *cobra.Command, args []string) {
	if err := os.RemoveAll(flgCacheDir); err != nil {
		slog.Error("failed to clear cache", "error", err)
	} else {
		slog.Info("cache cleared")
	}
	if err := os.RemoveAll(flgTempDir); err != nil {
		slog.Error("failed to clear temp dir", "error", err)
	} else {
		slog.Info("temp dir cleared")
	}
}
