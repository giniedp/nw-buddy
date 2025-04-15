package tiff

import (
	"fmt"
	"image"
	"image/color"

	"log/slog"
)

// ConvertToGray16 attempts to convert a given image.Image to *image.Gray16.
// It handles common image types like Gray, Gray16, RGBA, and RGBA64.
// If the input is already *image.Gray16, it's returned directly.
// For color images, it calculates luminance to produce grayscale.
// Accepts an optional logger; if nil, logs are discarded.
func ConvertToGray16(img image.Image, logger *slog.Logger) (*image.Gray16, error) {
	log := getLogger(logger) // Use the helper from metadata.go (or move it)
	log.Debug("Entering ConvertToGray16", slog.String("inputType", fmt.Sprintf("%T", img)))

	if img == nil {
		log.Error("ConvertToGray16: cannot convert nil image")
		return nil, fmt.Errorf("cannot convert nil image")
	}

	bounds := img.Bounds()
	gray16Img := image.NewGray16(bounds)

	switch src := img.(type) {
	case *image.Gray16:
		log.Debug("ConvertToGray16: Input is already Gray16, returning directly")
		// Return direct reference. If mutation is a concern, copy pixel data.
		return src, nil

	case *image.Gray:
		log.Debug("ConvertToGray16: Converting Gray to Gray16")
		// Handle 8-bit Gray input by scaling
		for y := bounds.Min.Y; y < bounds.Max.Y; y++ {
			for x := bounds.Min.X; x < bounds.Max.X; x++ {
				grayVal := src.GrayAt(x, y).Y
				gray16Img.SetGray16(x, y, color.Gray16{Y: uint16(grayVal) * 257}) // Scale 0-255 to 0-65535
			}
		}
		return gray16Img, nil

	case *image.RGBA64:
		log.Debug("ConvertToGray16: Converting RGBA64 to Gray16 using luminance")
		// Use luminance calculation: Y = 0.299*R + 0.587*G + 0.114*B
		for y := bounds.Min.Y; y < bounds.Max.Y; y++ {
			for x := bounds.Min.X; x < bounds.Max.X; x++ {
				r, g, b, _ := src.RGBA64At(x, y).RGBA()
				lum := 0.299*float64(r) + 0.587*float64(g) + 0.114*float64(b)
				// Add 0.5 for rounding before casting
				gray16Img.SetGray16(x, y, color.Gray16{Y: uint16(lum + 0.5)})
			}
		}
		return gray16Img, nil

	case *image.RGBA:
		log.Debug("ConvertToGray16: Converting RGBA to Gray16 using luminance")
		// Use luminance calculation: Y = 0.299*R + 0.587*G + 0.114*B
		// Note: RGBA() scales 8-bit values to 16-bit (0-0xFFFF)
		for y := bounds.Min.Y; y < bounds.Max.Y; y++ {
			for x := bounds.Min.X; x < bounds.Max.X; x++ {
				r, g, b, _ := src.RGBAAt(x, y).RGBA()
				lum := 0.299*float64(r) + 0.587*float64(g) + 0.114*float64(b)
				// Add 0.5 for rounding before casting
				gray16Img.SetGray16(x, y, color.Gray16{Y: uint16(lum + 0.5)})
			}
		}
		return gray16Img, nil

	// Add cases for NRGBA, NRGBA64 etc. if needed

	default:
		err := fmt.Errorf("unsupported image type for grayscale conversion: %T", img)
		log.Warn("ConvertToGray16 failed", slog.Any("error", err))
		return nil, err
	}
}

// ConvertToRGBA64 attempts to convert a given image.Image to *image.RGBA64.
// It handles common image types like Gray, Gray16, RGBA, and RGBA64.
// If the input is already *image.RGBA64, it's returned directly.
// For grayscale images, the value is replicated across R, G, B channels.
// Accepts an optional logger; if nil, logs are discarded.
func ConvertToRGBA64(img image.Image, logger *slog.Logger) (*image.RGBA64, error) {
	log := getLogger(logger) // Use the helper from metadata.go (or move it)
	log.Debug("Entering ConvertToRGBA64", slog.String("inputType", fmt.Sprintf("%T", img)))

	if img == nil {
		log.Error("ConvertToRGBA64: cannot convert nil image")
		return nil, fmt.Errorf("cannot convert nil image")
	}

	bounds := img.Bounds()
	rgba64Img := image.NewRGBA64(bounds)

	switch src := img.(type) {
	case *image.RGBA64:
		log.Debug("ConvertToRGBA64: Input is already RGBA64, returning directly")
		// Return direct reference. If mutation is a concern, copy pixel data.
		return src, nil

	case *image.Gray16:
		log.Debug("ConvertToRGBA64: Converting Gray16 to RGBA64")
		for y := bounds.Min.Y; y < bounds.Max.Y; y++ {
			for x := bounds.Min.X; x < bounds.Max.X; x++ {
				yVal := src.Gray16At(x, y).Y
				rgba64Img.SetRGBA64(x, y, color.RGBA64{R: yVal, G: yVal, B: yVal, A: 0xffff}) // Opaque alpha
			}
		}
		return rgba64Img, nil

	case *image.Gray:
		log.Debug("ConvertToRGBA64: Converting Gray to RGBA64")
		for y := bounds.Min.Y; y < bounds.Max.Y; y++ {
			for x := bounds.Min.X; x < bounds.Max.X; x++ {
				yVal8 := src.GrayAt(x, y).Y
				yVal16 := uint16(yVal8) * 257 // Scale 0-255 to 0-65535
				rgba64Img.SetRGBA64(x, y, color.RGBA64{R: yVal16, G: yVal16, B: yVal16, A: 0xffff}) // Opaque alpha
			}
		}
		return rgba64Img, nil

	case *image.RGBA:
		log.Debug("ConvertToRGBA64: Converting RGBA to RGBA64")
		for y := bounds.Min.Y; y < bounds.Max.Y; y++ {
			for x := bounds.Min.X; x < bounds.Max.X; x++ {
				// RGBAAt returns values already scaled to 16-bit (0-0xFFFF)
				r, g, b, a := src.RGBAAt(x, y).RGBA()
				rgba64Img.SetRGBA64(x, y, color.RGBA64{R: uint16(r), G: uint16(g), B: uint16(b), A: uint16(a)})
			}
		}
		return rgba64Img, nil

	// Add cases for NRGBA, NRGBA64 etc. if needed

	default:
		err := fmt.Errorf("unsupported image type for RGBA64 conversion: %T", img)
		log.Warn("ConvertToRGBA64 failed", slog.Any("error", err))
		return nil, err
	}
}
