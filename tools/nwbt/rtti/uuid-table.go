package rtti

import (
	"nw-buddy/tools/utils/json"
	"os"
	"strings"
)

type UuidTable map[string]string

func NewUuidTable() UuidTable {
	return make(map[string]string)
}

func (it UuidTable) Has(uuid string) bool {
	_, ok := it[uuid]
	return ok
}

func (it UuidTable) Get(uuid string) string {
	return it[uuid]
}

func (it UuidTable) Put(uuid, name string) {
	it[uuid] = name
}

func LoadOrCreateUuidTable(path string) UuidTable {
	table, err := LoadUuIdTable(path)
	if err != nil {
		return NewUuidTable()
	}
	return table
}

func LoadUuIdTable(path string) (UuidTable, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	var table UuidTable
	if err := json.DecodeJSON(file, &table); err != nil {
		return nil, err
	}
	return table, nil
}

func (it UuidTable) Save(path string) error {
	data, err := json.MarshalJSON(it, "", "\t")
	if err != nil {
		return err
	}
	return os.WriteFile(path, data, os.ModePerm)
}

func (it UuidTable) Merge(other UuidTable) {
	for k, v := range other {
		it[strings.ToUpper(k)] = v
	}
}
