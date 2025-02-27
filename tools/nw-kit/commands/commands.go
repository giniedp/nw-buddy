package commands

import (
	"fmt"
	"nw-buddy/tools/nw-kit/commands/doctor"
	"nw-buddy/tools/nw-kit/commands/list"
	"nw-buddy/tools/nw-kit/commands/pull"
	"nw-buddy/tools/nw-kit/commands/types"
	"nw-buddy/tools/nw-kit/commands/unpack"
	"nw-buddy/tools/nw-kit/constants"

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
	rootCmd.AddCommand(unpack.Cmd)
	rootCmd.AddCommand(types.Cmd)
	rootCmd.AddCommand(doctor.Cmd)
	rootCmd.AddCommand(pull.Cmd)
	rootCmd.AddCommand(list.Cmd)
}
