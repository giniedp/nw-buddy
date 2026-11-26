package crc

import (
	"fmt"
	"nw-buddy/tools/utils/str"
	"os"
	"text/tabwriter"

	"github.com/spf13/cobra"
)

var Cmd = &cobra.Command{
	Use:           "crc",
	Short:         "calculates crc32 value from given input",
	Long:          ``,
	Run:           run,
	SilenceErrors: false,
}

func init() {

}

func run(ccmd *cobra.Command, args []string) {
	w := tabwriter.NewWriter(os.Stdout, 0, 0, 1, ' ', 0)
	fmt.Fprintf(w, "String\tcrc32\n")
	for _, arg := range args {
		value := str.Crc32(arg)
		fmt.Fprintf(w, "%s\t%d\t\n", arg, value)
	}
	w.Flush()
}
