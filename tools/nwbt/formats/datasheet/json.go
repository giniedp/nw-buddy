package datasheet

import (
	"fmt"
	"nw-buddy/tools/utils/json"
	"nw-buddy/tools/utils/maps"
	"reflect"
	"strconv"
)

func (it *Document) MarshalJSON() ([]byte, error) {
	return it.ToJSON()
}

func (it *Document) ToJSON(format ...string) ([]byte, error) {
	res := maps.NewDict[any]()
	header := maps.NewDict[any]()
	header.Store("type", it.Schema)
	header.Store("name", it.Table)
	header.Store("fields", it.colsAsJSON())
	res.Store("header", header)
	res.Store("rows", it.RowsAsJSON())
	return json.MarshalJSON(res, format...)
}

func (it *Document) RowsToJSON(format ...string) ([]byte, error) {
	return json.MarshalJSON(it.RowsAsJSON(), format...)
}

func (it *Document) colsAsJSON() any {
	res := maps.NewDict[string]()
	for _, col := range it.Cols {
		switch col.Type {
		case StringType:
			res.Store(col.Name, "string")
		case NumberType:
			res.Store(col.Name, "number")
		case BoolType:
			res.Store(col.Name, "boolean")
		}
	}
	return res
}

func (it *Document) RowsAsJSON() JSONRows {
	// TODO: make omitting empty values optional

	res := make(JSONRows, 0)
	for _, row := range it.Rows {
		r := maps.NewSafeDict[any]()
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
				r.Store(col, v)
			case float32:
				r.Store(col, v)
			case float64:
				r.Store(col, v)
			case bool:
				r.Store(col, v)
			default:
				rv := reflect.ValueOf(val)
				if (rv.Kind() == reflect.Slice || rv.Kind() == reflect.Map) && rv.Len() == 0 {
					continue
				}
				r.Store(col, val)
			}
		}
		res = append(res, JSONRow{r})
	}
	return res
}

type JSONRows []JSONRow
type JSONRow struct {
	m *maps.SafeDict[any]
}

func (r *JSONRow) MarshalJSON() ([]byte, error) {
	return r.m.MarshalJSON()
}

// GetString returns the value of the key as a string.
// If the value is a string, it is returned as is.
// Otherwise it is formatted using fmt.Sprintf("%v", v).
func (r *JSONRow) GetString(key string) string {
	v, ok := r.m.Load(key)
	if v == nil || !ok {
		return ""
	}
	if str, ok := v.(string); ok {
		return str
	}
	return fmt.Sprintf("%v", v)
}

// GetInt returns the value of the key as an int.
// If the value is a float32, float64 or string, it is converted to an int.
// Otherwise it returns 0.
func (r *JSONRow) GetInt(key string) int {
	v, ok := r.m.Load(key)
	if !ok || v == nil {
		return 0
	}
	switch it := v.(type) {
	case float32:
		return int(it)
	case float64:
		return int(it)
	case string:
		res, _ := strconv.Atoi(it)
		return res
	default:
		return 0
	}
}

// GetNumber returns the value of the key as a float32.
// If the value is a float32, float64 or string, it is converted to an float32.
// Otherwise it returns 0.
func (r *JSONRow) GetNumber(key string) float32 {
	v, ok := r.m.Load(key)
	if !ok || v == nil {
		return 0
	}
	switch it := v.(type) {
	case float32:
		return float32(it)
	case float64:
		return float32(it)
	case string:
		res, _ := strconv.ParseFloat(it, 32)
		return float32(res)
	default:
		return 0
	}
}
