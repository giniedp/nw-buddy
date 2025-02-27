package types

import (
	"fmt"
	"go/format"
	"log/slog"
	"nw-buddy/tools/nw-kit/formats/azcs"
	"nw-buddy/tools/nw-kit/nwfs"
	"nw-buddy/tools/nw-kit/rtti"
	"nw-buddy/tools/nw-kit/utils"
	"nw-buddy/tools/nw-kit/utils/env"
	"nw-buddy/tools/nw-kit/utils/progress"
	"os"
	"path"

	"github.com/spf13/cobra"
)

var flgGameFile string
var flgGameDir string
var flgLumberDir string
var flgOutputDir string
var Cmd = &cobra.Command{
	Use:           "types",
	Short:         "scans game assets and other sources for runtime type information and generates code.",
	Long:          ``,
	Args:          args,
	Run:           run,
	SilenceErrors: false,
}

func init() {
	Cmd.Flags().StringVarP(&flgGameDir, "game", "g", env.GameDir(), "game root directory")
	Cmd.Flags().StringVarP(&flgGameFile, "file", "f", path.Join(env.GameDir(), "Bin64", "NewWorld.exe"), "game executalbe")
	Cmd.Flags().StringVarP(&flgLumberDir, "lumberyard", "l", env.LumberyardDir(), "path to lumberyard source")
	Cmd.Flags().StringVarP(&flgOutputDir, "output", "o", path.Join(env.WorkDir(), "tools", "nw-kit", "rtti", "nwt"), "output directory")
}

func args(cmd *cobra.Command, args []string) error {
	if len(args) != 1 {
		return fmt.Errorf("expected 1 argument")
	}
	if args[0] != "scan" && args[0] != "generate" && args[0] != "inspect" {
		return fmt.Errorf("argument must be one of ['scan', 'generate'], was %s", args[0])
	}
	return nil
}

func run(ccmd *cobra.Command, args []string) {
	switch args[0] {
	case "scan":
		runScan()
	case "generate":
		runGenerate()
	case "inspect":
		runInspect()
	}
}

func runScan() {
	fs := utils.Must(nwfs.NewPakFS(flgGameDir))

	uidTable := rtti.NewUuidTable()
	crcTable := rtti.NewCrcTable()

	{
		slog.Info("-- Lumberyard --")
		lumbIdsFile := path.Join(flgOutputDir, "lumber-types.json")
		lumbCrcFile := path.Join(flgOutputDir, "lumber-crc.json")
		lumbCrc, lumbIds, err := scanLumberyard(flgLumberDir)
		if err != nil {
			if err != ErrNoLumberyardFiles {
				panic(err)
			}
			lumbIds = rtti.LoadOrCreateUuidTable(lumbIdsFile)
			lumbCrc = rtti.LoadOrCreateCrcTable(lumbCrcFile)
		}
		slog.Info(fmt.Sprintf("types: %v", len(lumbIds)))
		slog.Info(fmt.Sprintf(" crcs: %v", len(lumbCrc)))
		lumbIds.Save(lumbIdsFile)
		lumbCrc.Save(lumbCrcFile)

		uidTable.Merge(lumbIds)
		crcTable.Merge(lumbCrc)
	}

	{
		slog.Info("-- NW Tools --")
		nwtIdsFile := path.Join(flgOutputDir, "nwt-types.json")
		nwtCrcFile := path.Join(flgOutputDir, "nwt-crc.json")
		nwtCrc, nwtIds, err := scanNwTools()
		if err != nil {
			panic(err)
		}
		slog.Info(fmt.Sprintf("types: %v", len(nwtIds)))
		slog.Info(fmt.Sprintf(" crcs: %v", len(nwtCrc)))
		nwtIds.Save(nwtIdsFile)
		nwtCrc.Save(nwtCrcFile)

		uidTable.Merge(nwtIds)
		crcTable.Merge(nwtCrc)
	}

	{
		slog.Info("-- Levels --")
		lvlIdsFile := path.Join(flgOutputDir, "level-types.json")
		lvlCrcFile := path.Join(flgOutputDir, "level-crc.json")
		lvlCrc, lvlIds, err := scanLevels(fs)
		if err != nil {
			panic(err)
		}
		slog.Info(fmt.Sprintf("types: %v", len(lvlIds)))
		slog.Info(fmt.Sprintf(" crcs: %v", len(lvlCrc)))
		lvlIds.Save(lvlIdsFile)
		lvlCrc.Save(lvlCrcFile)

		uidTable.Merge(lvlIds)
		crcTable.Merge(lvlCrc)
	}

	{
		// TODO: scan datasheets
		// fs.Glob(".datasheets")
	}

	slog.Info("-- Object Streams --")
	typeTable := utils.Must(scanObjects(fs, uidTable, crcTable))
	typeTable.SaveJson(path.Join(flgOutputDir, "types.json"))
}

func runGenerate() {

	table := utils.Must(rtti.LoadTypeTable(path.Join(flgOutputDir, "types.json")))
	code := table.GenerateCode()
	formatted := utils.Must(format.Source([]byte(code)))
	os.WriteFile(path.Join(flgOutputDir, "generated.go"), formatted, os.ModePerm)
}

func runInspect() {
	fs := utils.Must(nwfs.NewPakFS(flgGameDir))
	files := utils.Must(fs.List())
	bar := progress.Bar(len(files), "scanning")

	meta := make(map[string]bool)
	for _, file := range files {
		bar.Add(1)
		ext := path.Ext(file.Path())
		if _, ok := meta[ext]; ok {
			continue
		}
		data, err := file.Read()
		if err != nil {
			slog.Error(fmt.Sprintf("%v %s", err, file.Path()))
			continue
		}
		meta[ext] = azcs.IsAzcs(data)
	}
	bar.Close()

	for ext, isAzcs := range meta {
		if isAzcs {
			slog.Info(fmt.Sprintf("'%s' is azcs", ext))
		}
	}
}
