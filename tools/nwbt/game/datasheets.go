package game

import (
	"iter"
	"log/slog"
	"nw-buddy/tools/formats/datasheet"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils/progress"
	"strings"
)

func (it *Assets) ListDatasheets() ([]nwfs.File, error) {
	files, err := it.Archive.Glob("**/*.datasheet")
	if err != nil {
		return nil, err
	}
	return files, nil
}

func (it *Assets) LoadDatasheets() error {
	files, err := it.ListDatasheets()
	if err != nil {
		return err
	}

	bar := progress.Bar(len(files), "Loading datasheets")
	for _, file := range files {
		bar.Add(1)
		bar.Detail(file.Path())
		it.LoadDatasheet(file)
	}
	bar.Detail("")
	bar.Close()
	return nil
}

// DatasheetsOfTable yields the datasheets with the given table name (case insensitive). Only those sheets are parsed
// and cached; the table name index is built once from the sheet headers.
func (it *Assets) DatasheetsOfTable(table string) iter.Seq[*datasheet.Document] {
	it.tableIndexOnce.Do(it.buildTableIndex)
	files := it.tableIndex[strings.ToLower(table)]
	return func(yield func(*datasheet.Document) bool) {
		for _, file := range files {
			sheet, _ := it.LoadDatasheet(file)
			if sheet != nil && !yield(sheet) {
				return
			}
		}
	}
}

// DatasheetsOfSchema yields the datasheets with the given schema name (case insensitive), e.g. all
// MasterItemDefinitions tables
func (it *Assets) DatasheetsOfSchema(schema string) iter.Seq[*datasheet.Document] {
	it.tableIndexOnce.Do(it.buildTableIndex)
	files := it.schemaIndex[strings.ToLower(schema)]
	return func(yield func(*datasheet.Document) bool) {
		for _, file := range files {
			sheet, _ := it.LoadDatasheet(file)
			if sheet != nil && !yield(sheet) {
				return
			}
		}
	}
}

func (it *Assets) buildTableIndex() {
	files, _ := it.ListDatasheets()
	tables := make(map[string][]nwfs.File)
	schemas := make(map[string][]nwfs.File)
	for _, file := range files {
		data, err := file.Read()
		if err != nil {
			slog.Warn("datasheet not read", "file", file.Path(), "err", err)
			continue
		}
		table, schema, err := datasheet.ParseNames(data)
		if err != nil {
			slog.Warn("datasheet header not parsed", "file", file.Path(), "err", err)
			continue
		}
		tables[strings.ToLower(table)] = append(tables[strings.ToLower(table)], file)
		schemas[strings.ToLower(schema)] = append(schemas[strings.ToLower(schema)], file)
	}
	it.tableIndex = tables
	it.schemaIndex = schemas
}

func (it *Assets) EachDatasheet() iter.Seq[*datasheet.Document] {
	return func(yield func(*datasheet.Document) bool) {
		files, _ := it.ListDatasheets()
		for _, file := range files {
			sheet, _ := it.LoadDatasheet(file)
			if !yield(sheet) {
				return
			}
		}
	}
}
