package vet

import (
	"fmt"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/env"
	"strings"

	"github.com/spf13/cobra"
)

var flgGameDir string
var Cmd = &cobra.Command{
	Use:           "vet",
	Short:         "runs various checks",
	Long:          ``,
	Run:           run,
	SilenceErrors: false,
}

type Status int

const (
	StatusOK Status = iota
	StatusWarn
	StatusError
)

type CheckResult struct {
	Name     string
	Status   Status
	Path     string // populated on success
	Info     string // description/download hint on failure
	Required bool
}

const (
	colorReset  = "\033[0m"
	colorGreen  = "\033[32m"
	colorYellow = "\033[33m"
	colorRed    = "\033[31m"
	colorGray   = "\033[90m"
)

func init() {
	Cmd.Flags().StringVarP(&flgGameDir, "game", "g", env.GameDir(), "game root directory")
}

func run(ccmd *cobra.Command, args []string) {
	env.PrintStatus()

	results := []CheckResult{
		checkOodle(),
		checkLuaDecompiler(),
		checkKtx(),
		checkGltfTransform(),
	}

	fmt.Println()
	printResults(results)
	fmt.Println()

	fmt.Println("Archive check")
	if fs, err := nwfs.NewPackedArchive(flgGameDir); err != nil {
		fmt.Printf("  %s✗%s Failed: %s\n", colorRed, colorReset, err)
	} else {
		checkDubplicates(fs)
		fmt.Printf("  %s✓%s Done\n", colorGreen, colorReset)
	}
}

func printResults(results []CheckResult) {
	maxLen := 0
	for _, r := range results {
		if len(r.Name) > maxLen {
			maxLen = len(r.Name)
		}
	}

	for _, r := range results {
		padded := fmt.Sprintf("%-*s", maxLen, r.Name)
		switch r.Status {
		case StatusOK:
			fmt.Printf("  %s✓%s  %s  %s%s%s\n", colorGreen, colorReset, padded, colorGray, r.Path, colorReset)
		case StatusWarn:
			fmt.Printf("  %s!%s  %s  %snot found%s\n", colorYellow, colorReset, padded, colorRed, colorReset)
		case StatusError:
			fmt.Printf("  %s✗%s  %s  error\n", colorRed, colorReset, padded)
		}
		if r.Info != "" {
			for _, line := range strings.Split(r.Info, "\n") {
				fmt.Printf("       %s\n", line)
			}
		}
	}
}
func checkDubplicates(fs nwfs.Archive) {
	dubCounter := make(map[string][]nwfs.File)
	files := utils.Must(fs.List())
	for _, entry := range files {
		file := entry.Path()
		dubCounter[file] = append(dubCounter[file], entry)
	}
	for file, list := range dubCounter {
		if len(list) <= 1 {
			continue
		}

		fmt.Printf("%s is duplicated %d times", file, len(list))
		for _, entry := range list {
			fmt.Printf("  in package %s", entry.Package())
		}
	}
}

func checkOodle() CheckResult {
	result := CheckResult{
		Name:   "OodleLib",
		Status: StatusWarn,
		Info:   utils.OodleLib.Info(),
	}
	if p, ok := utils.OodleLib.Check(); ok {
		result.Status = StatusOK
		result.Path = p
	}
	return result
}

func checkLuaDecompiler() CheckResult {
	result := CheckResult{
		Name:   utils.Unluac.Name(),
		Status: StatusWarn,
		Info:   utils.Unluac.Info(),
	}
	if p, ok := utils.Unluac.Check(); ok {
		result.Status = StatusOK
		result.Path = p
	}
	return result
}

func checkKtx() CheckResult {
	result := CheckResult{
		Name:   utils.Ktx.Name(),
		Status: StatusWarn,
		Info:   utils.Ktx.Info(),
	}
	if p, ok := utils.Ktx.Check(); ok {
		result.Status = StatusOK
		result.Path = p
	}
	return result
}

func checkGltfTransform() CheckResult {
	result := CheckResult{
		Name:   utils.GltfTransform.Name(),
		Status: StatusWarn,
		Info:   utils.GltfTransform.Info(),
	}
	if p, ok := utils.GltfTransform.Check(); ok {
		result.Status = StatusOK
		result.Path = p
	}
	return result
}
