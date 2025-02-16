package datasheet

import (
	"fmt"
	"io"
	"nw-buddy/tools/nw-kit/nwfs"
	"nw-buddy/tools/nw-kit/utils"
)

type FieldType int

const (
	StringType FieldType = 1
	NumberType FieldType = 2
	BoolType   FieldType = 3
)

type Record struct {
	Schema string
	Table  string
	Cols   []Col
	Rows   [][]any
}

type Col struct {
	Type FieldType
	Name string
}

func Load(f nwfs.File) (Record, error) {
	data, err := f.Read()
	if err != nil {
		return Record{}, err
	}
	return Parse(data)
}

func Read(r io.Reader) (Record, error) {
	data, err := io.ReadAll(r)
	if err != nil {
		return Record{}, err
	}
	return Parse(data)
}

func Parse(data []byte) (Record, error) {
	r := utils.NewByteReaderLE(data)
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
		value := string(utils.Must(r.ReadUntilByte(0)))
		r.SeekAbsolute(restore)
		return value
	}

	res := Record{}
	res.Schema = readString(int(to))
	res.Table = readString(int(no))
	res.Cols = make([]Col, colCount)
	res.Rows = make([][]any, rowCount)

	for i := 0; i < colCount; i++ {
		r.MustReadUint32()      // crc
		o := r.MustReadUint32() // offset
		t := r.MustReadUint32() // type
		n := readString(int(o))
		res.Cols[i] = Col{
			Type: FieldType(t),
			Name: n,
		}
	}

	for i := 0; i < rowCount; i++ {
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
				panic(fmt.Sprintf("unknown type %v", col.Type))
			}
		}
		res.Rows[i] = row
	}
	return res, nil
}
