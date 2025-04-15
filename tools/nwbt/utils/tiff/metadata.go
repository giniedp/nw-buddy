package tiff

import (
	"encoding/binary"
	"fmt"
	"image"
	"image/color"
	"io"
	"log/slog"
	"math"
	"sort"
	"strings"
	"sync"
)

// --- Logger Setup ---

// discardLogger is used when no logger is provided to public functions.
var discardLogger = slog.New(slog.NewTextHandler(io.Discard, nil))

// getLogger returns the provided logger or a discard logger if nil.
func getLogger(l *slog.Logger) *slog.Logger {
	if l == nil {
		return discardLogger
	}
	return l
}

// --- Error Types ---
type FormatError string
func (e FormatError) Error() string { return "tiff: invalid format: " + string(e) }
type UnsupportedError string
func (e UnsupportedError) Error() string { return "tiff: unsupported feature: " + string(e) }


// --- Constants ---
const (
	// Header constants
	leHeader = "II\x2A\x00"
	beHeader = "MM\x00\x2A"
	ifdLen   = 12 // Length of an IFD entry
	maxChunkSize = 10 << 20 // 10M (Buffer size limit)

	// Data Type constants
	dtByte      = 1
	dtASCII     = 2
	dtShort     = 3
	dtLong      = 4
	dtRational  = 5
	dtSByte     = 6
	dtUndefined = 7
	dtSShort    = 8
	dtSLong     = 9
	dtSRational = 10
	dtFloat     = 11
	dtDouble    = 12

// TIFF Tag IDs
	tNewSubfileType          = 254
	tSubfileType             = 255
	tImageWidth              = 256
	tImageLength             = 257
	tBitsPerSample           = 258
	tCompression             = 259
	tPhotometricInterpretation = 262
	tThreshholding           = 263
	tCellWidth               = 264
	tCellLength              = 265
	tFillOrder               = 266
	tDocumentName            = 269
	tImageDescription        = 270
	tMake                    = 271
	tModel                   = 272
	tStripOffsets            = 273
	tOrientation             = 274
	tSamplesPerPixel         = 277
	tRowsPerStrip            = 278
	tStripByteCounts         = 279
	tMinSampleValue          = 280
	tMaxSampleValue          = 281
	tXResolution             = 282
	tYResolution             = 283
	tPlanarConfiguration     = 284
	tPageName                = 285
	tXPosition               = 286
	tYPosition               = 287
	tFreeOffsets             = 288
	tFreeByteCounts          = 289
	tGrayResponseUnit        = 290
	tGrayResponseCurve       = 291
	tT4Options               = 292
	tT6Options               = 293
	tResolutionUnit          = 296
	tPageNumber              = 297
	tTransferFunction        = 301
	tSoftware                = 305
	tDateTime                = 306
	tArtist                  = 315
	tHostComputer            = 316
	tPredictor               = 317
	tWhitePoint              = 318
	tPrimaryChromaticities = 319
	tColorMap                = 320
	tHalftoneHints           = 321
	tTileWidth               = 322
	tTileLength              = 323
	tTileOffsets             = 324
	tTileByteCounts          = 325
	tInkSet                  = 332
	tInkNames                = 333
	tNumberOfInks            = 334
	tDotRange                = 336
	tTargetPrinter           = 337
	tExtraSamples            = 338
	tSampleFormat            = 339
	tSMinSampleValue         = 340
	tSMaxSampleValue         = 341
	tTransferRange           = 342
	tJPEGProc                    = 512
	tJPEGInterchangeFormat       = 513
	tJPEGInterchangeFormatLength = 514
	tJPEGRestartInterval         = 515
	tJPEGLosslessPredictors      = 517
	tJPEGPointTransforms         = 518
	tJPEGQTables                 = 519
	tJPEGDCTables                = 520
	tJPEGACTables                = 521
	tYCbCrCoefficients       = 529
	tYCbCrSubSampling        = 530
	tYCbCrPositioning        = 531
	tReferenceBlackWhite     = 532
	tCopyright               = 33432
)


// --- Enums ---
type Compression uint16
const (
	CompNone Compression = 1
	CompCCITT1D Compression = 2
	CompGroup3Fax Compression = 3
	CompGroup4Fax Compression = 4
	CompLZW Compression = 5
	CompJPEGOld Compression = 6
	CompJPEG Compression = 7
	CompDeflateAdobe Compression = 8
	CompPackBits Compression = 32773
	CompDeflate Compression = 32946
)
func (c Compression) String() string {
	switch c {
	case CompNone: return "Uncompressed (1)"
	case CompCCITT1D: return "CCITT RLE (2)"
	case CompGroup3Fax: return "CCITT Group 3 (3)"
	case CompGroup4Fax: return "CCITT Group 4 (4)"
	case CompLZW: return "LZW (5)"
	case CompJPEGOld: return "Old JPEG (6)"
	case CompJPEG: return "JPEG (7)"
	case CompDeflateAdobe: return "Adobe Deflate (8)"
	case CompPackBits: return "PackBits (32773)"
	case CompDeflate: return "Deflate/Zlib (32946)"
	default: return fmt.Sprintf("Unknown (%d)", c)
	}
}

type PhotometricInterpretation uint16
const (
	PhotoWhiteIsZero    PhotometricInterpretation = 0
	PhotoBlackIsZero    PhotometricInterpretation = 1
	PhotoRGB            PhotometricInterpretation = 2
	PhotoPalette        PhotometricInterpretation = 3
	PhotoTransparencyMask PhotometricInterpretation = 4
	PhotoCMYK           PhotometricInterpretation = 5
	PhotoYCbCr          PhotometricInterpretation = 6
	PhotoCIELab         PhotometricInterpretation = 8
)
func (p PhotometricInterpretation) String() string {
	switch p {
	case PhotoWhiteIsZero: return "WhiteIsZero (0)"
	case PhotoBlackIsZero: return "BlackIsZero (1)"
	case PhotoRGB: return "RGB (2)"
	case PhotoPalette: return "Palette (3)"
	case PhotoTransparencyMask: return "Transparency Mask (4)"
	case PhotoCMYK: return "CMYK (5)"
	case PhotoYCbCr: return "YCbCr (6)"
	case PhotoCIELab: return "CIELab (8)"
	default: return fmt.Sprintf("Unknown (%d)", p)
	}
}

type Predictor uint16
const (
	PredNone       Predictor = 1
	PredHorizontal Predictor = 2
	PredFloating   Predictor = 3
)
func (p Predictor) String() string {
	switch p {
	case PredNone: return "None (1)"
	case PredHorizontal: return "Horizontal (2)"
	case PredFloating: return "Floating Point (3)"
	default: return fmt.Sprintf("Unknown (%d)", p)
	}
}

