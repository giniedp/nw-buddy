package converter

import (
	"bytes"
	"database/sql"
	"fmt"
	"log/slog"
	"nw-buddy/tools/nw-kit/formats/datasheet"
	"os"
	"path"
	"strings"
	"text/template"

	_ "github.com/mattn/go-sqlite3"
)

func DatasheetsToSqlite(sheets []datasheet.Document, outFile string) error {
	outDir := path.Dir(outFile)
	dbFile := outFile

	if stat, err := os.Stat(outDir); err != nil || !stat.IsDir() {
		os.MkdirAll(outDir, 0755)
	}

	if _, err := os.Stat(dbFile); err == nil {
		slog.Info(fmt.Sprintf("  remove previous file %v", dbFile))
		if err = os.Remove(dbFile); err != nil {
			return err
		}
	}

	slog.Info(fmt.Sprintf("open db %s", dbFile))

	db, err := sql.Open("sqlite3", dbFile)
	if err != nil {
		return err
	}

	for _, sheet := range sheets {
		slog.Info(fmt.Sprintf("  processing %s.%s Rows %v Cols %v", sheet.Schema, sheet.Table, len(sheet.Rows), len(sheet.Cols)))
		stmt, err := datasheetToSqlStatement(sheet)
		if err != nil {
			return err
		}
		for _, s := range stmt {
			_, err = db.Exec(s)
			if err != nil {
				return err
			}
		}
	}
	return nil
}

func datasheetToSqlStatement(t datasheet.Document) ([]string, error) {
	MAX_COLS := 2000
	segments := len(t.Cols)/MAX_COLS + 1

	statements := make([]string, 0)
	for si := 0; si < segments; si++ {
		tableName := fmt.Sprintf("%s.%s", t.Schema, t.Table)
		if si > 0 {
			tableName = fmt.Sprintf("%s_%d", tableName, si)
		}
		table := SchemaToSqlDirective{
			Name: tableName,
		}
		for ci := si * MAX_COLS; ci < (si+1)*MAX_COLS && ci < len(t.Cols); ci++ {
			col := t.Cols[ci]
			t := ""
			switch col.Type {
			case datasheet.StringType:
				t = "TEXT"
			case datasheet.NumberType:
				t = "DECIMAL"
			case datasheet.BoolType:
				t = "BOOLEAN"
			default:
				t = "TEXT"
			}
			table.Cols = append(table.Cols, struct {
				Name   string
				Type   string
				Ref    string
				Unique bool
				Nocase bool
			}{
				Name:   col.Name,
				Type:   t,
				Ref:    "",
				Unique: false,
				Nocase: col.Type == datasheet.StringType,
			})
		}
		for _, row := range t.Rows {
			insert := make([]string, 0)
			for ci := si * MAX_COLS; ci < (si+1)*MAX_COLS && ci < len(t.Cols); ci++ {
				col := t.Cols[ci]
				v, err := getSqliteValue(col, row[ci])
				if err != nil {
					slog.Warn("Error getting sqlite value", "err", err)
				}
				insert = append(insert, v)
			}
			table.Insert = append(table.Insert, insert)
		}
		var tpl bytes.Buffer
		if err := tplSqliteCreateTable.Execute(&tpl, table); err != nil {
			return nil, err
		}
		statements = append(statements, tpl.String())
	}

	return statements, nil
}

type SchemaToSqlDirective struct {
	Schema string
	Name   string
	Cols   []struct {
		Name   string
		Type   string
		Ref    string
		Unique bool
		Nocase bool
	}
	Insert [][]string
}

var tplSqliteCreateTable = template.Must(template.New("createTableSqlite").Funcs(template.FuncMap{
	"sub": func(a, b int) int {
		return a - b
	}}).Parse(`
CREATE TABLE IF NOT EXISTS '{{ if .Schema }}{{.Schema}}.{{ end }}{{ .Name }}' (
  {{- range $index, $col := .Cols -}}
  {{ if $index }},{{ end }}
  '{{ $col.Name }}' {{ $col.Type -}}
	{{ if $col.Unique }} UNIQUE {{ end -}}
  {{ if $col.Nocase }} COLLATE NOCASE {{ end -}}
  {{ end }}
);
{{- if len .Insert }}
INSERT INTO '{{ if .Schema }}{{.Schema}}.{{ end }}{{ .Name }}' ({{- range $index, $col := .Cols }}{{ if $index }},{{ end }}'{{ $col.Name }}'{{ end }})
VALUES
  {{- range $rowIndex, $row := .Insert -}}
  {{- if $rowIndex }},{{ end }}
  ({{- range $vi, $val := $row }}{{ if $vi }},{{ end }}{{ $val }}{{ end -}})
  {{- end }};
{{- end }}
`))

func getSqliteValue(col datasheet.Col, value any) (string, error) {
	if value == nil {
		return "NULL", nil
	}
	switch value.(type) {
	case string:
		if value == "" {
			return "NULL", nil
		}
		return "'" + strings.ReplaceAll(fmt.Sprintf("%s", value), "'", "''") + "'", nil
	case bool:
		return strings.ToUpper(fmt.Sprintf("%t", value)), nil
	case float32:
		return fmt.Sprintf("%f", value), nil
	default:
		return "", fmt.Errorf("unknown type %v", col.Type)
	}
}
