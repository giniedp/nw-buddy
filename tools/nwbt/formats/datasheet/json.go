package datasheet

import (
	"nw-buddy/tools/utils"
	"reflect"
)

func (it *Document) ToJSON(format ...string) ([]byte, error) {
	return utils.MarshalJSON(it.asJSON(), format...)
}

func (it *Document) RowsToJSON(format ...string) ([]byte, error) {
	return utils.MarshalJSON(it.RowsAsJSON(), format...)
}

func (it *Document) asJSON() any {
	res := utils.NewRecord[any]()
	header := utils.NewRecord[any]()
	header.Set("type", it.Schema)
	header.Set("name", it.Table)
	header.Set("fields", it.colsAsJSON())
	res.Set("header", header)
	res.Set("rows", it.RowsAsJSON())
	return res
}

func (it *Document) colsAsJSON() any {
	res := utils.NewRecord[string]()
	for _, col := range it.Cols {
		switch col.Type {
		case StringType:
			res.Set(col.Name, "string")
		case NumberType:
			res.Set(col.Name, "number")
		case BoolType:
			res.Set(col.Name, "boolean")
		}
	}
	return res
}

func (it *Document) RowsAsJSON() JSONRows {
	// TODO: make omitting empty values optional

	res := make(JSONRows, 0)
	for _, row := range it.Rows {
		r := utils.NewRecord[any]()
		for i := range it.Cols {
			col := it.Cols[i].Name
			val := row[i]

			if val == nil {
				continue
			}

			switch v := val.(type) {
			case string:
				if v == "" {
					continue
				}
				r.Set(col, v)
			case float32:
				r.Set(col, v)
			case float64:
				r.Set(col, v)
			case bool:
				r.Set(col, v)
			default:
				rv := reflect.ValueOf(val)
				if (rv.Kind() == reflect.Slice || rv.Kind() == reflect.Map) && rv.Len() == 0 {
					continue
				}
				r.Set(col, val)
			}
		}
		res = append(res, JSONRow{r})
	}
	return res
}

type JSONRows []JSONRow
type JSONRow struct {
	*utils.Record[any]
}

func (r JSONRow) GetString(key string) string {
	v, ok := r.Get(key)
	if !ok {
		return ""
	}
	if str, ok := v.(string); ok {
		return str
	}
	return ""
}
