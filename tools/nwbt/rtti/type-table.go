package rtti

import (
	"nw-buddy/tools/utils/json"
	"os"
	"slices"
	"strings"
)

type TypeTable map[string]*Type

type Type struct {
	ID      string
	Name    string
	Members map[uint32]*Member
}

type Member struct {
	Crc32   uint32
	Name    string
	TypeID  string
	TypeIDs []string
	Array   bool
}

func NewTypeTable() TypeTable {
	return make(map[string]*Type)
}

func (it TypeTable) Has(uuid string) bool {
	_, ok := it[uuid]
	return ok
}

func (it TypeTable) GetOrCreate(uuid string) *Type {
	if _, ok := it[uuid]; !ok {
		it[uuid] = &Type{
			ID:      uuid,
			Members: make(map[uint32]*Member),
		}
	}
	return it[uuid]
}

func (it *Type) GetOrCreate(crc uint32) *Member {
	if _, ok := it.Members[crc]; !ok {
		it.Members[crc] = &Member{
			Crc32:   crc,
			TypeIDs: make([]string, 0),
		}
	}
	return it.Members[crc]
}

func (it *Member) AddType(typeId string) {
	if it.TypeID == "" {
		it.TypeID = typeId
		return
	}
	if it.TypeID != typeId && !slices.Contains(it.TypeIDs, typeId) {
		it.TypeIDs = append(it.TypeIDs, typeId)
		return
	}
}

func NormalizeUUID(uuid string) string {
	uuid = strings.TrimPrefix(uuid, "{")
	uuid = strings.TrimSuffix(uuid, "}")
	return strings.ToUpper(uuid)
}

func LoadTypeTable(path string) (TypeTable, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	var table TypeTable
	if err := json.DecodeJSON(file, &table); err != nil {
		return nil, err
	}
	return table, nil
}

func (it TypeTable) SaveJson(file string) error {
	data, err := json.MarshalJSON(it, "", "\t")
	if err != nil {
		return err
	}
	return os.WriteFile(file, data, os.ModePerm)
}
