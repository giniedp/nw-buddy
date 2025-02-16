package datasheet

import (
	"nw-buddy/tools/nw-kit/utils"
)

func (it *Record) ToJSON(format ...string) ([]byte, error) {
	return utils.MarshalJSON(it.asJSON(), format...)
}

func (it *Record) RowsToJSON(format ...string) ([]byte, error) {
	return utils.MarshalJSON(it.rowsAsJSON(), format...)
}

func (it *Record) asJSON() any {
	res := utils.NewRecord[any]()
	header := utils.NewRecord[any]()
	header.Set("type", it.Schema)
	header.Set("name", it.Table)
	header.Set("fields", it.colsAsJSON())
	res.Set("header", header)
	res.Set("rows", it.rowsAsJSON())
	return res
}

func (it *Record) colsAsJSON() any {
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

func (it *Record) rowsAsJSON() any {
	res := make([]*utils.Record[any], 0)
	for _, row := range it.Rows {
		r := utils.NewRecord[any]()
		for i := range it.Cols {
			col := it.Cols[i].Name
			val := row[i]
			switch v := val.(type) {
			case string:
				if v != "" {
					r.Set(col, v)
				}
			default:
				r.Set(col, val)
			}
		}
		res = append(res, r)
	}
	return res
}
