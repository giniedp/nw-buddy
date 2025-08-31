package pull

import (
	"log/slog"
	"nw-buddy/tools/commands/pull/ts"
	"nw-buddy/tools/formats/datasheet"
	"nw-buddy/tools/game/scanner"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/json"
	"nw-buddy/tools/utils/logging"
	"nw-buddy/tools/utils/progress"
	"nw-buddy/tools/utils/str"
	"os"
	"path"
	"reflect"
	"strings"

	"github.com/spf13/cobra"
)

var cmdPullTypes = &cobra.Command{
	Use:   TASK_TYPES,
	Short: "Generates type definitions",
	Long:  "",
	Run:   runPullTypes,
}

func runPullTypes(ccmd *cobra.Command, args []string) {
	ctx := NewPullContext()
	slog.SetDefault(logging.DefaultFileHandler())
	ctx.PullTypes()
	slog.SetDefault(logging.DefaultTerminalHandler())
	ctx.PrintStats()
}

func pullTypes(tables []*datasheet.Document, actionlists []nwfs.File, outDir string) {
	bar := progress.Bar(0, "Codegen")
	types := ts.ResolveTableTypes(tables)
	ts.FixTableTypes(tables, types)

	bar.Add(len(types))
	enums := ts.ResolveEnumTypes(tables)
	bar.Add(len(enums))

	code := codeGenTableTypes(types) + "\n\n" + codeGenEnumTypes(enums)
	os.WriteFile(path.Join(outDir, "types.ts"), []byte(code), os.ModePerm)

	code = codeGenTableTypeInfos(types)
	os.WriteFile(path.Join(outDir, "cols.ts"), []byte(code), os.ModePerm)

	code = codeGenIndexSheets(types)
	os.WriteFile(path.Join(outDir, "datatables.ts"), []byte(code), os.ModePerm)

	code = codeGenScanTypes()
	os.WriteFile(path.Join(outDir, "meta-types.ts"), []byte(code), os.ModePerm)

	code = codeGenIndexActionlists(actionlists)
	os.WriteFile(path.Join(outDir, "actionlists.ts"), []byte(code), os.ModePerm)

	bar.Close()
}

func codeGenTableTypeInfos(types ts.TypeMap) string {
	w := str.NewBuilder()
	for _, tKey := range types.SortedKeys() {
		it := types[tKey]
		w.Line("export const COLS_%s = {", strings.ToUpper(it.Name))
		w.Indent()
		for _, mKey := range it.Members.SortedKeys() {
			member := it.Members[mKey]
			w.Line("%s: '%s',", str.EscapeJsSymbol(member.Name), member.TsTypeName())
		}
		w.Unindent()
		w.Line("}")
		w.Line("")
	}
	return w.String()
}

func codeGenTableTypes(types ts.TypeMap) string {
	w := str.NewBuilder()
	for _, tKey := range types.SortedKeys() {
		it := types[tKey]
		w.Line("export interface %s {", it.Name)
		w.Indent()
		for _, mKey := range it.Members.SortedKeys() {
			member := it.Members[mKey]
			w.Line("%s: %s", str.EscapeJsSymbol(member.Name), member.TsTypeName())
		}
		w.Unindent()
		w.Line("}")
		w.Line("")
	}
	return w.String()
}

func codeGenEnumTypes(enums ts.EnumMap) string {
	w := str.NewBuilder()
	for _, name := range enums.SortedKeys() {
		w.Line("export type %s =", name)
		w.Indent()
		for _, value := range enums.SortedValuesOf(name) {
			if value != "" {
				w.Line("| '%s'", value)
			}
		}
		w.Unindent()
		w.Line("")
	}
	return w.String()
}

func codeGenIndexSheets(types ts.TypeMap) string {
	w := str.NewBuilder()

	w.Line("import type {")
	w.Indent()
	for _, tKey := range types.SortedKeys() {
		it := types[tKey]
		w.Line("%s,", it.Name)
	}
	w.Unindent()
	w.Line("} from './types'")
	w.Line("")
	w.Line("export type DataSheetUri<T> = {")
	w.Line("  uri: string | string[]")
	w.Line("}")
	w.Line("")
	w.Line("export const DATASHEETS = {")
	w.Indent()
	for _, tKey := range types.SortedKeys() {
		it := types[tKey]

		w.Line("%s: {", it.Name)
		w.Indent()
		for _, subType := range it.Files.SortedKeys() {
			files := it.Files.SortedValuesOf(subType)
			for i, file := range files {
				files[i] = strings.ReplaceAll(file, "sharedassets/springboardentitites/", "")
				files[i] = utils.ReplaceExt(files[i], ".json")
			}
			w.Line("%s: <DataSheetUri<%s>>{", str.EscapeJsSymbol(subType), it.Name)
			if len(files) == 1 {
				w.Line(`  uri: "%s",`, files[0])
			} else {
				w.Line("  uri: %s", strings.TrimSpace(string(utils.Must(json.MarshalJSON(files)))))
			}
			w.Line("},")
		}

		w.Unindent()
		w.Line("},")
	}
	w.Unindent()
	w.Line("}")
	return w.String()
}

func codeGenScanTypes() string {
	types := make(ts.TypeMap)
	types.AddReflect(reflect.TypeOf(scanner.ScannedGatherable{}))
	types.AddReflect(reflect.TypeOf(scanner.ScannedHouseType{}))
	types.AddReflect(reflect.TypeOf(scanner.ScannedLore{}))
	types.AddReflect(reflect.TypeOf(scanner.ScannedNpc{}))
	types.AddReflect(reflect.TypeOf(scanner.ScannedStationType{}))
	types.AddReflect(reflect.TypeOf(scanner.ScannedStructureType{}))
	types.AddReflect(reflect.TypeOf(scanner.ScannedTerritory{}))
	types.AddReflect(reflect.TypeOf(scanner.ScannedVariation{}))
	types.AddReflect(reflect.TypeOf(scanner.ScannedVital{}))
	types.AddReflect(reflect.TypeOf(scanner.ScannedVitalModel{}))
	types.AddReflect(reflect.TypeOf(SearchItem{}))
	types.AddReflect(reflect.TypeOf(ScannedSpell{}))

	w := str.NewBuilder()
	for _, tKey := range types.SortedKeys() {
		it := types[tKey]
		w.Line("export interface %s {", it.Name)
		w.Indent()
		for _, mKey := range it.Members.SortedKeys() {
			member := it.Members[mKey]
			w.Line("%s: %s", member.Name, member.Types[0])
		}
		w.Unindent()
		w.Line("}")
		w.Line("")
	}
	return w.String()
}

func codeGenIndexActionlists(files []nwfs.File) string {
	w := str.NewBuilder()

	w.Line("export const ACTIONLISTS = [")
	w.Indent()
	for _, file := range files {
		w.Line("\"%s\",", strings.ReplaceAll(file.Path(), "sharedassets/springboardentitites/", "actionlists/"))
	}
	w.Unindent()
	w.Line("]")
	return w.String()
}
