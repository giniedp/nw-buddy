package tiff

import (
	"bytes" // For logger buffer
	"image"
	"image/color"
	"image/png" // For decoding reference PNGs

	"io" // For io interfaces
	"log/slog"
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// Directory containing the heightmap samples
const heightmapSampleDir = "../../formats/heightmap/samples"

// Benchmark code moved to reader_benchmark_test.go

func openTestFile(t *testing.T, dir string, filename string) *os.File {
	t.Helper()
	p := filepath.Join(dir, filename)
	f, err := os.Open(p)
	require.NoError(t, err, "Failed to open test file: %s", p)
	return f
}

func TestDecodeConfig(t *testing.T) {
	tests := []struct {
		filename     string
		dir          string
		expectedCfg  image.Config
		expectErr    bool
		expectErrMsg string
	}{
		{
			filename:     "region.heightmap",
			dir:          heightmapSampleDir,
			// Expected config is determined below
			expectErr:    false,
		},
	}

	// Determine expected dimensions for region.heightmap from reference PNG
	var expectedRegionWidth, expectedRegionHeight int
	{
		refPngPath := filepath.Join(heightmapSampleDir, "region-16bit.png")
		refPngFile, err := os.Open(refPngPath)
		require.NoError(t, err, "Failed to open reference PNG for config: %s", refPngPath)
		defer refPngFile.Close()
		refCfg, err := png.DecodeConfig(refPngFile)
		require.NoError(t, err, "Failed to decode reference PNG config: %s", refPngPath)
		expectedRegionWidth = refCfg.Width
		expectedRegionHeight = refCfg.Height
	}

	// Update expectedCfg
	for i := range tests {
		if tests[i].filename == "region.heightmap" {
			tests[i].expectedCfg = image.Config{Width: expectedRegionWidth, Height: expectedRegionHeight, ColorModel: color.Gray16Model}
		}
	}

	for _, tt := range tests {
		t.Run(tt.filename, func(t *testing.T) {
			f := openTestFile(t, tt.dir, tt.filename)
			defer f.Close()

			cfg, _, err := DecodeConfig(f, nil) // Pass nil logger

			if tt.expectErr {
				assert.Error(t, err)
				if tt.expectErrMsg != "" {
					assert.ErrorContains(t, err, tt.expectErrMsg)
				}
			} else {
				assert.NoError(t, err)
				assert.Equal(t, tt.expectedCfg.Width, cfg.Width, "Width mismatch")
				assert.Equal(t, tt.expectedCfg.Height, cfg.Height, "Height mismatch")
			}
		})
	}
}

func TestDecode(t *testing.T) {
	/*
	Decoding flow for region.heightmap (logs confirm fallback):
	1. Decode -> newDecoder -> ReadMetadata
	2. ReadMetadata parses IFD (PhotoRGB, SPP=1, BPS=[16], etc.)
	3. validateMetadataAndSetConfig logs WARN "Applying fallback..." and sets ColorModel=Gray16Model
	4. ReadMetadata/newDecoder return successfully with Gray16 config.
	5. Decode calls decodeSingleImageParallel.
	6. processChunk (for the single chunk) runs without decompression/predictor.
	7. Pixel assembly uses Gray16Model.
	8. *image.Gray16 is returned successfully.
	*/
	tests := []struct {
		filename         string
		dir              string
		refPngFilename   string
		expectErr        bool
		expectErrMsg     string
	}{
		{
			filename:         "region.heightmap",
			dir:              heightmapSampleDir,
			refPngFilename:   "region-16bit.png",
			expectErr:        false,
			expectErrMsg:     "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.filename, func(t *testing.T) {
			inputFile := openTestFile(t, tt.dir, tt.filename)
			defer inputFile.Close()

			// Setup logger to capture output
			var logBuf bytes.Buffer
			logHandler := slog.NewTextHandler(&logBuf, &slog.HandlerOptions{Level: slog.LevelDebug})
			testLogger := slog.New(logHandler)

			_, err := inputFile.Seek(0, io.SeekStart)
			require.NoError(t, err)

			img, _, err := Decode(inputFile, testLogger)

			t.Logf("Captured logs for %s:\n%s", tt.filename, logBuf.String())

			require.NoError(t, err)
			require.NotNil(t, img)

			decodedBounds := img.Bounds()

			decodedGray16, ok := img.(*image.Gray16)
			require.True(t, ok, "Decoded image type mismatch: expected *image.Gray16, got %T", img)

			// Decode the reference PNG
			refPngFile := openTestFile(t, tt.dir, tt.refPngFilename)
			defer refPngFile.Close()

			refImg, err := png.Decode(refPngFile)
			require.NoError(t, err)
			require.NotNil(t, refImg)

			refBounds := refImg.Bounds()

			// Convert reference PNG to Gray16
			refGray16 := image.NewGray16(refBounds)
			switch ref := refImg.(type) {
			case *image.Gray16:
				copy(refGray16.Pix, ref.Pix)
			case *image.RGBA64:
				height := refBounds.Dy()
				width := refBounds.Dx()
				for yOffset := range height {
					y := refBounds.Min.Y + yOffset
					for xOffset := range width {
						x := refBounds.Min.X + xOffset
						rgba64 := ref.RGBA64At(x, y)
						grayVal := uint16(rgba64.R)
						pixelOffset := refGray16.PixOffset(x, y)
						refGray16.Pix[pixelOffset] = uint8(grayVal >> 8)
						refGray16.Pix[pixelOffset+1] = uint8(grayVal)
					}
				}
			default:
				t.Fatalf("Reference PNG decoded to unexpected type: %T", refImg)
			}

			// Compare dimensions
			require.Equal(t, refBounds.Dx(), decodedBounds.Dx())
			require.Equal(t, refBounds.Dy(), decodedBounds.Dy())

			// Compare Pixels
			width, height := refBounds.Dx(), refBounds.Dy()
			mismatches := 0
			maxMismatchesToReport := 10

			for y := range height {
				for x := range width {
					expectedPixel := refGray16.Gray16At(x, y)
					actualPixel := decodedGray16.Gray16At(x, y)

					if expectedPixel.Y != actualPixel.Y {
						if mismatches < maxMismatchesToReport {
							t.Errorf("Pixel mismatch at (%d, %d): expected %d (0x%X), got %d (0x%X)",
								x, y, expectedPixel.Y, expectedPixel.Y, actualPixel.Y, actualPixel.Y)
						}
						mismatches++
					}
				}
			}

			if mismatches > 0 {
				if mismatches > maxMismatchesToReport {
					t.Errorf("... and %d more mismatches", mismatches-maxMismatchesToReport)
				}
				t.FailNow()
			}

			assert.Zero(t, mismatches)
		})
	}
}

// TestHeightmapChannelContent checks the sample region.heightmap file decodes as Gray16.
func TestHeightmapChannelContent(t *testing.T) {
	filePath := filepath.Join("..", "..", "formats", "heightmap", "samples", "region.heightmap")
	file, err := os.Open(filePath)
	require.NoError(t, err)
	defer file.Close()

	_, err = file.Seek(0, io.SeekStart)
	require.NoError(t, err)

	img, _, err := Decode(file, nil) // Pass nil logger

	require.NoError(t, err)

	switch img.(type) {
	case *image.Gray16:
		// Expected type due to fallback logic
	default:
		t.Fatalf("Decoded image has unexpected type: expected *image.Gray16, got %T", img)
	}
}