type SampleFormat uint16
const (
	SampleFormatUInt    SampleFormat = 1
	SampleFormatInt     SampleFormat = 2
	SampleFormatIEEEFP  SampleFormat = 3
	SampleFormatVoid    SampleFormat = 4
	SampleFormatComplexInt SampleFormat = 5
	SampleFormatComplexIEEEFP SampleFormat = 6
)
func (sf SampleFormat) String() string {
	switch sf {
	case SampleFormatUInt: return "Unsigned Integer (1)"
	case SampleFormatInt: return "Signed Integer (2)"
	case SampleFormatIEEEFP: return "IEEE Floating Point (3)"
	case SampleFormatVoid: return "Void/Undefined (4)"
	case SampleFormatComplexInt: return "Complex Integer (5)"
	case SampleFormatComplexIEEEFP: return "Complex Float (6)"
	default: return fmt.Sprintf("Unknown (%d)", sf)
	}
}

type PlanarConfiguration uint16
const (
	PlanarChunky PlanarConfiguration = 1
	PlanarPlanar PlanarConfiguration = 2
)
func (pc PlanarConfiguration) String() string {
	switch pc {
	case PlanarChunky: return "Chunky (1)"
	case PlanarPlanar: return "Planar (2)"
	default: return fmt.Sprintf("Unknown (%d)", pc)
	}
}

type ResolutionUnit uint16
const (
	ResUnitNone       ResolutionUnit = 1
	ResUnitInch       ResolutionUnit = 2
	ResUnitCentimeter ResolutionUnit = 3
)
func (ru ResolutionUnit) String() string {
	switch ru {
	case ResUnitNone: return "None (1)"
	case ResUnitInch: return "Inch (2)"
	case ResUnitCentimeter: return "Centimeter (3)"
	default: return fmt.Sprintf("Unknown (%d)", ru)
	}
}

type Orientation uint16
const (
	OrientTopLeft     Orientation = 1
	OrientTopRight    Orientation = 2
	OrientBottomRight Orientation = 3
	OrientBottomLeft  Orientation = 4
	OrientLeftTop     Orientation = 5
	OrientRightTop    Orientation = 6
	OrientRightBottom Orientation = 7
	OrientLeftBottom  Orientation = 8
)
func (o Orientation) String() string {
	switch o {
	case OrientTopLeft: return "TopLeft (1)"
	case OrientTopRight: return "TopRight (2)"
	case OrientBottomRight: return "BottomRight (3)"
	case OrientBottomLeft: return "BottomLeft (4)"
	case OrientLeftTop: return "LeftTop (5)"
	case OrientRightTop: return "RightTop (6)"
	case OrientRightBottom: return "RightBottom (7)"
	case OrientLeftBottom: return "LeftBottom (8)"
	default: return fmt.Sprintf("Unknown (%d)", o)
	}
}


// --- Buffer Pool ---
var bufPoolMaxChunkSize = sync.Pool{
	New: func() any {
		b := make([]byte, maxChunkSize)
		return &b
	},
}


// --- Metadata Struct ---
type Metadata struct {
	ImageWidth              uint32
	ImageLength             uint32
	BitsPerSample           []uint16
	Compression             Compression
	PhotometricInterpretation PhotometricInterpretation
	StripOffsets            []uint32
	RowsPerStrip            uint32
	StripByteCounts         []uint32
	XResolution             [2]uint32
	YResolution             [2]uint32
	ResolutionUnit          ResolutionUnit
	SamplesPerPixel         uint16
	SampleFormat            []SampleFormat
	PlanarConfiguration     PlanarConfiguration
	Orientation             Orientation
	Predictor               Predictor
	ColorMap                [][3]uint16
	TileWidth               uint32
	TileLength              uint32
	TileOffsets             []uint32
	TileByteCounts          []uint32
	NewSubfileType          uint32
	SubfileType             uint16
	FillOrder               uint16
	MinSampleValue          []uint16
	MaxSampleValue          []uint16
	Threshholding           uint16
	CellWidth               uint16
	CellLength              uint16
	FreeOffsets             []uint32
	FreeByteCounts          []uint32
	GrayResponseUnit        uint16
	GrayResponseCurve       []uint16
	TransferFunction        []uint16
	WhitePoint              [2][2]uint32
	PrimaryChromaticities [6][2]uint32
	HalftoneHints           [2]uint16
	ExtraSamples            []uint16
	SMinSampleValue         []float64
	SMaxSampleValue         []float64
	TransferRange           [6]uint16
	DocumentName            string
	ImageDescription        string
	Make                    string
	Model                   string
	PageName                string
	Software                string
	DateTime                string
	Artist                  string
	HostComputer            string
	TargetPrinter           string
	Copyright               string
	InkNames                string
	PageNumber              [2]uint16
	XPosition               [2]uint32
	YPosition               [2]uint32
	T4Options               uint32
	T6Options               uint32
	InkSet                  uint16
	NumberOfInks            uint16
	DotRange                []uint16
	YCbCrCoefficients       [3][2]uint32
	YCbCrSubSampling        [2]uint16
	YCbCrPositioning        uint16
	ReferenceBlackWhite     [][2]uint32
	JPEGProc                    uint16
	JPEGInterchangeFormat       uint32
	JPEGInterchangeFormatLength uint32
	JPEGRestartInterval         uint16
	JPEGLosslessPredictors      []uint16
	JPEGPointTransforms         []uint16
	JPEGQTables                 []uint32
	JPEGDCTables                []uint32
	JPEGACTables                []uint32
	UnknownTags map[int]map[string]any
}

