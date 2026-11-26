package distribution

import (
	"bytes"
	"io"
	"math"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/buf"
	"path"
	"strconv"
	"strings"
)

type Document struct {
	Region    [2]uint32   `json:"region"`
	Slices    []string    `json:"slices"`
	Variants  []string    `json:"variants"`
	Indices   []uint16    `json:"indices"`
	Positions [][2]uint16 `json:"positions"`
	// packed like a vegetation instance's rotation, see UnpackRotation
	Rotations []uint32 `json:"rotations"`
	// uniform scale in hundredths
	Scales []uint8 `json:"scales"`
	// 0 terrain, 2 water, else the higher of both. Only in versioned files.
	HeightModes []uint8     `json:"heightModes"`
	Positions2  [][2]uint16 `json:"positions2"`
	Types2      []byte      `json:"types2"`
	Positions3  [][2]uint16 `json:"positions3"`
	Types3      []byte      `json:"types3"`
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
	version := -1
	if bytes.Equal(r.MustReadBytes(2), []byte{0xD6, 0xB9}) {
		version = int(r.MustReadUint16())
	} else {
		r.SeekRelative(-2)
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
		res.Rotations = make([]uint32, count)
		for i := range int(count) {
			res.Rotations[i] = r.MustReadUint32()
		}
		res.Scales = r.MustReadBytes(count)
		if version >= 1 {
			res.HeightModes = r.MustReadBytes(count)
		}
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

// UnpackRotation returns the quaternion (x, y, z, w) of a packed placement rotation: x and y in 10 bits over 255, z in
// 11 bits over 511, each less one, w rebuilt from them and negative with the top bit. Normalised, as the game does
// for distributed placements.
func UnpackRotation(packed uint32) [4]float32 {
	x := float64((packed>>21)&0x03ff)/255 - 1
	y := float64((packed>>11)&0x03ff)/255 - 1
	z := float64(packed&0x07ff)/511 - 1
	w := math.Sqrt(math.Max(0, 1-math.Min(1, x*x+y*y+z*z)))
	if packed&0x8000_0000 != 0 {
		w = -w
	}
	length := math.Sqrt(x*x + y*y + z*z + w*w)
	if length == 0 {
		return [4]float32{0, 0, 0, 1}
	}
	return [4]float32{float32(x / length), float32(y / length), float32(z / length), float32(w / length)}
}

// PlacementScale returns the uniform scale of a placement
func PlacementScale(scale uint8) float32 {
	return float32(scale) * 0.01
}

func readStringArray(r *buf.Reader, count int) []string {
	res := make([]string, count)
	for i := range count {
		c := r.MustReadByte()
		res[i] = string(r.MustReadBytes(int(c)))
	}
	return res
}

// ConvertPosition returns the world x and y of a placement: each code over 65535 of the 2048 m region.
// The game scales by the level's regionSize (tracts.json). The 1024 m levels (climaxftue_02, ftue_v2) ship
// distributions without placements, so 2048 holds for every placement today.
func ConvertPosition(region [2]uint32, position [2]uint16) (float32, float32) {
	areaSize := float32(2048)
	maxValue := float32(0xFFFF)
	x := float32(region[0])*areaSize + (float32(position[0])/maxValue)*areaSize
	y := float32(region[1])*areaSize + (float32(position[1])/maxValue)*areaSize
	return x, y
}
