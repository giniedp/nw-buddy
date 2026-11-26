package heightmap

import (
	"encoding/binary"
	"encoding/json"
	"errors"
	"image"
	"log/slog"
	"nw-buddy/tools/nwfs"
	"path"
	"regexp"
	"strconv"
)

//"github.com/rngoodner/gtiff"

var (
	ErrMapSettingsNotFound = errors.New("mapsettings.json not found")
	ErrRegionSizeNotFound  = errors.New("regionSize not found in mapsettings.json")
	ErrMetdataNotLoaded    = errors.New("metadata not loaded")
)

type Meta struct {
	X     int
	Y     int
	Level string
}

type Region struct {
	Meta
	Size int
	File string
	Data []uint16
}

type MapSettings struct {
	CellResolution int `json:"cellResolution"`
	RegionSize     int `json:"regionSize"`
	RegionType     int `json:"regionType"`
}

func LoadRegion(file nwfs.File) (region Region, err error) {
	settingsFile, ok := file.Archive().Lookup(path.Join(path.Dir(file.Path()), "mapsettings.json"))
	if !ok {
		err = ErrMapSettingsNotFound
		return
	}
	settingsData, err := settingsFile.Read()
	if err != nil {
		return
	}
	var settings MapSettings
	err = json.Unmarshal(settingsData, &settings)
	if err != nil {
		return
	}
	region.Size = settings.RegionSize
	region.Meta, ok = ReadPathMetadata(file.Path())
	if !ok {
		err = ErrMetdataNotLoaded
		return
	}

	region.File = file.Path()
	region.Data, err = Load(file)
	if err != nil {
		return
	}
	expectedSize := region.Size * region.Size
	if len(region.Data) != expectedSize {
		slog.Warn("heightmap data size mismatch", "expected", expectedSize, "actual", len(region.Data), "size", region.Size, "file", file.Path())
	}
	return
}

func Load(file nwfs.File) ([]uint16, error) {
	data, err := file.Read()
	if err != nil {
		return nil, err
	}
	return LoadFromTiff(data)
}

func LoadImage(file nwfs.File) (image.Image, error) {
	data, err := file.Read()
	if err != nil {
		return nil, err
	}
	hm, err := ParseTIFF(data)
	if err != nil {
		return nil, err
	}
	return hm.Image(), nil
}

func LoadFromTiff(data []byte) ([]uint16, error) {
	r, err := ParseTIFF(data)
	if err != nil {
		return nil, err
	}
	return r.Samples, nil
}

var metaRegexp = regexp.MustCompile(`/([^/]+)/regions/r_\+(\d{2})_\+(\d{2}).*`)

func ReadPathMetadata(filePath string) (out Meta, ok bool) {
	match := metaRegexp.FindStringSubmatch(filePath)
	if len(match) != 4 {
		return out, false
	}
	x, _ := strconv.Atoi(match[2])
	y, _ := strconv.Atoi(match[3])
	out.Level = match[1]
	out.X = x
	out.Y = y
	return out, true
}

// ToUint16Bytes returns the heightmap as little-endian uint16 bytes, ready to upload
// as an r16unorm texture (2*Size*Size bytes). Not float16: it can not hold the samples
// exactly (0.5 m steps above a quarter of the mountain height).
func (r *Region) ToUint16Bytes() []byte {
	out := make([]byte, len(r.Data)*2)
	for i, bits := range r.Data {
		binary.LittleEndian.PutUint16(out[i*2:], bits)
	}
	return out
}
