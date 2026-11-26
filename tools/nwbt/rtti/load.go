package rtti

import (
	"fmt"
	"log/slog"
	"nw-buddy/tools/formats/azcs"
	"nw-buddy/tools/rtti/nwt"
	"nw-buddy/tools/utils/maps"
	"nw-buddy/tools/utils/str"
	"reflect"
	"strconv"
	"strings"
	"sync"

	"github.com/gofrs/uuid"
)

func Load(el *azcs.Element) (any, error) {
	tt := getTargetTypeById(el.TypeId())
	if tt == nil {
		return nil, fmt.Errorf("unknown type %s", azcs.UUIDString(el.Type))
	}
	switch tt.Kind() {
	case reflect.Pointer:
		ptrVal := reflect.New(tt.Elem())
		ptr := ptrVal.Interface() // the actual pointer as an interface{} (any)
		err := loadInto(el, ptr)
		return ptr, err
	default:
		ptrVal := reflect.New(tt)
		ptr := ptrVal.Interface() // the actual pointer as an interface{} (any)
		err := loadInto(el, ptr)
		value := ptrVal.Elem().Interface() // the value that the pointer points to
		return value, err
	}
}

func LoadXml(el *azcs.XmlElement) (any, error) {
	tt := getTargetType(el.Type2, el.Type)
	if tt == nil {
		return nil, fmt.Errorf("unknown type %s", el.Type)
	}
	switch tt.Kind() {
	case reflect.Pointer:
		ptrVal := reflect.New(tt.Elem())
		ptr := ptrVal.Interface() // the actual pointer as an interface{} (any)
		err := loadIntoXml(el, ptr)
		return ptr, err
	default:
		ptrVal := reflect.New(tt)
		ptr := ptrVal.Interface() // the actual pointer as an interface{} (any)
		err := loadIntoXml(el, ptr)
		value := ptrVal.Elem().Interface() // the value that the pointer points to
		return value, err
	}
}

// targetTypesById holds nwt.PRIMITIVES and nwt.GENERATED keyed by the binary id, primitives take precedence
var targetTypesById = sync.OnceValue(func() map[uuid.UUID]reflect.Type {
	res := make(map[uuid.UUID]reflect.Type, len(nwt.PRIMITIVES)+len(nwt.GENERATED))
	for _, table := range []map[string]reflect.Type{nwt.GENERATED, nwt.PRIMITIVES} {
		for key, t := range table {
			id, err := uuid.FromString(key)
			if err != nil {
				slog.Warn("invalid type id", "id", key, "err", err)
				continue
			}
			res[id] = t
		}
	}
	return res
})

func getTargetTypeById(id uuid.UUID) reflect.Type {
	return targetTypesById()[id]
}

func getTargetType(type2, type1 string) reflect.Type {
	typeId := NormalizeUUID(type2)
	if typeId == "" {
		typeId = NormalizeUUID(type1)
	}
	typeId = strings.ToUpper(typeId)
	if t, ok := nwt.PRIMITIVES[typeId]; ok {
		return t
	}
	if t, ok := nwt.GENERATED[typeId]; ok {
		return t
	}
	return nil
}

