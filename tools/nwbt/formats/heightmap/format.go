package heightmap

import (
	"encoding/binary"
	"encoding/json"
	"errors"
	"fmt"
	"image/png"
	"log/slog"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/env"
	"os"
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

// --- TIFF Constants (subset needed for grayscale forcing) ---
const (
	// File structure
	leHeader = "II"
	beHeader = "MM"
	ifdLen   = 12 // Length of an IFD entry

	// TIFF Tag IDs
	tPhotometricInterpretation = 262
	tSamplesPerPixel           = 277

	// TIFF Data Types (Field Types)
	fieldTypeShort = 3 // uint16

	// PhotometricInterpretation Values
	pRGB         = 2
	pBlackIsZero = 1
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
	f, err := os.CreateTemp(env.TempDir(), "*")
	if err != nil {
		return nil, err
	}
	defer f.Close()
	_, err = f.Write(data)
	if err != nil {
		return nil, err
	}
	f.Close()

	tiffNam := f.Name()
	pngName := f.Name() + ".png"
	defer os.Remove(tiffNam)
	defer os.Remove(pngName)

	cmd := utils.Magick.Convert(f.Name(), f.Name()+".png")
	err = cmd.Run()
	if err != nil {
		return nil, err
	}

	pngFile, err := os.Open(pngName)
	if err != nil {
		return nil, err
	}
	defer pngFile.Close()
	img, err := png.Decode(pngFile)
	if err != nil {
		return nil, err
	}

	sizeX := img.Bounds().Size().X
	sizeY := img.Bounds().Size().Y
	out := make([]float32, sizeX*sizeY)
	index := 0
	for y := range sizeY {
		for x := range sizeX {
			r, _, _, _ := img.At(x, y).RGBA()
			out[index] = float32(r)
			index++
		}
	}

	return out, nil
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

// --- TIFF In-place Modification Logic ---

// findTagOffset locates an IFD entry by tag ID and returns the offset
// of its value/offset field and the field type/count.
// Returns -1 offset if not found.
// IMPORTANT: Assumes tiffData is mutable if modification is intended later.
func findTagOffset(tiffData []byte, targetTagID uint16) (valueOffset int64, fieldType, count uint32, byteOrder binary.ByteOrder, err error) {
	if len(tiffData) < 8 {
		err = errors.New("tiff data too short for header")
		return
	}

	switch string(tiffData[0:2]) { // Only check first 2 bytes for byte order marker
	case leHeader:
		byteOrder = binary.LittleEndian
	case beHeader:
		byteOrder = binary.BigEndian
	default:
		err = errors.New("malformed or unsupported header byte order marker")
		return
	}
	// Check for magic bytes 0x2A00 or 0x002A
	if !(byteOrder == binary.LittleEndian && tiffData[2] == 0x2A && tiffData[3] == 0x00) &&
		!(byteOrder == binary.BigEndian && tiffData[2] == 0x00 && tiffData[3] == 0x2A) {
		err = errors.New("invalid TIFF magic bytes")
		return
	}

	ifdOffset := int64(byteOrder.Uint32(tiffData[4:8]))

	if ifdOffset <= 0 || ifdOffset+2 > int64(len(tiffData)) { // Offset must be positive
		err = fmt.Errorf("invalid IFD offset %d", ifdOffset)
		return
	}

	numEntriesUint16 := byteOrder.Uint16(tiffData[ifdOffset : ifdOffset+2])
	numEntries := int(numEntriesUint16) // Convert to int for range loop
	ifdStart := ifdOffset + 2
	ifdEnd := ifdStart + int64(numEntries)*int64(ifdLen)

	// Basic check to prevent overflow and ensure IFD fits within data
	if int64(numEntries)*int64(ifdLen) < 0 || ifdEnd > int64(len(tiffData)) {
		err = fmt.Errorf("invalid IFD structure: numEntries=%d, calculated end=%d, dataLen=%d", numEntries, ifdEnd, len(tiffData))
		return
	}

	for i := 0; i < numEntries; i++ { // Use standard int loop
		entryOffset := ifdStart + int64(i)*int64(ifdLen)
		// Bounds check before slicing
		if entryOffset+ifdLen > int64(len(tiffData)) {
			err = fmt.Errorf("IFD entry %d extends beyond data length", i)
			valueOffset = -1 // Ensure valueOffset is -1 on error exit
			return
		}
		tagID := byteOrder.Uint16(tiffData[entryOffset : entryOffset+2])
		if tagID == targetTagID {
			fieldType = uint32(byteOrder.Uint16(tiffData[entryOffset+2 : entryOffset+4]))
			count = byteOrder.Uint32(tiffData[entryOffset+4 : entryOffset+8])
			valueOffset = entryOffset + 8 // Offset of the value/offset field itself
			return                        // Found the tag
		}
	}

	// Tag not found
	valueOffset = -1
	err = fmt.Errorf("tag %d not found", targetTagID)
	return
}

// readInlineShortTagValue reads the value of an inline SHORT (Type=3, Count=1) tag.
func readInlineShortTagValue(tiffData []byte, tagID uint16) (value uint16, err error) {
	valueOffset, fieldType, count, byteOrder, findErr := findTagOffset(tiffData, tagID)
	if findErr != nil {
		return 0, fmt.Errorf("failed finding tag %d: %w", tagID, findErr)
	}
	// valueOffset check removed as findTagOffset returns error if not found
	if fieldType != fieldTypeShort || count != 1 {
		return 0, fmt.Errorf("tag %d is not an inline SHORT (Type=%d, Count=%d)", tagID, fieldType, count)
	}
	if valueOffset+2 > int64(len(tiffData)) { // Bounds check for reading value
		return 0, fmt.Errorf("tag %d value offset out of bounds for read", tagID)
	}
	// Read the first 2 bytes of the 4-byte value/offset field for inline SHORT
	value = byteOrder.Uint16(tiffData[valueOffset : valueOffset+2])
	return value, nil
}

// modifyInlineShortTagValue modifies the value of an inline SHORT tag *in-place*.
func modifyInlineShortTagValue(tiffData []byte, tagID uint16, newValue uint16) error {
	valueOffset, fieldType, count, byteOrder, err := findTagOffset(tiffData, tagID)
	if err != nil {
		return fmt.Errorf("failed to find tag %d offset for modification: %w", tagID, err)
	}
	// valueOffset check removed as findTagOffset returns error if not found
	if fieldType != fieldTypeShort || count != 1 {
		return fmt.Errorf("tag %d is not an inline SHORT (Type=%d, Count=%d), cannot modify", tagID, fieldType, count)
	}
	if valueOffset+2 > int64(len(tiffData)) { // Bounds check for writing value
		return fmt.Errorf("tag %d value offset out of bounds for write", tagID)
	}

	// Modify the inline value (first 2 bytes of the 4-byte value/offset field) *in-place*
	byteOrder.PutUint16(tiffData[valueOffset:valueOffset+2], newValue)
	return nil
}

// ForceGrayscaleIfRGBSPP1 checks if the TIFF data has PhotometricInterpretation=RGB
// and SamplesPerPixel=1. If so, it modifies the data *in-place* changing
// PhotometricInterpretation to BlackIsZero and returns true.
// Otherwise, it returns false. Errors during tag checking are returned.
func ForceGrayscaleIfRGBSPP1(tiffData []byte) (wasModified bool, err error) {
	// Check PhotoInterp
	photoInterpVal, findErr := readInlineShortTagValue(tiffData, tPhotometricInterpretation)
	if findErr != nil {
		// Check if the error message indicates "tag not found" or "not an inline SHORT".
		errMsg := findErr.Error()
		// Use regexp.QuoteMeta if tag IDs could contain special regex characters, but they are simple numbers here.
		if regexp.MustCompile(fmt.Sprintf(`tag %d not found|not an inline SHORT`, tPhotometricInterpretation)).MatchString(errMsg) {
			return false, nil // Not the specific RGB/SPP1 case we target, no modification needed.
		}
		// Other errors during reading are problematic.
		return false, fmt.Errorf("could not read PhotometricInterpretation tag: %w", findErr)
	}

	// Check SamplesPerPixel
	sppVal, findErr := readInlineShortTagValue(tiffData, tSamplesPerPixel)
	if findErr != nil {
		// Similar handling as above for SamplesPerPixel tag.
		errMsg := findErr.Error()
		if regexp.MustCompile(fmt.Sprintf(`tag %d not found|not an inline SHORT`, tSamplesPerPixel)).MatchString(errMsg) {
			return false, nil // Not the specific RGB/SPP1 case, no modification needed.
		}
		return false, fmt.Errorf("could not read SamplesPerPixel tag: %w", findErr)
	}

	// Apply modification if criteria met
	if photoInterpVal == pRGB && sppVal == 1 {
		modifyErr := modifyInlineShortTagValue(tiffData, tPhotometricInterpretation, pBlackIsZero)
		if modifyErr != nil {
			// Should not happen if read succeeded, but handle defensively
			return false, fmt.Errorf("failed to modify PhotometricInterpretation tag after check: %w", modifyErr)
		}
		return true, nil // Modified in-place
	}

	// Criteria not met, no modification needed
	return false, nil
}
