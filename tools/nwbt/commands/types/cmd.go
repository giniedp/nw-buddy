package types

import (
	"encoding/json"
	"go/format"
	"log/slog"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/rtti"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/env"
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
	SilenceErrors: false,
}

var cmdScan = &cobra.Command{
	Use:   "scan",
	Short: "scans game assets and other sources for runtime type information.",
	Long:  "scans game assets and other sources for runtime type information.",
	Run:   runScan,
}

var cmdGenerate = &cobra.Command{
	Use:   "generate",
	Short: "generates code based on previously scanned information.",
	Long:  "generates code based on previously scanned information.",
	Run:   runGenerate,
}

func init() {
	Cmd.Flags().StringVarP(&flgGameDir, "game", "g", env.GameDir(), "game root directory")
	Cmd.Flags().StringVarP(&flgGameFile, "file", "f", path.Join(env.GameDir(), "Bin64", "NewWorld.exe"), "game executalbe")
	Cmd.Flags().StringVarP(&flgLumberDir, "lumberyard", "l", env.LumberyardDir(), "path to lumberyard source")
	Cmd.Flags().StringVarP(&flgOutputDir, "output", "o", path.Join(env.WorkDir(), "tools", "nwbt", "rtti", "nwt"), "output directory")

	Cmd.AddCommand(cmdScan)
	Cmd.AddCommand(cmdGenerate)
}

func runScan(ccmd *cobra.Command, args []string) {
	fs := utils.Must(nwfs.NewPackedArchive(flgGameDir))

	uidTable := rtti.NewUuidTable()
	crcTable := rtti.NewCrcTable()

	{
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
		slog.Info("Found", "types", len(lumbIds), "crcs", len(lumbCrc))
		if err := lumbIds.Save(lumbIdsFile); err != nil {
			panic(err)
		} else {
			slog.Info("Saved", "file", lumbIdsFile)
		}
		if err := lumbCrc.Save(lumbCrcFile); err != nil {
			panic(err)
		} else {
			slog.Info("Saved", "file", lumbCrcFile)
		}

		uidTable.Merge(lumbIds)
		crcTable.Merge(lumbCrc)
	}

	{
		slog.Info("NW Tools")
		nwtIdsFile := path.Join(flgOutputDir, "nwt-types.json")
		nwtCrcFile := path.Join(flgOutputDir, "nwt-crc.json")
		nwtCrc, nwtIds, err := scanNwTools()
		if err != nil {
			panic(err)
		}
		slog.Info("Found", "types", len(nwtIds), "crcs", len(nwtCrc))
		if err := nwtIds.Save(nwtIdsFile); err != nil {
			panic(err)
		} else {
			slog.Info("Saved", "file", nwtIdsFile)
		}
		if err := nwtCrc.Save(nwtCrcFile); err != nil {
			panic(err)
		} else {
			slog.Info("Saved", "file", nwtCrcFile)
		}

		uidTable.Merge(nwtIds)
		crcTable.Merge(nwtCrc)
	}

	{
		lvlIdsFile := path.Join(flgOutputDir, "level-types.json")
		lvlCrcFile := path.Join(flgOutputDir, "level-crc.json")
		lvlCrc, lvlIds, err := scanLevels(fs)
		if err != nil {
			panic(err)
		}
		slog.Info("Found", "types", len(lvlIdsFile), "crcs", len(lvlCrcFile))
		if err := lvlIds.Save(lvlIdsFile); err != nil {
			panic(err)
		} else {
			slog.Info("Saved", "file", lvlIdsFile)
		}
		if err := lvlCrc.Save(lvlCrcFile); err != nil {
			panic(err)
		} else {
			slog.Info("Saved", "file", lvlCrcFile)
		}

		uidTable.Merge(lvlIds)
		crcTable.Merge(lvlCrc)
	}

	{
		mixedTypeFile := path.Join(flgOutputDir, "mixed-types.json")
		mixedTypeData, err := os.ReadFile(mixedTypeFile)
		mixedTypes := make([]MixedType, 0)
		if err != nil {
			slog.Warn("Failed to read mixed types file", "file", mixedTypeFile, "error", err)
		}
		if err := json.Unmarshal(mixedTypeData, &mixedTypes); err != nil {
			slog.Warn("Failed to parse mixed types file", "file", mixedTypeFile, "error", err)
		}

		for _, item := range mixedTypes {
			if !uidTable.Has(item.TypeId) {
				uidTable.Put(item.TypeId, item.Name)
			}
			for _, elem := range item.Elements {
				if !crcTable.HasName(elem.Name) {
					crcTable.PutName(elem.Name)
				}
			}
		}
	}

	outFile := path.Join(flgOutputDir, "types.json")
	typeTable := utils.Must(scanObjects(fs, uidTable, crcTable))
	if err := typeTable.SaveJson(outFile); err != nil {
		panic(err)
	} else {
		slog.Info("Saved", "file", outFile)
	}
}

func runGenerate(ccmd *cobra.Command, args []string) {

	table := utils.Must(rtti.LoadTypeTable(path.Join(flgOutputDir, "types.json")))
	code := table.GenerateCode()
	formatted := utils.Must(format.Source([]byte(code)))
	os.WriteFile(path.Join(flgOutputDir, "generated.go"), formatted, os.ModePerm)
}

type MixedType struct {
	Name     string             `json:"name"`
	TypeId   string             `json:"typeId"`
	Version  string             `json:"version"`
	Elements []MixedTypeElement `json:"elements"`
}
type MixedTypeElement struct {
	Name   string `json:"name"`
	TypeId string `json:"typeId"`
}
