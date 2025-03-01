package heightmap

import (
	"bytes"
	"encoding/json"
	"errors"
	"log/slog"
	"nw-buddy/tools/nwfs"
	"path"
	"regexp"
	"strconv"

	"github.com/Andeling/tiff"
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
	Data []float32
}

type MapSettings struct {
	CellResolution int `json:"cellResolution"`
	RegionSize     int `json:"regionSize"`
	RegionType     int `json:"regionType"`
}

func Load(file nwfs.File) (region Region, err error) {
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
	data, err := file.Read()
	if err != nil {
		return
	}
	region.File = file.Path()
	region.Data, err = ParseHeightField(data)
	expectedSize := region.Size * region.Size
	if len(region.Data) != expectedSize {
		slog.Warn("heightmap data size mismatch", "expected", expectedSize, "actual", len(region.Data), "size", region.Size, "file", file.Path())
	}
	return
}

func ParseHeightField(data []byte) ([]float32, error) {
	r := bytes.NewReader(data)

	d, err := tiff.NewDecoder(r)
	if err != nil {
		return nil, err
	}
	iter := d.Iter()
	for iter.Next() {
		img := iter.Image()
		width, height := img.WidthHeight()
		switch img.DataType() {
		case tiff.Uint16:
			buf := make([]uint16, width*height)
			if err := img.DecodeImage(buf); err != nil {
				return nil, err
			}

			out := make([]float32, len(buf))
			for i, v := range buf {
				out[i] = float32(v) / float32(65535)
			}
			return out, nil
		}
	}
	return nil, errors.New("no image found")
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
