package distribution

import (
	"bytes"
	"io"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/buf"
	"path"
	"strconv"
	"strings"
)

type Document struct {
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

func Load(f nwfs.File) (*Document, error) {
	data, err := f.Read()
	if err != nil {
		return nil, err
	}
	return Parse(data, f.Path())
}

func Read(r io.Reader, file string) (*Document, error) {
	data, err := io.ReadAll(r)
	if err != nil {
		return nil, err
	}
	return Parse(data, file)
}

func Parse(data []byte, file string) (res *Document, err error) {
	defer utils.HandleRecover(&err)

	res = &Document{}
	tokens := strings.SplitN(path.Base(path.Dir(file)), "_", 3)
	if len(tokens) == 3 {
		r1, _ := strconv.Atoi(tokens[1])
		r2, _ := strconv.Atoi(tokens[2])
		res.Region = [2]uint32{uint32(r1), uint32(r2)}
	}

	r := buf.NewReaderLE(data)
	peek := r.MustReadBytes(4)
	if !bytes.Equal(peek, []byte{0xD6, 0xB9, 0x01, 0x00}) {
		r.SeekRelative(-4)
	}

	count := int(r.MustReadUint16())
	if count > 0 {
		res.Slices = readStringArray(r, count)
		res.Variants = readStringArray(r, count)
	}

	count = int(r.MustReadUint32())
	res.Indices = make([]uint16, count)
	res.Positions = make([][2]uint16, count)
	if count > 0 {
		for i := range int(count) {
			res.Indices[i] = r.MustReadUint16()
		}
		for i := range int(count) {
			y := r.MustReadUint16()
			x := r.MustReadUint16()
			res.Positions[i] = [2]uint16{x, y}
		}
		r.SeekRelative(int(count * 4))
		r.SeekRelative(int(count))
	}

	count = int(r.MustReadUint32())
	res.Positions2 = make([][2]uint16, count)
	res.Types2 = make([]byte, count)
	if count > 0 {
		for i := range int(count) {
			y := r.MustReadUint16()
			x := r.MustReadUint16()
			res.Positions2[i] = [2]uint16{x, y}
		}
		for i := range int(count) {
			res.Types2[i] = r.MustReadByte()
		}
	}

	count = int(r.MustReadUint32())
	res.Positions3 = make([][2]uint16, count)
	res.Types3 = make([]byte, count)
	if count > 0 {
		for i := range int(count) {
			y := r.MustReadUint16()
			x := r.MustReadUint16()
			res.Positions3[i] = [2]uint16{x, y}
		}
		for i := range int(count) {
			res.Types3[i] = r.MustReadByte()
		}
	}

	return res, nil
}

func readStringArray(r *buf.Reader, count int) []string {
	res := make([]string, count)
	for i := range count {
		c := r.MustReadByte()
		res[i] = string(r.MustReadBytes(int(c)))
	}
	return res
}

func ConvertPosition(region [2]uint32, position [2]uint16) (float32, float32, float32, float32) {
	areaSize := float32(2048)
	maxValue := float32(0xFFFF)
	rx := float32(region[0]) * areaSize
	ry := float32(region[1]) * areaSize

	px := (float32(position[0]) / maxValue) * areaSize
	py := (float32(position[1]) / maxValue) * areaSize
	x := rx + px
	y := ry + py
	return x, y, px, py
}