func (m *Metadata) String() string {
	if m == nil { return "<nil Metadata>" }
	var sb strings.Builder
	sb.WriteString("--- TIFF Metadata ---\n")
	sb.WriteString(fmt.Sprintf("  ImageWidth: %d\n", m.ImageWidth))
	sb.WriteString(fmt.Sprintf("  ImageLength: %d\n", m.ImageLength))
	sb.WriteString(fmt.Sprintf("  BitsPerSample: %v\n", m.BitsPerSample))
	sb.WriteString(fmt.Sprintf("  Compression: %s\n", m.Compression))
	sb.WriteString(fmt.Sprintf("  PhotometricInterpretation: %s\n", m.PhotometricInterpretation))
	sb.WriteString(fmt.Sprintf("  SamplesPerPixel: %d\n", m.SamplesPerPixel))
	if m.TileWidth > 0 {
		sb.WriteString(fmt.Sprintf("  TileWidth: %d\n", m.TileWidth))
		sb.WriteString(fmt.Sprintf("  TileLength: %d\n", m.TileLength))
		sb.WriteString(fmt.Sprintf("  TileOffsets: Count=%d\n", len(m.TileOffsets)))
		sb.WriteString(fmt.Sprintf("  TileByteCounts: Count=%d\n", len(m.TileByteCounts)))
	} else {
	sb.WriteString(fmt.Sprintf("  StripOffsets: Count=%d\n", len(m.StripOffsets)))
	sb.WriteString(fmt.Sprintf("  RowsPerStrip: %d\n", m.RowsPerStrip))
	sb.WriteString(fmt.Sprintf("  StripByteCounts: Count=%d\n", len(m.StripByteCounts)))
	}
	sfStrings := make([]string, len(m.SampleFormat))
	for i, sf := range m.SampleFormat {
		sfStrings[i] = sf.String()
	}
	sb.WriteString(fmt.Sprintf("  SampleFormat: [%s]\n", strings.Join(sfStrings, ", ")))
	sb.WriteString(fmt.Sprintf("  PlanarConfiguration: %s\n", m.PlanarConfiguration))
	sb.WriteString(fmt.Sprintf("  Orientation: %s\n", m.Orientation))
	sb.WriteString(fmt.Sprintf("  Predictor: %s\n", m.Predictor))
	sb.WriteString(fmt.Sprintf("  XResolution: %d/%d\n", m.XResolution[0], m.XResolution[1]))
	sb.WriteString(fmt.Sprintf("  YResolution: %d/%d\n", m.YResolution[0], m.YResolution[1]))
	sb.WriteString(fmt.Sprintf("  ResolutionUnit: %s\n", m.ResolutionUnit))
	if m.Software != "" { sb.WriteString(fmt.Sprintf("  Software: %q\n", m.Software)) }
	if m.DateTime != "" { sb.WriteString(fmt.Sprintf("  DateTime: %q\n", m.DateTime)) }
	if m.Artist != "" { sb.WriteString(fmt.Sprintf("  Artist: %q\n", m.Artist)) }
	if m.HostComputer != "" { sb.WriteString(fmt.Sprintf("  HostComputer: %q\n", m.HostComputer)) }
	if m.Copyright != "" { sb.WriteString(fmt.Sprintf("  Copyright: %q\n", m.Copyright)) }
	if m.ImageDescription != "" { sb.WriteString(fmt.Sprintf("  ImageDescription: %q\n", m.ImageDescription)) }
	if m.Make != "" { sb.WriteString(fmt.Sprintf("  Make: %q\n", m.Make)) }
	if m.Model != "" { sb.WriteString(fmt.Sprintf("  Model: %q\n", m.Model)) }
	if m.DocumentName != "" { sb.WriteString(fmt.Sprintf("  DocumentName: %q\n", m.DocumentName)) }
	if m.PageName != "" { sb.WriteString(fmt.Sprintf("  PageName: %q\n", m.PageName)) }
	if m.PageNumber[0] != 0 || m.PageNumber[1] != 0 { sb.WriteString(fmt.Sprintf("  PageNumber: %d of %d\n", m.PageNumber[0], m.PageNumber[1])) }
	if len(m.ColorMap) > 0 { sb.WriteString(fmt.Sprintf("  ColorMap: Present (%d entries)\n", len(m.ColorMap))) }
	if len(m.UnknownTags) > 0 {
		sb.WriteString("  Unknown/Error Tags:\n")
		tagIDs := make([]int, 0, len(m.UnknownTags))
		for id := range m.UnknownTags { tagIDs = append(tagIDs, id) }
		sort.Ints(tagIDs)
		for _, id := range tagIDs {
			info := m.UnknownTags[id]
			typeName := "Unknown"
			if tid, ok := info["TypeID"].(uint16); ok { typeName = dataTypeString(tid) }
			sb.WriteString(fmt.Sprintf("    Tag %d: Type=%s (%d), Count=%d, Value=%v\n",
				id, typeName, info["TypeID"], info["Count"], info["Value"]))
			if parseErr, ok := info["ParseError"]; ok {
				sb.WriteString(fmt.Sprintf("      Parse Error: %v\n", parseErr))
			}
		}
	}
	sb.WriteString("--- End TIFF Metadata ---")
	return sb.String()
}


// --- Public Functions ---

// ReadMetadata reads the first IFD, parses tags, validates, and returns Metadata + image.Config.
// Accepts an optional slog.Logger; if nil, logs are discarded.
func ReadMetadata(readerAt io.ReaderAt, byteOrder binary.ByteOrder, ifdOffset int64, logger *slog.Logger) (md *Metadata, cfg image.Config, err error) {
	log := getLogger(logger)
	log.Debug("Entering ReadMetadata", slog.Int64("ifdOffset", ifdOffset))
	md = &Metadata{UnknownTags: make(map[int]map[string]any)}
	var numEntries uint16
	p := make([]byte, 2)
	if _, readErr := readerAt.ReadAt(p, ifdOffset); readErr != nil {
		if readErr == io.EOF { readErr = io.ErrUnexpectedEOF }
		err = FormatError(fmt.Sprintf("failed to read IFD entry count: %v", readErr))
		log.Error("Failed to read IFD entry count", slog.Int64("ifdOffset", ifdOffset), slog.Any("error", err))
		return md, cfg, err
	}
	numEntries = byteOrder.Uint16(p[0:2])
	log.Debug("ReadMetadata: Found IFD entries", slog.Int("count", int(numEntries)))
	if numEntries > 500 {
		err = FormatError("too many IFD entries")
		log.Warn("Too many IFD entries", slog.Int("count", int(numEntries)))
		return md, cfg, err
	}
	ifdLenTotal := uint64(ifdLen) * uint64(numEntries)
	if ifdLenTotal == 0 {
		err = FormatError("no IFD entries")
		log.Warn("IFD contains no entries")
		return md, cfg, err
	}
	ifdBuf, readErr := safeReadAt(readerAt, ifdLenTotal, ifdOffset+2, log)
	if readErr != nil {
		err = FormatError(fmt.Sprintf("failed to read IFD entries: %v", readErr))
		log.Error("Failed to read IFD entries block", slog.Int64("ifdOffset", ifdOffset+2), slog.Uint64("length", ifdLenTotal), slog.Any("error", err))
		return md, cfg, err
	}
	prevTag := -1
	var firstParseErr error
	for i := range int(numEntries) {
		entryData := ifdBuf[i*ifdLen : (i+1)*ifdLen]
		tagID := int(byteOrder.Uint16(entryData[0:2]))
		if parseErr := parseIFDEntry(md, entryData, byteOrder, readerAt, log); parseErr != nil {
			log.Warn("Error parsing IFD entry", slog.Int("tagID", tagID), slog.Any("error", parseErr))
			if firstParseErr == nil { firstParseErr = parseErr }
		}
		if tagID <= prevTag && tagID != 0 {
			err = FormatError("IFD tags are not sorted")
			log.Warn("IFD tags out of order", slog.Int("previousTag", prevTag), slog.Int("currentTag", tagID))
			// Keep parsing but return error later
		}
		if tagID != 0 { prevTag = tagID }
	}

	log.Debug("ReadMetadata: Applying default values")
	// Apply Default Values
	if md.SamplesPerPixel == 0 { md.SamplesPerPixel = 1 }
	if md.PlanarConfiguration == 0 { md.PlanarConfiguration = PlanarChunky }
	if md.ResolutionUnit == 0 { md.ResolutionUnit = ResUnitInch }
	if md.Predictor == 0 { md.Predictor = PredNone }
	if md.Orientation == 0 { md.Orientation = OrientTopLeft }
    if md.FillOrder == 0 { md.FillOrder = 1 }
    if md.Threshholding == 0 { md.Threshholding = 1 }
	if md.InkSet == 0 { md.InkSet = 1 }
	if md.NumberOfInks == 0 { md.NumberOfInks = 4 }
	if md.YCbCrPositioning == 0 { md.YCbCrPositioning = 1 }
	if md.GrayResponseUnit == 0 { md.GrayResponseUnit = 2 }

	if firstParseErr != nil {
		if _, ok := firstParseErr.(UnsupportedError); ok {
			err = firstParseErr
		} else {
			err = FormatError(fmt.Sprintf("failed to parse IFD entry: %v", firstParseErr))
		}
		log.Warn("Exiting ReadMetadata due to first IFD parse error", slog.Any("error", err))
		return md, cfg, err
	}
	if err != nil { // Handle tag sorting error discovered during loop
		log.Warn("Exiting ReadMetadata due to IFD tag sorting error", slog.Any("error", err))
		return md, cfg, err
	}

	log.Debug("ReadMetadata: Starting metadata validation")
	cfg, err = validateMetadataAndSetConfig(md, log)
	if err != nil {
		log.Warn("Metadata validation failed", slog.Any("error", err))
		return md, cfg, err
	}

	log.Debug("Exiting ReadMetadata successfully")
	return md, cfg, nil
}

