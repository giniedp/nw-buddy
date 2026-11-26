package image

import (
	"bytes"
	"fmt"
	goimage "image"
	"image/png"
	"nw-buddy/tools/formats/dds"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils"
	"path"
	"strings"

	"github.com/deepteams/webp"
	"github.com/woozymasta/bcn"
)

type Format string

const (
	FormatPNG  Format = ".png"
	FormatWEBP Format = ".webp"
	FormatDDS  Format = ".dds"
	// FormatKTX2 is UASTC KTX2 (Basis Universal, needs the ktx tool), its format follows the source DDS, see
	// ktxFormatOfDDS
	FormatKTX2 Format = ".ktx2"
)

func (f *Format) MimeType() string {
	switch *f {
	case FormatPNG:
		return "image/png"
	case FormatWEBP:
		return "image/webp"
	case FormatDDS:
		return "image/vnd-ms.dds"
	case FormatKTX2:
		return "image/ktx2"
	default:
		return ""
	}
}

var (
	ErrUnsupportedInputFormat  = fmt.Errorf("unsupported input format")
	ErrUnsupportedTargetFormat = fmt.Errorf("unsupported target format")
)

// Normal map formats of a DDS target. The game stores normal maps as BC5_SNORM, which Blender can't read.
const (
	NormalFormatKeep  = ""      // keep the stored format (the viewers read BC5_SNORM)
	NormalFormatRGBA8 = "rgba8" // R8G8B8A8_UNORM with z (RGB normals as Blender reads them), uncompressed
)

type convertConfig struct {
	normalMap    bool
	maxSize      uint
	normalFormat string
	ddsFormat    string
	srgb         bool
}

type ConvertOption func(*convertConfig)

func getConfig(options []ConvertOption) *convertConfig {
	config := &convertConfig{}
	for _, option := range options {
		option(config)
	}
	return config
}

func WithNormalMap(normalMap bool) ConvertOption {
	return func(c *convertConfig) {
		c.normalMap = normalMap
	}
}

func WithMaxSize(maxSize uint) ConvertOption {
	return func(c *convertConfig) {
		c.maxSize = maxSize
	}
}

// WithNormalFormat converts BC5_SNORM sources of a DDS target, see NormalFormatRGBA8
func WithNormalFormat(format string) ConvertOption {
	return func(c *convertConfig) {
		c.normalFormat = format
	}
}

// WithDDSFormat sets the DXGI format (BC7_UNORM or BC7_UNORM_SRGB) of a png → DDS conversion
func WithDDSFormat(format string) ConvertOption {
	return func(c *convertConfig) {
		c.ddsFormat = format
	}
}

// WithSRGB marks the png bytes of a png → DDS conversion as sRGB: an _SRGB target then keeps the bytes as they are
func WithSRGB(srgb bool) ConvertOption {
	return func(c *convertConfig) {
		c.srgb = srgb
	}
}

func ConvertFile(file nwfs.File, targetFormat Format, options ...ConvertOption) ([]byte, error) {
	filePath := file.Path()
	ext := path.Ext(filePath)
	switch ext {
	case ".dds":
		return ConvertDDSFile(file, targetFormat, options...)
	case ".png":
		return ConvertPNGFile(file, targetFormat, options...)
	default:
		// TODO: can we convert split part here? need access to the header file
		// if dds.IsDDSSplitPart(filePath) {
		// 	return ConvertDDSFile(file, targetFormat, options...)
		// }
		return nil, fmt.Errorf("%s %w", ext, ErrUnsupportedInputFormat)
	}
}

func ConvertDDSFile(file nwfs.File, target Format, options ...ConvertOption) ([]byte, error) {
	data, err := file.Read()
	if err != nil {
		return nil, err
	}
	return ConvertDDS(data, target, options...)
}

func ConvertDDS(data []byte, target Format, options ...ConvertOption) (res []byte, err error) {
	defer utils.HandleRecover(&err)

	config := getConfig(options)
	if target == FormatDDS {
		if config.normalFormat != NormalFormatKeep && isBC5SNorm(data) {
			return convertBC5SNorm(data, config)
		}
		return data, nil
	}
	// normal maps: RGB with z, as Blender reads them. No Y flip: the engine frame is the glTF frame
	// (bitangent = cross(normal, tangent) * tangent.w)
	img, err := DecodeDDS(data, DecodeDDSOptions{NormalMap: config.normalMap, MaxSize: int(config.maxSize)})
	if err != nil {
		return nil, err
	}
	switch target {
	case FormatPNG:
		return encodePNG(img, png.BestSpeed)
	case FormatWEBP:
		return encodeWebp(img)
	case FormatKTX2:
		return encodeKTX2(img, ktxFormatOfDDS(data, config.normalMap), config.normalMap)
	default:
		return nil, fmt.Errorf("%s %w", target, ErrUnsupportedTargetFormat)
	}
}

