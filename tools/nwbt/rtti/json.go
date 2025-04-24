package rtti

import (
	"fmt"
	"log/slog"
	"nw-buddy/tools/formats/azcs"
	"nw-buddy/tools/rtti/nwt"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/json"
	"nw-buddy/tools/utils/maps"
	"strings"
)

func ObjectStreamToJSON(it *azcs.Object, crc CrcTable, ids UuidTable) (data []byte, err error) {
	defer utils.HandleRecover(&err)

	res := make([]any, 0)
	it.Walk(func(node *azcs.WalkNode) bool {

		typeID := node.Element.Type2
		if typeID == "" {
			typeID = node.Element.Type
		}
		typeName := ids[typeID]
		if typeName == "" {
			typeName = typeID
		}

		var value any = nil
		if _, ok := nwt.PRIMITIVES[typeID]; ok {
			value, err = Load(node.Element)
			if err != nil {
				slog.Warn(fmt.Sprintf("error loading a primitive %v: %v", typeID, err))
			}
		} else {
			rec := maps.NewDict[any]()
			rec.Store("__type", typeName)
			if node.Depth == 0 {
				res = append(res, rec)
			}
			node.Data = rec
			value = rec
		}

		if node.Parent == nil {
			return true
		}

		parentRec, ok := node.Parent.Data.(*maps.Dict[any])
		if !ok {
			return true
		}

		name := crc.Get(node.Element.NameCrc)
		if name == "" {
			name = fmt.Sprintf("__crc_%v", node.Element.NameCrc)
		}

		current, ok := parentRec.LoadOrStore(name, value)
		if !ok {
			return true
		}

		if array, ok := current.([]any); ok {
			parentRec.Store(name, append(array, value))
		} else {
			parentRec.Store(name, []any{current, value})
		}

		return true
	})

	if len(res) == 1 {
		data, err = json.MarshalJSON(res[0], "", "\t")
	} else {
		data, err = json.MarshalJSON(res, "", "\t")
	}
	return
}

func ObjectStreamXmlToJSON(it *azcs.XmlObject, ids UuidTable) (data []byte, err error) {
	defer utils.HandleRecover(&err)

	res := make([]any, 0)
	it.Walk(func(node *azcs.WalkXmlNode) bool {

		typeID := NormalizeUUID(node.Element.Type2)
		if typeID == "" {
			typeID = NormalizeUUID(node.Element.Type)
		}
		typeName := ids[typeID]
		if typeName == "" {
			typeName = typeID
		}

		var value any = nil
		if _, ok := nwt.PRIMITIVES[typeID]; ok {
			value, err = LoadXml(node.Element)
			if err != nil {
				slog.Warn(fmt.Sprintf("error loading a primitive %v: %v", typeID, err))
			}
		} else {
			rec := maps.NewDict[any]()
			rec.Store("__type", typeName)
			if node.Depth == 0 {
				res = append(res, rec)
			}
			node.Data = rec
			value = rec
		}

		if node.Parent == nil {
			return true
		}

		parentRec, ok := node.Parent.Data.(*maps.Dict[any])
		if !ok {
			return true
		}

		name := strings.ToLower(node.Element.Field)
		current, ok := parentRec.LoadOrStore(name, value)
		if !ok {
			return true
		}

		if array, ok := current.([]any); ok {
			parentRec.Store(name, append(array, value))
		} else {
			parentRec.Store(name, []any{current, value})
		}

		return true
	})

	if len(res) == 1 {
		data, err = json.MarshalJSON(res[0], "", "\t")
	} else {
		data, err = json.MarshalJSON(res, "", "\t")
	}
	return
}