// HasMultipleImages checks if the TIFF file contains more than one image (IFD).
// Accepts an optional slog.Logger; if nil, logs are discarded.
func HasMultipleImages(r io.Reader, logger *slog.Logger) (bool, error) {
	log := getLogger(logger)
	log.Debug("Entering HasMultipleImages")
	readerAt, ok := r.(io.ReaderAt)
	if !ok {
		err := fmt.Errorf("tiff: reader must implement io.ReaderAt for HasMultipleImages check")
		log.Error("Reader does not implement io.ReaderAt", slog.Any("error", err))
		return false, err
	}

	p := make([]byte, 8)
	if _, err := readerAt.ReadAt(p, 0); err != nil {
		if err == io.EOF { err = io.ErrUnexpectedEOF }
		errWrap := fmt.Errorf("failed to read header for multi-image check: %w", err)
		log.Error("Failed to read header", slog.Any("error", errWrap))
		return false, errWrap
	}

	var byteOrder binary.ByteOrder
	switch string(p[0:4]) {
	case leHeader: byteOrder = binary.LittleEndian
	case beHeader: byteOrder = binary.BigEndian
	default:
		err := FormatError("malformed header for multi-image check")
		log.Warn("Malformed header found", slog.String("headerBytes", string(p[0:4])))
		return false, err
	}
	firstIFDOffset := int64(byteOrder.Uint32(p[4:8]))
	if firstIFDOffset == 0 {
		log.Debug("First IFD offset is 0, assuming single image")
		return false, nil
	}

	p = p[:2]
	if _, err := readerAt.ReadAt(p, firstIFDOffset); err != nil {
		if err == io.EOF { err = io.ErrUnexpectedEOF }
		errWrap := FormatError(fmt.Sprintf("failed to read first IFD entry count: %v", err))
		log.Error("Failed to read first IFD entry count", slog.Int64("ifdOffset", firstIFDOffset), slog.Any("error", errWrap))
		return false, errWrap
	}
	numEntries := byteOrder.Uint16(p[0:2])

	nextIFDOffsetPos := firstIFDOffset + 2 + int64(numEntries)*int64(ifdLen)

	p = p[:4]
	if _, err := readerAt.ReadAt(p, nextIFDOffsetPos); err != nil {
		if err == io.ErrUnexpectedEOF || err == io.EOF {
			log.Debug("No next IFD offset found (EOF/UnexpectedEOF), assuming single image")
			return false, nil
		}
		errWrap := FormatError(fmt.Sprintf("failed to read next IFD offset pointer: %v", err))
		log.Error("Failed to read next IFD offset pointer", slog.Int64("pointerPos", nextIFDOffsetPos), slog.Any("error", errWrap))
		return false, errWrap
	}
	nextIFDOffset := byteOrder.Uint32(p[0:4])

	result := nextIFDOffset != 0
	log.Debug("Exiting HasMultipleImages", slog.Bool("hasMultiple", result))
	return result, nil
}


// --- Internal Helper Functions ---

