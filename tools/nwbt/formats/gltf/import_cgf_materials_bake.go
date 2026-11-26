package gltf

import (
	"fmt"
	"image/color"
	"log/slog"
	"math"
	"nw-buddy/tools/formats/dds"
	"nw-buddy/tools/formats/image"
	"nw-buddy/tools/formats/mtl"
	"path"
	"strings"

	"github.com/qmuntal/gltf"
)

// Texture bakes of the glTF material mapping. They work on the png bytes of the image loader as stored (no color space conversion), good enough for a preview.

// bakeRoughness bakes glTF roughness = 1 − factor × smoothness into G of a metallicRoughness texture (B = metallic = 0).
// Returns nil when the smoothness map can't be loaded, the caller then uses roughnessFactor = 1 − factor.
func (doc *Document) bakeRoughness(smoothness *mtl.Texture, factor float32) *gltf.Texture {
	if smoothness == nil {
		return nil
	}
	ref := bakeRef(smoothness, "roughness", fmt.Sprint(factor))
	tex, err := doc.loadOrStoreBake(doc.LoadOrStoreSampler(smoothness), ref, false, func() ([]byte, error) {
		img, err := doc.ResolveAndLoadImage(smoothness)
		if err != nil {
			return nil, err
		}
		if img == nil || img.Data == nil {
			return nil, fmt.Errorf("smoothness image not loaded")
		}
		data := img.Data
		// normal maps keep the smoothness in the attached alpha (_ddna.dds.a), the engine binds that for the slot
		if dds.IsNormalMap(img.Source) && img.Alpha != nil {
			data = img.Alpha
		}
		baked, err := image.MapPngImage(data, func(c color.NRGBA) color.NRGBA {
			roughness := 1 - float64(factor)*float64(c.R)/255
			return color.NRGBA{R: 255, G: unorm8(roughness), B: 0, A: 255}
		})
		if err != nil {
			return nil, err
		}
		return baked, nil
	})
	if err != nil {
		slog.Warn("roughness not baked", "file", smoothness.File, "err", err)
		return nil
	}
	return tex
}

// bakeEmissive bakes emit.rgb · lum(emit.rgb)^(gamma − 1) · decal.rgb · emit.a, the emittance of the shaders
// without the material color. decal is the emissive intensity map (Decal slot) and may be nil.
// Returns nil when the images can't be loaded.
func (doc *Document) bakeEmissive(emit, decal *mtl.Texture, gamma float32) *gltf.Texture {
	if emit == nil {
		return nil
	}
	parts := []string{fmt.Sprint(gamma)}
	if decal != nil {
		parts = append(parts, decal.File, decal.AssetId)
	}
	ref := bakeRef(emit, "emissive", parts...)
	shade := func(e color.NRGBA, d color.NRGBA) color.NRGBA {
		r, g, b := float64(e.R)/255, float64(e.G)/255, float64(e.B)/255
		scale := float64(e.A) / 255
		if gamma != 1 {
			lum := max(r*0.2126+g*0.7152+b*0.0722, 1e-6)
			scale *= math.Pow(lum, float64(gamma)-1)
		}
		return color.NRGBA{
			R: unorm8(r * scale * float64(d.R) / 255),
			G: unorm8(g * scale * float64(d.G) / 255),
			B: unorm8(b * scale * float64(d.B) / 255),
			A: 255,
		}
	}
	white := color.NRGBA{255, 255, 255, 255}
	tex, err := doc.loadOrStoreBake(doc.LoadOrStoreSampler(emit), ref, true, func() ([]byte, error) {
		emitImg, err := doc.ResolveAndLoadImage(emit)
		if err != nil {
			return nil, err
		}
		if emitImg == nil || emitImg.Data == nil {
			return nil, fmt.Errorf("emittance image not loaded")
		}
		var baked []byte
		if decal == nil {
			baked, err = image.MapPngImage(emitImg.Data, func(c color.NRGBA) color.NRGBA { return shade(c, white) })
		} else {
			var decalImg *image.LoadedImage
			decalImg, err = doc.ResolveAndLoadImage(decal)
			if err != nil {
				return nil, err
			}
			if decalImg == nil || decalImg.Data == nil {
				return nil, fmt.Errorf("emissive intensity image not loaded")
			}
			baked, err = image.MixPngImages(emitImg.Data, decalImg.Data, shade)
		}
		if err != nil {
			return nil, err
		}
		return baked, nil
	})
	if err != nil {
		slog.Warn("emissive not baked", "file", emit.File, "err", err)
		return nil
	}
	return tex
}

// bakeRef names a baked image after its main source, unique for the bake kind and all other inputs
func bakeRef(source *mtl.Texture, kind string, inputs ...string) string {
	name := strings.TrimSuffix(source.File, path.Ext(source.File))
	if name == "" {
		name = strings.Trim(source.AssetId, "{}")
	}
	key := strings.Join(append([]string{source.File, source.AssetId}, inputs...), "|")
	return fmt.Sprintf("%s_%s_%s", name, kind, hashString(key)[:8])
}

func unorm8(v float64) uint8 {
	return uint8(math.Round(min(max(v, 0), 1) * 255))
}
