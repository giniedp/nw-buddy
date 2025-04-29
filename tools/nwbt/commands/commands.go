package commands

import (
	"fmt"
	"nw-buddy/tools/commands/cache"
	"nw-buddy/tools/commands/cat"
	"nw-buddy/tools/commands/list"
	"nw-buddy/tools/commands/models"
	"nw-buddy/tools/commands/pull"
	"nw-buddy/tools/commands/serve"
	"nw-buddy/tools/commands/types"
	"nw-buddy/tools/commands/unpack"
	"nw-buddy/tools/commands/vet"
	"nw-buddy/tools/constants"

	"github.com/spf13/cobra"
)

var description = fmt.Sprintf("%s%s", constants.NW_BUDDY_BANNER, ``)

var (
	rootCmd = &cobra.Command{
		Version:           "0.1.0",
		Use:               "nwb",
		Short:             "data mining tools for new world",
		Long:              description,
		SilenceErrors:     true,
		SilenceUsage:      true,
		CompletionOptions: cobra.CompletionOptions{DisableDefaultCmd: true},
	}
)

func Execute() error {
	return rootCmd.Execute()
}

func init() {
	rootCmd.AddCommand(list.Cmd)
	rootCmd.AddCommand(cat.Cmd)
	rootCmd.AddCommand(pull.Cmd)
	rootCmd.AddCommand(unpack.Cmd)
	rootCmd.AddCommand(types.Cmd)
	rootCmd.AddCommand(vet.Cmd)
	rootCmd.AddCommand(models.Cmd)
	rootCmd.AddCommand(serve.Cmd)
	rootCmd.AddCommand(cache.Cmd)
}