func validateMetadataAndSetConfig(md *Metadata, logger *slog.Logger) (image.Config, error) {
	// Perform nil check *before* accessing md fields
	if md == nil { return image.Config{}, FormatError("internal error: metadata nil before validation") }

	log := getLogger(logger)
	log.Debug("Entering validateMetadataAndSetConfig", slog.Int("SamplesPerPixel", int(md.SamplesPerPixel)), slog.String("PhotometricInterpretation", md.PhotometricInterpretation.String()))
	cfg := image.Config{}
	if md.ImageWidth == 0 || md.ImageLength == 0 { return cfg, FormatError(fmt.Sprintf("missing required tag: ImageWidth (%d) or ImageLength (%d)", md.ImageWidth, md.ImageLength)) }
	if len(md.BitsPerSample) == 0 { return cfg, FormatError("missing required tag: BitsPerSample") }
	if md.Compression == 0 { return cfg, FormatError("missing or invalid required tag: Compression") }
	if md.SamplesPerPixel == 0 { md.SamplesPerPixel = 1 }

	cfg.Width = int(md.ImageWidth)
	cfg.Height = int(md.ImageLength)

	if md.Compression != CompNone && md.Compression != CompLZW && md.Compression != CompPackBits {
		return cfg, UnsupportedError(fmt.Sprintf("unsupported Compression: %s", md.Compression))
	}

	spp := int(md.SamplesPerPixel)
	if len(md.SampleFormat) == 0 {
		md.SampleFormat = make([]SampleFormat, spp)
		for i := range spp { md.SampleFormat[i] = SampleFormatUInt }
	} else if len(md.SampleFormat) != spp {
		return cfg, FormatError(fmt.Sprintf("SampleFormat count (%d) != SamplesPerPixel (%d)", len(md.SampleFormat), spp))
	}

	for i, sf := range md.SampleFormat {
		bps := md.BitsPerSample[i]
		switch sf {
		case SampleFormatUInt:
			if bps != 8 && bps != 16 && bps != 24 && bps != 32 {
				return cfg, UnsupportedError(fmt.Sprintf("unsupported BitsPerSample=%d for SampleFormatUInt[%d]", bps, i))
			}
		case SampleFormatInt:
			if bps != 8 && bps != 16 && bps != 32 {
				return cfg, UnsupportedError(fmt.Sprintf("unsupported BitsPerSample=%d for SampleFormatInt[%d]", bps, i))
			}
		case SampleFormatIEEEFP:
			if bps != 32 && bps != 64 {
				return cfg, UnsupportedError(fmt.Sprintf("unsupported BitsPerSample=%d for SampleFormatIEEEFP[%d] (only 32/64 supported)", bps, i))
			}
		default:
			return cfg, UnsupportedError(fmt.Sprintf("unsupported SampleFormat[%d]: %s", i, sf))
		}
	}

	isTiled := md.TileWidth > 0
	if isTiled {
		if md.TileLength == 0 { return cfg, FormatError("missing required TileLength for tiled image") }
		if len(md.TileOffsets) == 0 { return cfg, FormatError("missing required TileOffsets for tiled image") }
		if len(md.TileByteCounts) == 0 { return cfg, FormatError("missing required TileByteCounts for tiled image") }
		if len(md.StripOffsets) > 0 || len(md.StripByteCounts) > 0 || md.RowsPerStrip > 0 {
			return cfg, FormatError("cannot have both Strip and Tile tags present")
		}
		numTilesX := (md.ImageWidth + md.TileWidth - 1) / md.TileWidth
		numTilesY := (md.ImageLength + md.TileLength - 1) / md.TileLength
		numTiles := int(numTilesX * numTilesY)
		if len(md.TileOffsets) != numTiles {
			return cfg, FormatError(fmt.Sprintf("TileOffsets count (%d) does not match expected tile count (%d)", len(md.TileOffsets), numTiles))
		}
		if len(md.TileByteCounts) != numTiles {
			return cfg, FormatError(fmt.Sprintf("TileByteCounts count (%d) does not match expected tile count (%d)", len(md.TileByteCounts), numTiles))
		}
	} else {
		if len(md.StripOffsets) == 0 { return cfg, FormatError("missing required tag: StripOffsets") }
		if len(md.StripByteCounts) == 0 { return cfg, FormatError("missing required tag: StripByteCounts") }
		if md.RowsPerStrip == 0 || md.RowsPerStrip > md.ImageLength { md.RowsPerStrip = md.ImageLength }
		numStrips := (md.ImageLength + md.RowsPerStrip - 1) / md.RowsPerStrip
		if len(md.StripOffsets) != int(numStrips) {
			if !(len(md.StripOffsets) == 1 && len(md.StripByteCounts) == 1 && md.RowsPerStrip >= md.ImageLength) {
				return cfg, FormatError(fmt.Sprintf("StripOffsets count (%d) does not match expected strip count (%d)", len(md.StripOffsets), numStrips))
			}
		}
		if len(md.StripByteCounts) != len(md.StripOffsets) {
			return cfg, FormatError(fmt.Sprintf("StripByteCounts count (%d) does not match StripOffsets count (%d)", len(md.StripByteCounts), len(md.StripOffsets)))
		}
	}

	pi := md.PhotometricInterpretation
	bpsSlice := md.BitsPerSample
	switch pi {
	case PhotoWhiteIsZero, PhotoBlackIsZero:
		if spp != 1 { return cfg, FormatError(fmt.Sprintf("SPP=%d must be 1 for PI=%s", spp, pi)) }
		if len(bpsSlice) != 1 { return cfg, FormatError(fmt.Sprintf("BPS count=%d must be 1 for grayscale", len(bpsSlice))) }
		bps := int(bpsSlice[0])
		if bps != 8 && bps != 16 && bps != 24 && bps != 32 {
			return cfg, UnsupportedError(fmt.Sprintf("unsupported BPS=%d for grayscale PI=%s", bps, pi))
		}
		if bps == 8 { cfg.ColorModel = color.GrayModel } else { cfg.ColorModel = color.Gray16Model }
	case PhotoRGB:
	if spp == 1 {
			if len(bpsSlice) == 1 && bpsSlice[0] == 16 {
				log.Warn("Applying fallback: Treating PhotoRGB with SPP=1, BPS=16 as Gray16")
		cfg.ColorModel = color.Gray16Model
			} else {
				err := FormatError(fmt.Sprintf("invalid combination: PhotoRGB with SPP=1 requires BPS=[16], got BPS=%v", bpsSlice))
				log.Warn("Validation failed", slog.Any("error", err))
				return cfg, err
			}
		} else if spp != 3 && spp != 4 {
			err := UnsupportedError(fmt.Sprintf("SPP=%d must be 3 or 4 for PhotoRGB", spp))
			log.Warn("Validation failed", slog.Any("error", err))
			return cfg, err
		} else {
			if len(bpsSlice) != spp { return cfg, FormatError(fmt.Sprintf("BPS count (%d) must equal SamplesPerPixel (%d) for PhotoRGB", len(bpsSlice), spp)) }
			if spp == 4 {
				if len(md.ExtraSamples) == 1 && md.ExtraSamples[0] != 0 && md.ExtraSamples[0] != 1 && md.ExtraSamples[0] != 2 {
					return cfg, UnsupportedError(fmt.Sprintf("unsupported ExtraSamples value (%d), only 0 (Unspecified), 1 (Associated Alpha), or 2 (Unassociated Alpha) allowed", md.ExtraSamples[0]))
				}
			}
			if md.PlanarConfiguration != PlanarChunky { return cfg, UnsupportedError(fmt.Sprintf("unsupported PlanarConfiguration: %s", md.PlanarConfiguration)) }
			bps := int(bpsSlice[0])
			if bps != 8 && bps != 16 { return cfg, UnsupportedError(fmt.Sprintf("unsupported BPS=%d for RGB/RGBA", bps)) }
			for i := 1; i < spp; i++ {
				if int(bpsSlice[i]) != bps { return cfg, UnsupportedError(fmt.Sprintf("BPS must be the same for all %d samples (got %v)", spp, bpsSlice)) }
			}
			if bps == 8 { cfg.ColorModel = color.RGBAModel } else { cfg.ColorModel = color.RGBA64Model }
		}
	case PhotoPalette:
		if spp != 1 { return cfg, FormatError(fmt.Sprintf("SPP=%d must be 1 for PhotoPalette", spp)) }
		if len(bpsSlice) != 1 { return cfg, FormatError(fmt.Sprintf("BPS count=%d must be 1 for PhotoPalette", len(bpsSlice))) }
		bps := int(bpsSlice[0])
		if bps != 8 { return cfg, UnsupportedError(fmt.Sprintf("unsupported BPS=%d for PhotoPalette (only 8 supported)", bps)) }
		if len(md.ColorMap) == 0 { return cfg, FormatError("missing ColorMap for PhotoPalette") }
		expectedMapEntries := 1 << bps
		if len(md.ColorMap) != expectedMapEntries { return cfg, FormatError(fmt.Sprintf("invalid ColorMap length (%d) for %d BPS (expected %d)", len(md.ColorMap), bps, expectedMapEntries)) }
		goPalette := make(color.Palette, expectedMapEntries)
		for i, entry := range md.ColorMap {
			goPalette[i] = color.RGBA{R: uint8(entry[0] >> 8), G: uint8(entry[1] >> 8), B: uint8(entry[2] >> 8), A: 255}
		}
		cfg.ColorModel = goPalette
	default:
		err := UnsupportedError(fmt.Sprintf("unsupported PhotometricInterpretation: %s", pi))
		log.Warn("Validation failed", slog.Any("error", err))
		return cfg, err
	}

	if md.Predictor == PredHorizontal {
		for _, sf := range md.SampleFormat {
			if sf != SampleFormatUInt {
				return cfg, UnsupportedError(fmt.Sprintf("Predictor=Horizontal requires all samples to be unsigned integers (found %s)", sf))
			}
		}
	} else if md.Predictor != PredNone {
		return cfg, UnsupportedError(fmt.Sprintf("unsupported Predictor: %s", md.Predictor))
	}

	log.Debug("Exiting validateMetadataAndSetConfig successfully")
	return cfg, nil
}

