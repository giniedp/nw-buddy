package pull

import (
	"nw-buddy/tools/nw-kit/commands/pull/scan"
	"nw-buddy/tools/nw-kit/commands/pull/ts"
	"nw-buddy/tools/nw-kit/formats/datasheet"
	"nw-buddy/tools/nw-kit/utils"
	"nw-buddy/tools/nw-kit/utils/progress"
	"nw-buddy/tools/nw-kit/utils/str"
	"os"
	"path"
	"reflect"
	"strings"
)

func pullTypes(tables []*datasheet.Document, outDir string) {
	bar := progress.Bar(0, "Codegen")
	types := ts.ResolveTableTypes(tables)
	bar.Add(len(types))
	enums := ts.ResolveEnumTypes(tables)
	bar.Add(len(enums))

	code := codeGenTableTypes(types) + "\n\n" + codeGenEnumTypes(enums)
	os.WriteFile(path.Join(outDir, "types.ts"), []byte(code), os.ModePerm)

	code = codeGenTableTypeInfos(types)
	os.WriteFile(path.Join(outDir, "cols.ts"), []byte(code), os.ModePerm)

	code = codeGenIndex(types)
	os.WriteFile(path.Join(outDir, "datatables.ts"), []byte(code), os.ModePerm)

	code = codeGenScanTypes()
	os.WriteFile(path.Join(outDir, "meta-types.ts"), []byte(code), os.ModePerm)

	bar.Close()
}

func codeGenTableTypeInfos(types ts.TypeMap) string {
	w := utils.NewStringBuilder()
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
	w := utils.NewStringBuilder()
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
	w := utils.NewStringBuilder()
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

func codeGenIndex(types ts.TypeMap) string {
	w := utils.NewStringBuilder()

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
				w.Line("  uri: %s", strings.TrimSpace(string(utils.Must(utils.MarshalJSON(files)))))
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
	types.AddReflect(reflect.TypeOf(scan.ScannedGatherable{}))
	types.AddReflect(reflect.TypeOf(scan.ScannedHouseType{}))
	types.AddReflect(reflect.TypeOf(scan.ScannedLore{}))
	types.AddReflect(reflect.TypeOf(scan.ScannedNpc{}))
	types.AddReflect(reflect.TypeOf(scan.ScannedStationType{}))
	types.AddReflect(reflect.TypeOf(scan.ScannedStructureType{}))
	types.AddReflect(reflect.TypeOf(scan.ScannedTerritory{}))
	types.AddReflect(reflect.TypeOf(scan.ScannedVariation{}))
	types.AddReflect(reflect.TypeOf(scan.ScannedVital{}))
	types.AddReflect(reflect.TypeOf(scan.ScannedVitalModel{}))
	types.AddReflect(reflect.TypeOf(SearchItem{}))

	w := utils.NewStringBuilder()
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
