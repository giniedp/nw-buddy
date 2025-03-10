package datasheet

import (
	"fmt"
	"io"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/buf"
)

type FieldTypeID int

const (
	StringType FieldTypeID = 1
	NumberType FieldTypeID = 2
	BoolType   FieldTypeID = 3
)

var (
	ErrKeyNotFound = fmt.Errorf("key not found")
	ErrUnknownType = fmt.Errorf("unknown type")
)

type FieldType interface {
	string | bool | float32
}

type Document struct {
	File   string
	Schema string
	Table  string
	Cols   []Col
	Rows   [][]any
}

type Col struct {
	Type FieldTypeID
	Name string
}

func Load(f nwfs.File) (Document, error) {
	data, err := f.Read()
	if err != nil {
		return Document{}, err
	}
	res, err := Parse(data)
	res.File = f.Path()
	return res, err
}

func Read(r io.Reader) (Document, error) {
	data, err := io.ReadAll(r)
	if err != nil {
		return Document{}, err
	}
	return Parse(data)
}

func Parse(data []byte) (Document, error) {
	r := buf.NewReaderLE(data)
	r.MustReadBytes(4)      // signatrue
	r.MustReadInt32()       // name crc
	no := r.MustReadInt32() // name offset
	r.MustReadInt32()       // type crc
	to := r.MustReadInt32() // type offset
	r.SeekRelative(4)       // unknown
	r.MustReadInt32()       // strings length
	r.SeekRelative(7 * 4)
	strOffset := r.MustReadInt32() // strings offset

	headerEnd := r.Pos()
	r.SeekRelative(2 * 4)
	colCount := int(r.MustReadInt32())
	rowCount := int(r.MustReadInt32())
	r.SeekRelative(4 * 4)

	readString := func(offset int) string {
		restore := r.Pos()
		r.SeekAbsolute(headerEnd + int(strOffset) + offset)
		value := utils.Must(r.ReadCString())
		r.SeekAbsolute(restore)
		return value
	}

	res := Document{}
	res.Schema = readString(int(to))
	res.Table = readString(int(no))
	res.Cols = make([]Col, colCount)
	res.Rows = make([][]any, rowCount)

	for i := range colCount {
		r.MustReadUint32()      // crc
		o := r.MustReadUint32() // offset
		t := r.MustReadUint32() // type
		n := readString(int(o))
		res.Cols[i] = Col{
			Type: FieldTypeID(t),
			Name: n,
		}
	}

	for i := range rowCount {
		row := make([]any, colCount)
		for j, col := range res.Cols {
			switch col.Type {
			case StringType:
				r.SeekRelative(4) // hash
				o := r.MustReadUint32()
				row[j] = readString(int(o))
			case NumberType:
				r.SeekRelative(4) // hash
				row[j] = r.MustReadFloat32()
			case BoolType:
				r.SeekRelative(4) // hash
				row[j] = r.MustReadUint32() == 1
			default:
				panic(fmt.Errorf("%w %v", ErrUnknownType, col.Type))
			}
		}
		res.Rows[i] = row
	}
	return res, nil
}

func (it *Document) GetValue(row int, col string) (any, error) {
	for i, c := range it.Cols {
		if c.Name == col {
			return it.Rows[row][i], nil
		}
	}
	return nil, fmt.Errorf("%w %s", ErrKeyNotFound, col)
}

func (it *Document) GetValueStr(row int, col string) (string, bool) {
	val, err := it.GetValue(row, col)
	if err != nil {
		return "", false
	}
	v, ok := val.(string)
	return v, ok
}