func parseIFDEntry(md *Metadata, p []byte, byteOrder binary.ByteOrder, readerAt io.ReaderAt, logger *slog.Logger) (parseErr error) {
	log := getLogger(logger)
	if len(p) < ifdLen { return FormatError("bad IFD entry length") }
	tagID := int(byteOrder.Uint16(p[0:2]))
	if md.UnknownTags == nil { md.UnknownTags = make(map[int]map[string]any) }
	datatype, count, value, parseErr := ifdValue(p, byteOrder, readerAt, log)

	getUintSlice := func() []uint {
		if datatype == dtByte || datatype == dtShort || datatype == dtLong {
			if uVal, uintErr := ifdUint(p, byteOrder, readerAt, log); uintErr == nil { return uVal }
		}
		return nil
	}
	getFirstUint := func(defaultVal uint) uint {
		if uSlice := getUintSlice(); len(uSlice) > 0 { return uSlice[0] }
		return defaultVal
	}
	getRational := func() [][2]uint32 {
		if r, ok := value.([][2]uint32); ok { return r }
		return nil
	}
	getFirstRational := func() [2]uint32 {
		if r := getRational(); len(r) == 1 { return r[0] }
		return [2]uint32{0, 0}
	}
	getString := func() string {
		if s, ok := value.(string); ok { return s }
		return ""
	}
	getUint16Slice := func() []uint16 {
		if s, ok := value.([]uint16); ok { return s }
		return nil
	}
	getUint32Slice := func() []uint32 {
		if l, ok := value.([]uint32); ok { return l }
		if s, ok := value.([]uint16); ok {
			lConv := make([]uint32, len(s))
			for i, v := range s { lConv[i] = uint32(v) }
			return lConv
		}
		return nil
	}
	getFloat64Slice := func() []float64 {
		floats := make([]float64, 0, count)
		switch v := value.(type) {
		case []uint16: for _, n := range v { floats = append(floats, float64(n)) }
		case []uint32: for _, n := range v { floats = append(floats, float64(n)) }
		case []int8: for _, n := range v { floats = append(floats, float64(n)) }
		case []int16: for _, n := range v { floats = append(floats, float64(n)) }
		case []int32: for _, n := range v { floats = append(floats, float64(n)) }
		case []float32: for _, n := range v { floats = append(floats, float64(n)) }
		case []float64: floats = v
		default: return nil
		}
		return floats
	}

	parsed := false
	if parseErr == nil {
		switch tagID {
		case tImageWidth: md.ImageWidth = uint32(getFirstUint(0)); parsed = true
		case tImageLength: md.ImageLength = uint32(getFirstUint(0)); parsed = true
		case tBitsPerSample: md.BitsPerSample = getUint16Slice(); parsed = true
		case tCompression: md.Compression = Compression(getFirstUint(1)); parsed = true
		case tPhotometricInterpretation: md.PhotometricInterpretation = PhotometricInterpretation(getFirstUint(0)); parsed = true
		case tStripOffsets: md.StripOffsets = getUint32Slice(); parsed = true
		case tSamplesPerPixel: md.SamplesPerPixel = uint16(getFirstUint(1)); parsed = true
		case tRowsPerStrip: md.RowsPerStrip = uint32(getFirstUint(0)); parsed = true
		case tStripByteCounts: md.StripByteCounts = getUint32Slice(); parsed = true
		case tXResolution: md.XResolution = getFirstRational(); parsed = true
		case tYResolution: md.YResolution = getFirstRational(); parsed = true
		case tPlanarConfiguration: md.PlanarConfiguration = PlanarConfiguration(getFirstUint(1)); parsed = true
		case tResolutionUnit: md.ResolutionUnit = ResolutionUnit(getFirstUint(2)); parsed = true
		case tPredictor: md.Predictor = Predictor(getFirstUint(1)); parsed = true
		case tSampleFormat:
			if shorts := getUint16Slice(); shorts != nil {
				md.SampleFormat = make([]SampleFormat, len(shorts))
				for i, v := range shorts { md.SampleFormat[i] = SampleFormat(v) }
				parsed = true
			}
		case tColorMap:
			if shorts := getUint16Slice(); shorts != nil && len(shorts)%3 == 0 {
				numEntries := len(shorts) / 3; md.ColorMap = make([][3]uint16, numEntries)
				for i := 0; i < numEntries; i++ { md.ColorMap[i][0] = shorts[i]; md.ColorMap[i][1] = shorts[i+numEntries]; md.ColorMap[i][2] = shorts[i+numEntries*2] }; parsed = true
			}
		case tTileWidth: md.TileWidth = uint32(getFirstUint(0)); parsed = true
		case tTileLength: md.TileLength = uint32(getFirstUint(0)); parsed = true
		case tTileOffsets: md.TileOffsets = getUint32Slice(); parsed = true
		case tTileByteCounts: md.TileByteCounts = getUint32Slice(); parsed = true
		case tNewSubfileType: md.NewSubfileType = uint32(getFirstUint(0)); parsed = true
		case tSubfileType: md.SubfileType = uint16(getFirstUint(0)); parsed = true
		case tFillOrder: md.FillOrder = uint16(getFirstUint(1)); parsed = true
		case tMinSampleValue: md.MinSampleValue = getUint16Slice(); parsed = true
		case tMaxSampleValue: md.MaxSampleValue = getUint16Slice(); parsed = true
		case tThreshholding: md.Threshholding = uint16(getFirstUint(1)); parsed = true
		case tCellWidth: md.CellWidth = uint16(getFirstUint(0)); parsed = true
		case tCellLength: md.CellLength = uint16(getFirstUint(0)); parsed = true
		case tFreeOffsets: md.FreeOffsets = getUint32Slice(); parsed = true
		case tFreeByteCounts: md.FreeByteCounts = getUint32Slice(); parsed = true
		case tGrayResponseUnit: md.GrayResponseUnit = uint16(getFirstUint(2)); parsed = true
		case tGrayResponseCurve: md.GrayResponseCurve = getUint16Slice(); parsed = true
		case tTransferFunction: md.TransferFunction = getUint16Slice(); parsed = true
		case tWhitePoint:
			if r := getRational(); len(r) == 2 { md.WhitePoint[0] = r[0]; md.WhitePoint[1] = r[1]; parsed = true }
		case tPrimaryChromaticities:
			if r := getRational(); len(r) == 6 { copy(md.PrimaryChromaticities[:], r); parsed = true }
		case tHalftoneHints:
			if s := getUint16Slice(); len(s) == 2 { md.HalftoneHints[0] = s[0]; md.HalftoneHints[1] = s[1]; parsed = true }
		case tExtraSamples: md.ExtraSamples = getUint16Slice(); parsed = true
		case tSMinSampleValue: md.SMinSampleValue = getFloat64Slice(); parsed = true
		case tSMaxSampleValue: md.SMaxSampleValue = getFloat64Slice(); parsed = true
		case tTransferRange:
			if s := getUint16Slice(); len(s) == 6 { copy(md.TransferRange[:], s); parsed = true }
		case tT4Options: md.T4Options = uint32(getFirstUint(0)); parsed = true
		case tT6Options: md.T6Options = uint32(getFirstUint(0)); parsed = true
		case tInkSet: md.InkSet = uint16(getFirstUint(1)); parsed = true
		case tInkNames: md.InkNames = getString(); parsed = true
		case tNumberOfInks: md.NumberOfInks = uint16(getFirstUint(4)); parsed = true
		case tDotRange: md.DotRange = getUint16Slice(); parsed = true
		case tTargetPrinter: md.TargetPrinter = getString(); parsed = true
		case tYCbCrCoefficients:
			if r := getRational(); len(r) == 3 { copy(md.YCbCrCoefficients[:], r); parsed = true }
		case tYCbCrSubSampling:
			if s := getUint16Slice(); len(s) == 2 { md.YCbCrSubSampling[0] = s[0]; md.YCbCrSubSampling[1] = s[1]; parsed = true }
		case tYCbCrPositioning: md.YCbCrPositioning = uint16(getFirstUint(1)); parsed = true
		case tReferenceBlackWhite:
			md.ReferenceBlackWhite = getRational()
			if md.ReferenceBlackWhite != nil { parsed = true }
		case tJPEGProc: md.JPEGProc = uint16(getFirstUint(0)); parsed = true
		case tJPEGInterchangeFormat: md.JPEGInterchangeFormat = uint32(getFirstUint(0)); parsed = true
		case tJPEGInterchangeFormatLength: md.JPEGInterchangeFormatLength = uint32(getFirstUint(0)); parsed = true
		case tJPEGRestartInterval: md.JPEGRestartInterval = uint16(getFirstUint(0)); parsed = true
		case tJPEGLosslessPredictors: md.JPEGLosslessPredictors = getUint16Slice(); parsed = true
		case tJPEGPointTransforms: md.JPEGPointTransforms = getUint16Slice(); parsed = true
		case tJPEGQTables: md.JPEGQTables = getUint32Slice(); parsed = true
		case tJPEGDCTables: md.JPEGDCTables = getUint32Slice(); parsed = true
		case tJPEGACTables: md.JPEGACTables = getUint32Slice(); parsed = true
		case tDocumentName: md.DocumentName = getString(); parsed = true
		case tImageDescription: md.ImageDescription = getString(); parsed = true
		case tMake: md.Make = getString(); parsed = true
		case tModel: md.Model = getString(); parsed = true
		case tPageName: md.PageName = getString(); parsed = true
		case tSoftware: md.Software = getString(); parsed = true
		case tDateTime: md.DateTime = getString(); parsed = true
		case tArtist: md.Artist = getString(); parsed = true
		case tHostComputer: md.HostComputer = getString(); parsed = true
		case tCopyright: md.Copyright = getString(); parsed = true
		case tOrientation: md.Orientation = Orientation(getFirstUint(1)); parsed = true
		case tPageNumber:
			if s := getUint16Slice(); len(s) == 2 { md.PageNumber[0] = s[0]; md.PageNumber[1] = s[1]; parsed = true }
		case tXPosition: md.XPosition = getFirstRational(); parsed = true
		case tYPosition: md.YPosition = getFirstRational(); parsed = true
		}
	}
	if !parsed || parseErr != nil {
		if _, exists := md.UnknownTags[tagID]; !exists {
			tagInfo := map[string]any{ "ID": tagID, "TypeID": datatype, "Count": count, "Value": value }
			if parseErr != nil {
				tagInfo["ParseError"] = parseErr.Error()
				log.Debug("Unknown tag encountered with parse error", slog.Int("tagID", tagID), slog.Any("error", parseErr))
			} else {
				log.Debug("Unknown tag encountered", slog.Int("tagID", tagID), slog.Int("dataType", int(datatype)), slog.Int("count", int(count)))
			}
			md.UnknownTags[tagID] = tagInfo
		}
	}
	return parseErr
}

