package tx

import (
	"context"
	"nw-buddy/tools/nw-kit/formats/datasheet"
	"regexp"
	"strings"
)

type Transformer interface {
	Transform(table *datasheet.Document, ctx context.Context) error
}

type Rule struct {
	Schema     string
	Table      string
	Match      func(table *datasheet.Document) bool
	Transforms []Transformer
}

type MapProp struct {
	Keys     []string
	KeyMatch []string
	Op       func(key string, value any) any
}

func (it MapProp) Transform(table *datasheet.Document, ctx context.Context) error {
	cols, err := findCols(table, it.Keys, it.KeyMatch)
	if err != nil {
		return err
	}
	for _, row := range table.Rows {
		for _, index := range cols {
			col := table.Cols[index].Name
			row[index] = it.Op(col, row[index])
		}
	}
	return nil
}

type MapPropToArray struct {
	Keys  []string
	Match []string
	Sep   string
	Map   func(value string) string
}

func (it MapPropToArray) Transform(table *datasheet.Document, ctx context.Context) error {
	cols, err := findCols(table, it.Keys, it.Match)
	if err != nil {
		return err
	}
	for _, row := range table.Rows {
		for _, index := range cols {
			value := row[index]
			switch v := value.(type) {
			case string:
				tokens := strings.FieldsFunc(v, func(c rune) bool {
					return strings.Contains(it.Sep, string(c))
				})
				if it.Map != nil {
					for i, token := range tokens {
						tokens[i] = it.Map(token)
					}
				}
				row[index] = tokens
			}
		}
	}
	return nil
}

type NullifyProps struct {
	Keys     []string
	KeyMatch []string
	Test     func(key string, value any) bool
}

func (it NullifyProps) Transform(table *datasheet.Document, ctx context.Context) error {
	ki, err := findCols(table, it.Keys, it.KeyMatch)
	if err != nil {
		return err
	}
	for _, row := range table.Rows {
		for _, index := range ki {
			col := table.Cols[index].Name
			if it.Test == nil || it.Test(col, row[index]) {
				row[index] = nil
			}
		}
	}
	return nil
}

type MapValue struct {
	Op func(ctx context.Context, key string, value any, rowIndex int) any
}

func (it MapValue) Transform(table *datasheet.Document, ctx context.Context) error {
	for rowIndex, row := range table.Rows {
		for index := range table.Cols {
			col := table.Cols[index].Name
			row[index] = it.Op(ctx, col, row[index], rowIndex)
		}
	}
	return nil
}

func findCols(table *datasheet.Document, keyList []string, keyRegx []string) ([]int, error) {
	res := make([]int, 0)

	keyMatch := make([]*regexp.Regexp, 0)
	for _, reg := range keyRegx {
		match, err := regexp.Compile(reg)
		if err != nil {
			return res, err
		}
		keyMatch = append(keyMatch, match)
	}

outside:
	for index, col := range table.Cols {
		for _, key := range keyList {
			if col.Name == key {
				res = append(res, index)
				continue outside
			}
		}
		for _, match := range keyMatch {
			if match.MatchString(col.Name) {
				res = append(res, index)
				continue outside
			}
		}
	}
	return res, nil
}

func TransformTable(table *datasheet.Document, rules []Rule, ctx context.Context) error {
	for _, rule := range rules {
		if rule.Match != nil && !rule.Match(table) {
			continue
		}
		if rule.Schema != "" && rule.Schema != table.Schema {
			continue
		}
		if rule.Table != "" && rule.Table != table.Table {
			continue
		}
		for _, transform := range rule.Transforms {
			if err := transform.Transform(table, ctx); err != nil {
				return err
			}
		}
	}
	return nil
}
