package inspect

import (
	"fmt"
	"nw-buddy/tools/formats/dds"
	"nw-buddy/tools/game"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils"
	"strings"

	"github.com/spf13/cobra"
)

var cmdTextures = &cobra.Command{
	Use:   "textures [glob...]",
	Short: "collects statistics of .dds files (resolution, mips, format, header vs split mip sizes)",
	Long: `collects statistics of .dds header files and their split mip files (.dds.N, .dds.a, .dds.Na)
and writes one json row per texture.

Sizes are uncompressed (size) and compressed in the pak (csize).`,
	Run: runTextures,
}

type TextureRow struct {
	File       string `json:"file"`
	Dir        string `json:"dir"`
	Width      int    `json:"w"`
	Height     int    `json:"h"`
	Depth      int    `json:"d,omitempty"`
	Mips       int    `json:"mips"`
	Format     string `json:"format"`
	Cube       bool   `json:"cube,omitempty"`
	Array      int    `json:"array,omitempty"`
	Normal     bool   `json:"normal,omitempty"`
	Size       int64  `json:"size"`  // header file
	CSize      int64  `json:"csize"` // header file
	HeaderLen  int    `json:"headerLen"`
	Splits     int    `json:"splits"`     // number of .dds.N files
	SplitSize  int64  `json:"splitSize"`  // sum of .dds.N files
	SplitCSize int64  `json:"splitCSize"` // sum of .dds.N files
	// mip levels contained in the header file and size of its largest one
	HeaderMips int `json:"headerMips"`
	HeaderRes  int `json:"headerRes"`
	// whether the data size of the header file matches the computed size of the header mips
	HeaderMatch bool `json:"headerMatch"`
	// attached alpha (.dds.a header + .dds.Na splits)
	AlphaSize       int64  `json:"alphaSize,omitempty"`
	AlphaCSize      int64  `json:"alphaCSize,omitempty"`
	AlphaSplits     int    `json:"alphaSplits,omitempty"`
	AlphaSplitSize  int64  `json:"alphaSplitSize,omitempty"`
	AlphaSplitCSize int64  `json:"alphaSplitCSize,omitempty"`
	Error           string `json:"error,omitempty"`
}

func runTextures(ccmd *cobra.Command, args []string) {
	assets := utils.Must(game.InitPackedAssets(flgGameDir))
	if len(args) == 0 {
		args = []string{"**.dds"}
	}
	files := utils.Must(listFiles(args, false, assets.Archive))
	processRows("Textures", files, func(file nwfs.File) *TextureRow {
		return inspectTexture(assets, file)
	})
}

func inspectTexture(assets *game.Assets, file nwfs.File) *TextureRow {
	p := file.Path()
	row := &TextureRow{
		File:   p,
		Dir:    topDir(p, 2),
		Size:   fileSize(file),
		CSize:  compressedSize(file),
		Normal: dds.IsNormalMap(p),
	}
	for i := 1; ; i++ {
		f, ok := assets.Archive.Lookup(fmt.Sprintf("%s.%d", p, i))
		if !ok {
			break
		}
		row.Splits++
		row.SplitSize += fileSize(f)
		row.SplitCSize += compressedSize(f)
	}
	if f, ok := assets.Archive.Lookup(p + ".a"); ok {
		row.AlphaSize = fileSize(f)
		row.AlphaCSize = compressedSize(f)
		for i := 1; ; i++ {
			f, ok := assets.Archive.Lookup(fmt.Sprintf("%s.%da", p, i))
			if !ok {
				break
			}
			row.AlphaSplits++
			row.AlphaSplitSize += fileSize(f)
			row.AlphaSplitCSize += compressedSize(f)
		}
	}

	meta, err := dds.LoadMeta(file)
	if err != nil {
		row.Error = err.Error()
		return row
	}
	h := meta.Header
	row.Width = int(h.Width)
	row.Height = int(h.Height)
	row.Depth = int(h.Depth)
	row.Mips = max(1, int(h.MipMapCount))
	row.Format = meta.FormatName()
	row.Cube = meta.IsCubemap()
	row.HeaderLen = meta.HeaderSize
	faces := 1
	if meta.DX10Header != nil && meta.DX10Header.ArraySize > 1 {
		row.Array = int(meta.DX10Header.ArraySize)
		faces = row.Array
	}
	if row.Cube {
		faces *= 6
	}
	row.HeaderMips = row.Mips - row.Splits
	row.HeaderRes = max(row.Width, row.Height) >> row.Splits
	if bpb, bs := formatBlock(row.Format, int(h.PixelFormat.RGBBitCount)); bpb > 0 {
		expected := int64(0)
		for m := row.Splits; m < row.Mips; m++ {
			w := max(1, row.Width>>m)
			hh := max(1, row.Height>>m)
			expected += int64((w+bs-1)/bs) * int64((hh+bs-1)/bs) * int64(bpb)
		}
		row.HeaderMatch = expected*int64(faces) == int64(len(meta.Data)-meta.HeaderSize)
	}
	return row
}

// formatBlock returns bytes per block and the block size in pixels
func formatBlock(format string, bitCount int) (int, int) {
	f := strings.ToUpper(format)
	var dxgi int
	if _, err := fmt.Sscanf(f, "DXGI_%d", &dxgi); err == nil {
		switch {
		case dxgi >= 70 && dxgi <= 72, dxgi >= 79 && dxgi <= 81:
			return 8, 4 // BC1, BC4
		case dxgi >= 73 && dxgi <= 78, dxgi >= 82 && dxgi <= 84, dxgi >= 94 && dxgi <= 99:
			return 16, 4 // BC2, BC3, BC5, BC6H, BC7
		}
		return 0, 0
	}
	switch {
	case strings.HasPrefix(f, "BC1"), strings.HasPrefix(f, "BC4"), f == "DXT1", f == "ATI1", f == "BC4U":
		return 8, 4
	case strings.HasPrefix(f, "BC"), f == "DXT3", f == "DXT5", f == "ATI2", f == "BC5U":
		return 16, 4
	case f == "R8G8B8A8_UNORM", f == "R8G8B8A8_UNORM_SRGB":
		return 4, 1
	case f == "R16G16B16A16_FLOAT":
		return 8, 1
	case f == "R32G32B32A32_FLOAT":
		return 16, 1
	case bitCount > 0 && !strings.HasPrefix(f, "DXGI_"):
		return bitCount / 8, 1
	}
	return 0, 0
}
