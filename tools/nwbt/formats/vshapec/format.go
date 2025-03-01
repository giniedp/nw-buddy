package vshapec

import (
	"io"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/buf"
)

type Record struct {
	Version    uint32            `json:"version"`
	Vertices   [][3]float32      `json:"vertices"`
	Properties map[string]string `json:"properties"`
}

func Load(f nwfs.File) (*Record, error) {
	data, err := f.Read()
	if err != nil {
		return nil, err
	}
	return Parse(data)
}

func Read(r io.Reader) (*Record, error) {
	data, err := io.ReadAll(r)
	if err != nil {
		return nil, err
	}
	return Parse(data)
}

func Parse(data []byte) (res *Record, err error) {
	defer utils.HandleRecover(&err)

	r := buf.NewReaderLE(data)
	res = &Record{}
	res.Version = r.MustReadUint32()
	count := r.MustReadUint32()
	res.Vertices = make([][3]float32, count)
	for i := 0; i < int(count); i++ {
		res.Vertices[i] = [3]float32{
			r.MustReadFloat32(),
			r.MustReadFloat32(),
			r.MustReadFloat32(),
		}
	}
	count = r.MustReadUint32()
	res.Properties = make(map[string]string, count)
	for i := 0; i < int(count); i++ {
		key := readString(r)
		value := readString(r)
		res.Properties[key] = value
	}
	return res, nil
}

func readString(r *buf.Reader) string {
	l := r.MustReadUint32()
	return string(r.MustReadBytes(int(l)))
}
