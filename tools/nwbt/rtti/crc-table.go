package rtti

import (
	"nw-buddy/tools/utils/json"
	"nw-buddy/tools/utils/str"
	"os"
)

type CrcTable map[uint32]string

func NewCrcTable() CrcTable {
	return make(map[uint32]string)
}

func (it CrcTable) Has(crc uint32) bool {
	_, ok := it[crc]
	return ok
}

func (it CrcTable) Get(crc uint32) string {
	return it[crc]
}

func (it CrcTable) Put(crc uint32, name string) {
	it[crc] = name
}

func (it CrcTable) PutName(name string) {
	crc := str.Crc32(name)
	it[crc] = name
}

func (it CrcTable) HasName(name string) bool {
	return it.Has(str.Crc32(name))
}

func LoadOrCreateCrcTable(path string) CrcTable {
	table, err := LoadCrcTable(path)
	if err != nil {
		return NewCrcTable()
	}
	return table
}

func LoadCrcTable(path string) (CrcTable, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	var it CrcTable
	if err := json.DecodeJSON(file, &it); err != nil {
		return nil, err
	}
	return it, nil
}

func (it CrcTable) Save(path string) error {
	data, err := json.MarshalJSON(it, "", "\t")
	if err != nil {
		return err
	}
	return os.WriteFile(path, data, os.ModePerm)
}

func (it CrcTable) Merge(other CrcTable) {
	for k, v := range other {
		it[k] = v
	}
}
