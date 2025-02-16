package distribution

import (
	"io"
	"nw-buddy/tools/nw-kit/nwfs"
	"nw-buddy/tools/nw-kit/utils"
	"path"
	"strconv"
	"strings"
)

type Record struct {
	Region     [2]uint32   `json:"region"`
	Slices     []string    `json:"slices"`
	Variants   []string    `json:"variants"`
	Indices    []uint16    `json:"indices"`
	Positions  [][2]uint16 `json:"positions"`
	Positions2 [][2]uint16 `json:"positions2"`
	Types2     []byte      `json:"types2"`
	Positions3 [][2]uint16 `json:"positions3"`
	Types3     []byte      `json:"types3"`
}

func Load(f nwfs.File) (*Record, error) {
	data, err := f.Read()
	if err != nil {
		return nil, err
	}
	return Parse(data, f.Path())
}

func Read(r io.Reader, file string) (*Record, error) {
	data, err := io.ReadAll(r)
	if err != nil {
		return nil, err
	}
	return Parse(data, file)
}

func Parse(data []byte, file string) (res *Record, err error) {
	defer utils.HandleRecover(&err)

	res = &Record{}
	tokens := strings.SplitN(path.Base(path.Dir(file)), "_", 3)
	if len(tokens) == 3 {
		r1, _ := strconv.Atoi(tokens[1])
		r2, _ := strconv.Atoi(tokens[2])
		res.Region = [2]uint32{uint32(r1), uint32(r2)}
	}

	r := utils.NewByteReaderLE(data)
	count := int(r.MustReadUint16())
	if count > 0 {
		res.Slices = readStringArray(r, count)
		res.Variants = readStringArray(r, count)
	}

	count = int(r.MustReadUint32())
	res.Indices = make([]uint16, count)
	res.Positions = make([][2]uint16, count)
	if count > 0 {
		for i := 0; i < int(count); i++ {
			res.Indices[i] = r.MustReadUint16()
		}
		for i := 0; i < int(count); i++ {
			res.Positions[i] = [2]uint16{
				r.MustReadUint16(),
				r.MustReadUint16(),
			}
		}
		r.SeekRelative(int(count * 4))
		r.SeekRelative(int(count))
	}

	count = int(r.MustReadUint32())
	res.Positions2 = make([][2]uint16, count)
	res.Types2 = make([]byte, count)
	if count > 0 {
		for i := 0; i < int(count); i++ {
			res.Positions2[i] = [2]uint16{
				r.MustReadUint16(),
				r.MustReadUint16(),
			}
		}
		for i := 0; i < int(count); i++ {
			res.Types2[i] = r.MustReadByte()
		}
	}

	count = int(r.MustReadUint32())
	res.Positions3 = make([][2]uint16, count)
	res.Types3 = make([]byte, count)
	if count > 0 {
		for i := 0; i < int(count); i++ {
			res.Positions3[i] = [2]uint16{
				r.MustReadUint16(),
				r.MustReadUint16(),
			}
		}
		for i := 0; i < int(count); i++ {
			res.Types3[i] = r.MustReadByte()
		}
	}

	return res, nil
}

func readStringArray(r *utils.ByteReader, count int) []string {
	res := make([]string, count)
	for i := 0; i < count; i++ {
		c := r.MustReadByte()
		res[i] = string(r.MustReadBytes(int(c)))
	}
	return res
}