// encodePNG writes the image as PNG, see DecodeDDS for the image types. BestSpeed is 2-4× faster than the default
// level at 0.9-1.3× the size.
func encodePNG(img goimage.Image, level png.CompressionLevel) ([]byte, error) {
	buf := bytes.NewBuffer(nil)
	if err := (&png.Encoder{CompressionLevel: level}).Encode(buf, img); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

// encodeWebp encodes lossy WebP with libwebp's defaults (quality 75, method 4, lossless alpha). 16 bit images are
// reduced to 8 bit.
func encodeWebp(img goimage.Image) ([]byte, error) {
	buf := bytes.NewBuffer(nil)
	if err := webp.Encode(buf, img, webp.DefaultOptions()); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

func ConvertPNGFile(source nwfs.File, target Format, options ...ConvertOption) ([]byte, error) {
	if path.Ext(source.Path()) != ".png" {
		return nil, fmt.Errorf("unsupported source image format %s", path.Ext(source.Path()))
	}

	data, err := source.Read()
	if err != nil {
		return nil, err
	}

	return ConvertPNG(data, target, options...)
}

func ConvertPNG(data []byte, target Format, options ...ConvertOption) (res []byte, err error) {
	defer utils.HandleRecover(&err)

	config := getConfig(options)
	switch target {
	case FormatPNG:
		return data, nil
	case FormatWEBP:
		img, err := png.Decode(bytes.NewReader(data))
		if err != nil {
			return nil, err
		}
		return encodeWebp(img)
	case FormatDDS:
		format := config.ddsFormat
		if format == "" {
			format = "BC7_UNORM"
		}
		return pngToBC7(data, format)
	case FormatKTX2:
		// bakes (roughness, emissive): color or data by config.srgb
		format := "R8G8B8A8_UNORM"
		if config.srgb {
			format = "R8G8B8A8_SRGB"
		}
		return utils.Ktx.Create(data, utils.KtxCreateOpt{Format: format})
	default:
		return nil, fmt.Errorf("unsupported target image format %s", target)
	}
}

// ktxFormatOfDDS is the KTX2 format of a game texture, by its DDS format:
//   - normal maps (BC5_SNORM): R8G8B8_UNORM, unsigned xyz as glTF normal textures are
//   - sRGB formats (diffuse, specular, emittance): R8G8B8A8_SRGB
//   - one channel (BC4, the attached alpha of normal maps): R8_UNORM
//   - else (masks, details): R8G8B8A8_UNORM
func ktxFormatOfDDS(data []byte, normalMap bool) string {
	if normalMap {
		return "R8G8B8_UNORM"
	}
	format := ""
	if meta, err := dds.ParseMeta(data); err == nil {
		format = meta.FormatName()
	}
	switch {
	case strings.HasSuffix(format, "_SRGB"):
		return "R8G8B8A8_SRGB"
	case strings.HasPrefix(format, "BC4") || format == "ATI1" || format == "BC4U":
		return "R8_UNORM"
	default:
		return "R8G8B8A8_UNORM"
	}
}

// isBC5SNorm tells whether the data is a DX10 DDS in BC5_SNORM, the format of the game's normal maps
func isBC5SNorm(data []byte) bool {
	meta, err := dds.ParseMeta(data)
	if err != nil {
		return false
	}
	dxgi, ok := meta.DXGIFormat()
	return ok && dxgi == dds.DXGIFormatBC5SNorm
}

// convertBC5SNorm converts a BC5_SNORM normal map to the form Blender reads (NormalFormatRGBA8):
//   - every mip decoded
//   - [-1, 1] mapped to [0, 1]
//   - z rebuilt
func convertBC5SNorm(data []byte, config *convertConfig) ([]byte, error) {
	if config.normalFormat != NormalFormatRGBA8 {
		return nil, fmt.Errorf("unknown normal format %q", config.normalFormat)
	}
	mips, err := DecodeDDSNormalMips(data)
	if err != nil {
		return nil, err
	}
	face := bcn.Face{Mipmaps: make([][]byte, len(mips))}
	for i, it := range mips {
		face.Mipmaps[i] = it.Pix
	}
	out := &bcn.DDS{Format: bcn.FormatRGBA8, Width: mips[0].Rect.Dx(), Height: mips[0].Rect.Dy(), Faces: []bcn.Face{face}}
	buf := bytes.NewBuffer(nil)
	if err := out.Write(buf); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

// bakeBC7Quality is the bcn quality level of the bakes: lower levels lose up to 2.3 dB on one channel data
const bakeBC7Quality = 4

// pngToBC7 encodes png bytes (the bakes) to a BC7 DDS with a full mip chain. format is BC7_UNORM (data) or
// BC7_UNORM_SRGB (color): the bytes are kept as they are, sRGB only changes the format and the mip filter.
func pngToBC7(data []byte, format string) ([]byte, error) {
	srgb := false
	switch format {
	case "BC7_UNORM":
	case "BC7_UNORM_SRGB":
		srgb = true
	default:
		return nil, fmt.Errorf("%w: DDS %s", ErrUnsupportedTargetFormat, format)
	}
	img, err := png.Decode(bytes.NewReader(data))
	if err != nil {
		return nil, err
	}
	out, err := bcn.EncodeDDSWithOptions([]goimage.Image{img}, bcn.FormatBC7, &bcn.EncodeOptions{
		QualityLevel:    bakeBC7Quality,
		GenerateMipmaps: true,
		UseSRGB:         srgb,
	})
	if err != nil {
		return nil, err
	}
	buf := bytes.NewBuffer(nil)
	if err := out.Write(buf); err != nil {
		return nil, err
	}
	res := buf.Bytes()
	if srgb {
		// bcn writes BC7_UNORM in the DX10 header
		if err := dds.SetDXGIFormat(res, dds.DXGIFormatBC7UnormSRGB); err != nil {
			return nil, err
		}
	}
	return res, nil
}