func ifdValue(p []byte, byteOrder binary.ByteOrder, readerAt io.ReaderAt, logger *slog.Logger) (datatype uint16, count uint32, value any, err error) {
	log := getLogger(logger)
	if len(p) < ifdLen { err = FormatError("bad IFD entry"); return }
	datatype = byteOrder.Uint16(p[2:4])
	count = byteOrder.Uint32(p[4:8])
	if count > (math.MaxInt32 / 8) {
		err = FormatError("IFD count too large")
		log.Warn("IFD entry count exceeds limit", slog.Int("dataType", int(datatype)), slog.Int("count", int(count)))
		return
	}
	var typeSize uint32
	var knownType = true
	switch datatype {
	case dtByte, dtASCII, dtSByte, dtUndefined: typeSize = 1
	case dtShort, dtSShort: typeSize = 2
	case dtLong, dtSLong, dtFloat: typeSize = 4
	case dtRational, dtSRational, dtDouble: typeSize = 8
	default:
		knownType = false
		err = UnsupportedError(fmt.Sprintf("unknown IFD data type %d", datatype))
		log.Debug("Unsupported IFD data type encountered", slog.Int("dataType", int(datatype)))
	}
	var dataBytes []byte
	if knownType {
		datalen := typeSize * uint32(count)
		if datalen <= 4 {
			dataBytes = p[8 : 8+datalen]
		} else {
			offset := int64(byteOrder.Uint32(p[8:12]))
			dataBytes, err = safeReadAt(readerAt, uint64(datalen), offset, log)
			if err != nil {
				log.Error("Failed to read data for IFD value", slog.Int("dataType", int(datatype)), slog.Int("count", int(count)), slog.Int64("offset", offset), slog.Any("error", err))
				return
			}
		}
	} else {
		if count > 0 {
			offset := int64(byteOrder.Uint32(p[8:12]))
			const maxUnknownRead = 64
			dataBytes, _ = safeReadAt(readerAt, maxUnknownRead, offset, log)
		}
		value = dataBytes
		return
	}
	switch datatype {
	case dtByte: vals := make([]uint8, count); for i := range count { vals[i] = dataBytes[i] }; value = vals
	case dtASCII: if count > 0 && dataBytes[len(dataBytes)-1] == 0 { value = string(dataBytes[:len(dataBytes)-1]) } else { value = string(dataBytes) }
	case dtShort: vals := make([]uint16, count); for i := range count { vals[i] = byteOrder.Uint16(dataBytes[2*i:]) }; value = vals
	case dtLong: vals := make([]uint32, count); for i := range count { vals[i] = byteOrder.Uint32(dataBytes[4*i:]) }; value = vals
	case dtRational: vals := make([][2]uint32, count); for i := range count { vals[i][0] = byteOrder.Uint32(dataBytes[8*i:]); vals[i][1] = byteOrder.Uint32(dataBytes[8*i+4:]) }; value = vals
	case dtSByte: vals := make([]int8, count); for i := range count { vals[i] = int8(dataBytes[i]) }; value = vals
	case dtUndefined: value = dataBytes
	case dtSShort: vals := make([]int16, count); for i := range count { vals[i] = int16(byteOrder.Uint16(dataBytes[2*i:])) }; value = vals
	case dtSLong: vals := make([]int32, count); for i := range count { vals[i] = int32(byteOrder.Uint32(dataBytes[4*i:])) }; value = vals
	case dtSRational: vals := make([][2]int32, count); for i := range count { vals[i][0] = int32(byteOrder.Uint32(dataBytes[8*i:])); vals[i][1] = int32(byteOrder.Uint32(dataBytes[8*i+4:])) }; value = vals
	case dtFloat: vals := make([]float32, count); for i := range count { vals[i] = math.Float32frombits(byteOrder.Uint32(dataBytes[4*i:])) }; value = vals
	case dtDouble: vals := make([]float64, count); for i := range count { vals[i] = math.Float64frombits(byteOrder.Uint64(dataBytes[8*i:])) }; value = vals
	}
	return
}