func loadInto(el *azcs.Element, v any) error {
	// reflection madness, don't try to understand if you're short on time

	t := reflect.TypeOf(v)

	if t.Kind() != reflect.Ptr {
		return fmt.Errorf("must be a pointer")
	}
	ptr := reflect.ValueOf(v)
	if it, ok := ptr.Interface().(nwt.AzDeserialize); ok {
		err := it.Deserialize(el)
		return err
	}

	tEl := t.Elem()
	typeName := tEl.Name()
	for i := range tEl.NumField() {
		fieldName := tEl.Field(i).Name
		crcStr := tEl.Field(i).Tag.Get("crc")
		crc, err := strconv.Atoi(crcStr)
		if err != nil {
			slog.Warn(fmt.Sprintf("invalid crc '%s' %v", crcStr, err))
			continue
		}
		for _, child := range el.Elements {
			if child.NameCrc != uint32(crc) {
				continue
			}

			val, err := Load(child)
			if err != nil {
				slog.Warn(fmt.Sprintf("failed to load child data: %v", err))
				break
			}
			if val == nil {
				break
			}

			field := ptr.Elem().Field(i)
			if value, err := getMatchingValue(field.Type(), val); err == nil {
				field.Set(value)
				break
			}
			if field.Kind() != reflect.Slice && field.Kind() != reflect.Array {
				slog.Warn(fmt.Sprintf("can't set value to %s.%s: %v %v", typeName, fieldName, field.Type(), reflect.TypeOf(val)))
				break //
			}
			elemType := field.Type().Elem()
			if value, err := getMatchingValue(elemType, val); err == nil {
				newSlice := reflect.Append(field, value)
				field.Set(newSlice)
			} else {
				slog.Warn(fmt.Sprintf("can't append value on %s.%s: %v", typeName, fieldName, err))
			}
		}
	}

	return nil
}

var crcCache = maps.NewSyncMap[string, uint32]()

func nameToCrc(name string) uint32 {
	name = strings.ToLower(name)
	if v, ok := crcCache.Load(name); ok {
		return v
	}
	result := str.Crc32(name)
	crcCache.Store(name, result)
	return result
}

func loadIntoXml(el *azcs.XmlElement, v any) error {
	// reflection madness, don't try to understand if you're short on time

	t := reflect.TypeOf(v)

	if t.Kind() != reflect.Ptr {
		return fmt.Errorf("must be a pointer")
	}
	ptr := reflect.ValueOf(v)
	if it, ok := ptr.Interface().(nwt.AzDeserializeXml); ok {
		err := it.DeserializeXml(el)
		return err
	}

	tEl := t.Elem()
	typeName := tEl.Name()
	for i := range tEl.NumField() {
		fieldName := tEl.Field(i).Name
		crcStr := tEl.Field(i).Tag.Get("crc")
		crc, err := strconv.Atoi(crcStr)
		if err != nil {
			slog.Warn(fmt.Sprintf("invalid crc '%s' %v", crcStr, err))
			continue
		}
		for _, child := range el.Elements {
			if nameToCrc(child.Field) != uint32(crc) {
				continue
			}

			val, err := LoadXml(child)
			if err != nil {
				slog.Warn(fmt.Sprintf("failed to load child data: %v", err))
				break
			}
			if val == nil {
				break
			}

			field := ptr.Elem().Field(i)
			if value, err := getMatchingValue(field.Type(), val); err == nil {
				field.Set(value)
				break
			}
			if field.Kind() != reflect.Slice && field.Kind() != reflect.Array {
				slog.Warn(fmt.Sprintf("can't set value to %s.%s: %v %v", typeName, fieldName, field.Type(), reflect.TypeOf(val)))
				break //
			}
			elemType := field.Type().Elem()
			if value, err := getMatchingValue(elemType, val); err == nil {
				newSlice := reflect.Append(field, value)
				field.Set(newSlice)
			} else {
				slog.Warn(fmt.Sprintf("can't append value on %s.%s: %v", typeName, fieldName, err))
			}
		}
	}

	return nil
}

func getMatchingValue(targetType reflect.Type, val any) (reflect.Value, error) {
	valueType := reflect.TypeOf(val)
	value := reflect.ValueOf(val)

	if targetType == valueType {
		return value, nil
	}
	if targetType.Kind() == reflect.Ptr {
		// target is ptr, but value is not
		ptr := reflect.New(targetType.Elem()) // create new pointer
		ptr.Elem().Set(value)                 // set value to pointer
		return ptr, nil                       // return pointer
	}
	if value.Kind() == reflect.Ptr {
		// value is ptr, but target is not
		return value.Elem(), nil
	}
	if targetType.Kind() == reflect.Interface {
		return value, nil
	}

	return reflect.Value{}, fmt.Errorf("type mismatch %v != %v", targetType, valueType)
}
