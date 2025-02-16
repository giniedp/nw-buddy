package pull

import (
	"nw-buddy/tools/nw-kit/utils"

	"github.com/spf13/cobra"
)

var flgGameDir string
var Cmd = &cobra.Command{
	Use:           "pull",
	Short:         "pulls data from .pak files specifically for nw-buddy purposes.",
	Long:          ``,
	Run:           run,
	SilenceErrors: false,
}

func init() {
	Cmd.Flags().StringVarP(&flgGameDir, "game", "g", utils.GetEnvGameDir(), "game root directory")
}

func run(ccmd *cobra.Command, args []string) {
}
