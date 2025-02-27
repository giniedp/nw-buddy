package ts

import (
	"fmt"
	"nw-buddy/tools/formats/datasheet"
	"reflect"
	"slices"
	"strings"
)

type TypeMap map[string]*Type
type MemberMap map[string]*TypeMember
type Type struct {
	Name    string
	Members MemberMap
	Files   EnumMap
}
type TypeMember struct {
	Name    string
	Types   []string
	IsArray bool
	IsEnum  bool
}
type EnumMap map[string][]string

func keys[T any](it map[string]T) []string {
	keys := make([]string, 0, len(it))
	for key := range it {
		keys = append(keys, key)
	}
	return keys
}

func sortedKeys[T any](it map[string]T) []string {
	res := keys(it)
	slices.Sort(res)
	return res
}

func (it TypeMap) SortedKeys() []string {
	return sortedKeys(it)
}
func (it MemberMap) SortedKeys() []string {
	return sortedKeys(it)
}

func (it EnumMap) SortedKeys() []string {
	return sortedKeys(it)
}

func (it EnumMap) SortedValuesOf(enum string) []string {
	if values, ok := it[enum]; ok {
		slices.Sort(values)
		return values
	}
	return []string{}
}

func (it EnumMap) Add(enum string, value string) {
	if _, ok := it[enum]; !ok {
		it[enum] = make([]string, 0)
	}
	if slices.Contains(it[enum], value) {
		return
	}
	it[enum] = append(it[enum], value)
}

func (it *TypeMember) TsTypeName() string {
	t := "unknown"
	if it.IsEnum {
		t = it.Types[0]
	} else if len(it.Types) > 0 {
		t = strings.Join(it.Types, " | ")
	}
	if it.IsArray && len(it.Types) == 1 {
		t = t + "[]"
	}
	if it.IsArray && len(it.Types) > 1 {
		t = fmt.Sprintf("Array<%s>", t)
	}
	return t
}

func ResolveTableTypes(tables []*datasheet.Document) TypeMap {
	slices.SortFunc(tables, func(a, b *datasheet.Document) int {
		return strings.Compare(getTableTypeName(a), getTableTypeName(b))
	})

	types := make(TypeMap, 0)
	for _, table := range tables {
		tableName := getTableTypeName(table)
		if _, ok := types[tableName]; !ok {
			types[tableName] = &Type{
				Name:    tableName,
				Members: make(map[string]*TypeMember),
				Files:   make(EnumMap),
			}
		}
		typeInfo := types[tableName]
		typeInfo.Files.Add(table.Table, table.File)

	cols:
		for i, col := range table.Cols {
			if _, ok := typeInfo.Members[col.Name]; !ok {
				typeInfo.Members[col.Name] = &TypeMember{
					Name:    col.Name,
					Types:   make([]string, 0),
					IsArray: false,
					IsEnum:  false,
				}
			}
			memberInfo := typeInfo.Members[col.Name]
			if it, ok := ENUMS[tableName]; ok {
				if enum, ok := it[col.Name]; ok {
					memberInfo.Types = []string{enum}
					memberInfo.IsEnum = true
					continue cols
				}
			}

			if memberInfo.IsArray {
				continue
			}
			for _, row := range table.Rows {
				value := row[i]
				if isValueArray(value) {
					memberInfo.IsArray = true
					continue
				}
				valueType := getTypeOf(value)
				if valueType == "" {
					continue
				}
				if slices.Contains(memberInfo.Types, valueType) {
					continue
				}
				memberInfo.Types = append(memberInfo.Types, valueType)
			}
		}
	}
	return types
}

func ResolveEnumTypes(tables []*datasheet.Document) EnumMap {
	out := make(EnumMap)
	for _, table := range tables {
		tableName := getTableTypeName(table)
		for i, col := range table.Cols {
			spec, hasEnum := ENUMS[tableName]
			if !hasEnum {
				continue
			}
			enum, isEnum := spec[col.Name]
			if !isEnum {
				continue
			}
			for _, row := range table.Rows {
				if row[i] == nil {
					continue
				}

				var vList []string
				vKind := reflect.TypeOf(row[i]).Kind()
				if vKind != reflect.Slice && vKind != reflect.Array {
					vList = []string{fmt.Sprintf("%s", row[i])}
				} else {
					vList = row[i].([]string)
				}
				for _, v := range vList {
					out.Add(enum, v)
				}
			}
		}
	}
	return out
}

func getTypeOf(value any) string {
	switch value.(type) {
	case string:
		return "string"
	case float32:
		return "number"
	case bool:
		return "boolean"
	}
	return ""
}

func isValueArray(value any) (res bool) {
	if value == nil {
		return false
	}
	kind := reflect.TypeOf(value).Kind()
	res = kind == reflect.Slice || kind == reflect.Array
	return
}

func getTableTypeName(rec *datasheet.Document) string {
	switch rec.Schema {
	case "unknown":
		{
			return rec.Table
		}
	case "CategoricalProgressionRankData":
		{
			return rec.Table
		}
	case "VariationData":
		{
			if strings.HasPrefix(rec.Table, "Gatherable_") {
				return "VariationDataGatherable"
			}
			if strings.HasPrefix(rec.Table, "HouseItems") {
				return "HouseItems"
			}
		}
	}
	return rec.Schema
}

func (it TypeMap) AddReflect(t reflect.Type) {
	if _, ok := it[t.Name()]; ok {
		return
	}
	it[t.Name()] = &Type{
		Name:    t.Name(),
		Members: make(MemberMap),
	}
	for i := range t.NumField() {
		field := t.Field(i)
		name := field.Name
		tag := field.Tag.Get("json")
		if tag != "" {
			name = strings.Split(tag, ",")[0]
		}
		if name == "-" || name == "" {
			continue
		}
		it[t.Name()].Members[name] = &TypeMember{
			Name:  name,
			Types: []string{it.getTypeName(field.Type)},
		}
	}
}

func (it TypeMap) getTypeName(t reflect.Type) string {
	switch t.Kind() {
	case reflect.String:
		return "string"
	case reflect.Bool:
		return "boolean"
	case reflect.Int:
		return "number"
	case reflect.Int8:
		return "number"
	case reflect.Int16:
		return "number"
	case reflect.Int32:
		return "number"
	case reflect.Int64:
		return "number"
	case reflect.Uint:
		return "number"
	case reflect.Uint8:
		return "number"
	case reflect.Uint16:
		return "number"
	case reflect.Uint32:
		return "number"
	case reflect.Uint64:
		return "number"
	case reflect.Float32:
		return "number"
	case reflect.Float64:
		return "number"
	case reflect.Slice:
		return fmt.Sprintf("Array<%s>", it.getTypeName(t.Elem()))
	case reflect.Array:
		name := "["
		for i := range t.Len() {
			if i > 0 {
				name += ","
			}
			name += it.getTypeName(t.Elem())
		}
		name += "]"
		return name
	case reflect.Struct:
		it.AddReflect(t)
		name := t.Name()
		pkgPath := t.PkgPath()
		return strings.TrimPrefix(name, pkgPath)
	case reflect.Ptr:
		return it.getTypeName(t.Elem())
	case reflect.Map:
		return fmt.Sprintf("Record<%s, %s>", it.getTypeName(t.Key()), it.getTypeName(t.Elem()))
	case reflect.Interface:
		return "any"
	default:
		return "unknown"
	}
}
