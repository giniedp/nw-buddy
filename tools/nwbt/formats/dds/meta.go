package dds

import (
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils/buf"
)

type Meta struct {
	Header     Header
	DX10Header *DX10Header
	HeaderSize int

	Data []byte
}

func LoadMeta(f nwfs.File) (res *Meta, err error) {
	data, err := f.Read()
	if err != nil {
		return
	}
	res = &Meta{}
	res.Data = data

	r := buf.NewReaderLE(data)
	header, err := readHeader(r)
	if err != nil {
		return nil, err
	}
	res.Header = header
	if header.PixelFormat.IsDX10() {
		dx10, err := readDX10Header(r)
		if err != nil {
			return nil, err
		}
		res.DX10Header = &dx10
	}
	res.HeaderSize = r.Pos()
	return
}
