package list

import (
	"encoding/csv"
	"fmt"
	"io"
	"math"
	"nw-buddy/tools/formats/pak"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/env"
	"os"
	"slices"
	"strings"
	"text/tabwriter"
	"time"

	"github.com/dustin/go-humanize"
	"github.com/spf13/cobra"
)

var flgGameDir string
var flgRegex bool
var flgMaxDepth int
var flgMaxEntries int
var flgPrintTree bool
var flgPrintCsv bool
var flgOutFile string
var Cmd = &cobra.Command{
	Use:           "list",
	Short:         "lists the file names",
	Long:          ``,
	Run:           run,
	SilenceErrors: false,
}

func init() {
	Cmd.Flags().StringVarP(&flgGameDir, "game", "g", env.GameDir(), "game root directory")
	Cmd.Flags().BoolVarP(&flgRegex, "regex", "e", false, "if set, arguments are treated as regular expressions")
	Cmd.Flags().BoolVar(&flgPrintCsv, "csv", false, "print list as csv")
	Cmd.Flags().BoolVar(&flgPrintTree, "tree", false, "print as file tree")
	Cmd.Flags().IntVarP(&flgMaxDepth, "depth", "d", 0, "max tree depth (only for --tree)")
	Cmd.Flags().IntVarP(&flgMaxEntries, "entries", "n", 0, "max entries per folder (only for --tree)")
	Cmd.Flags().StringVarP(&flgOutFile, "out", "o", "", "ouput file")
	Cmd.MarkFlagsMutuallyExclusive("csv", "tree")
}

func run(ccmd *cobra.Command, args []string) {
	files, err := listFiles(args, flgRegex)
	if err != nil {
		panic(err)
	}
	out := os.Stdout
	if flgOutFile != "" {
		out = utils.Must(os.Create(flgOutFile))
		defer out.Close()
	}

	if flgPrintTree {
		printTree(out, files)
	} else if flgPrintCsv {
		printCsv(out, files)
	} else {
		printList(out, files)
	}
}

func listFiles(args []string, regex bool) ([]nwfs.File, error) {
	fs := utils.Must(nwfs.NewPackedArchive(flgGameDir))
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

func printList(w io.Writer, files []nwfs.File) {
	slices.SortStableFunc(files, func(a, b nwfs.File) int {
		return strings.Compare(a.Path(), b.Path())
	})
	totalSize := 0
	for _, file := range files {
		hash := ""
		if e, ok := file.Stat().Sys().(pak.Entry); ok {
			hash = fmt.Sprintf("0x%08x", e.Crc32())
		}
		size := file.Stat().Size()
		mtime := file.Stat().ModTime()
		fmt.Fprintf(w, "%10s %s %10s %s\n", humanize.Bytes(uint64(size)), hash, mtime.Format(time.DateTime), file.Path())
		totalSize += int(size)
	}
	fmt.Fprintf(w, "Total size: %s\n", humanize.Bytes(uint64(totalSize)))
	fmt.Fprintf(w, "File count: %d\n", len(files))
}

func printCsv(w io.Writer, files []nwfs.File) {
	slices.SortStableFunc(files, func(a, b nwfs.File) int {
		return strings.Compare(a.Path(), b.Path())
	})
	out := csv.NewWriter(w)
	out.Comma = ';'
	for _, file := range files {
		hash := ""
		if e, ok := file.Stat().Sys().(pak.Entry); ok {
			hash = fmt.Sprintf("%08x", e.Crc32())
		}
		out.Write([]string{
			file.Path(),
			file.Stat().ModTime().Format(time.DateTime),
			fmt.Sprintf("%d", file.Stat().Size()),
			hash,
		})
	}
	out.Flush()
}

func printTree(w *os.File, files []nwfs.File) {
	if flgMaxDepth == 0 {
		flgMaxDepth = math.MaxInt
	}
	if flgMaxEntries == 0 {
		flgMaxEntries = math.MaxInt
	}
	tw := tabwriter.NewWriter(w, 0, 0, 1, ' ', 0)
	tree := ToTree(files)
	tree.Sort()
	tree.Print(tw, PrintContext{
		MaxDepth:   flgMaxDepth,
		MaxEntries: flgMaxEntries,
		Symbols:    [4]string{"│ ", "├─", "└─", "  "},
	})
	tw.Flush()
}