func ifdUint(p []byte, byteOrder binary.ByteOrder, readerAt io.ReaderAt, logger *slog.Logger) (u []uint, err error) {
	log := getLogger(logger)
	var raw []byte
	if len(p) < ifdLen { return nil, FormatError("bad IFD entry") }
	datatype := byteOrder.Uint16(p[2:4])
	count := byteOrder.Uint32(p[4:8])
	if count > (math.MaxInt32 / 4) { return nil, FormatError("IFD count too large") }
	var typeSize uint32
	switch datatype {
	case dtByte: typeSize = 1
	case dtShort: typeSize = 2
	case dtLong: typeSize = 4
	default:
		err = UnsupportedError(fmt.Sprintf("unsupported IFD data type %d for uint parsing", datatype))
		log.Warn("Cannot parse uint for unsupported IFD type", slog.Int("dataType", int(datatype)))
		return nil, err
	}
	datalen := typeSize * uint32(count)
	if datalen > 4 {
		offset := int64(byteOrder.Uint32(p[8:12]))
		raw, err = safeReadAt(readerAt, uint64(datalen), offset, log)
		if err != nil {
			log.Error("Failed reading uint data from offset", slog.Int("dataType", int(datatype)), slog.Int("count", int(count)), slog.Int64("offset", offset), slog.Any("error", err))
			return nil, err
		}
	} else {
		raw = p[8 : 8+datalen]
	}
	u = make([]uint, count)
	switch datatype {
	case dtByte: for i := range count { u[i] = uint(raw[i]) }
	case dtShort: for i := range count { u[i] = uint(byteOrder.Uint16(raw[2*i : 2*(i+1)])) }
	case dtLong: for i := range count { u[i] = uint(byteOrder.Uint32(raw[4*i : 4*(i+1)])) }
	}
	return u, nil
}

func safeReadAt(r io.ReaderAt, n uint64, off int64, logger *slog.Logger) ([]byte, error) {
	log := getLogger(logger)
	if int64(n) < 0 || n != uint64(int(n)) {
		log.Error("Invalid read size requested", slog.Uint64("size", n), slog.Int64("offset", off))
		return nil, io.ErrUnexpectedEOF
	}
	if n == 0 { return []byte{}, nil }
	if n < maxChunkSize {
		buf := make([]byte, n)
		_, err := r.ReadAt(buf, off)
		if err != nil {
			if err != io.EOF || n > 0 {
				log.Error("ReadAt failed", slog.Uint64("readSize", n), slog.Int64("offset", off), slog.Any("error", err))
				return nil, err
			}
		}
		return buf, nil
	}
	var buf []byte
	buf1Ptr := bufPoolMaxChunkSize.Get().(*[]byte)
	buf1 := *buf1Ptr
	defer bufPoolMaxChunkSize.Put(buf1Ptr)
	for n > 0 {
		next := n
		if next > maxChunkSize { next = maxChunkSize }
		_, err := r.ReadAt(buf1[:next], off)
		if err != nil {
			log.Error("ReadAt failed during large read loop", slog.Uint64("nextChunkSize", next), slog.Int64("currentOffset", off), slog.Any("error", err))
			return nil, err
		}
		buf = append(buf, buf1[:next]...)
		n -= next
		off += int64(next)
	}
	return buf, nil
}

func dataTypeString(datatype uint16) string {
	switch datatype {
	case dtByte: return "BYTE"
	case dtASCII: return "ASCII"
	case dtShort: return "SHORT"
	case dtLong: return "LONG"
	case dtRational: return "RATIONAL"
	case dtSByte: return "SBYTE"
	case dtUndefined: return "UNDEFINED"
	case dtSShort: return "SSHORT"
	case dtSLong: return "SLONG"
	case dtSRational: return "SRATIONAL"
	case dtFloat: return "FLOAT"
	case dtDouble: return "DOUBLE"
	default: return "Unknown"
	}
}
