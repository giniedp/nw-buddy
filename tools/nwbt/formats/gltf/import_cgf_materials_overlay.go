package gltf

import (
	"fmt"
	"image/color"
	"log/slog"
	"math"
	"nw-buddy/tools/formats/dds"
	"nw-buddy/tools/formats/image"
	"nw-buddy/tools/formats/mtl"

	"github.com/qmuntal/gltf"
)

// overlayMask are the public params of the %OVERLAY_MASK (CharacterMasking.cfi): the colors of an armor appearance
// and its dyes per mask channel, gloss and specular color by the mask's alpha. Colors are linear, as the viewer passes
// them to the shader (glib nw-viewer material/appearance.ts).
type overlayMask struct {
	mask      *mtl.Texture
	colors    [3][3]float64
	overrides [3]float64
	strengths [3]float64
	gloss     float64
	shift     float64
	specColor [3]float64
	specMix   float64
}

// key is the overlay part of a bake ref. Without the mask pointer: an address differs per run
func (o overlayMask) key() string {
	return fmt.Sprint(o.colors, o.overrides, o.strengths, o.gloss, o.shift, o.specColor, o.specMix)
}

// overlayMaskOf is the overlay of an Illum material with %OVERLAY_MASK and its mask ($Custom), false without
func overlayMaskOf(p pbrInputs) (overlayMask, bool) {
	result := overlayMask{}
	if (p.shader != "illum" && p.shader != "illum_oceansplash") || !p.flags["OVERLAY_MASK"] {
		return result, false
	}
	result.mask = p.tex(mtl.MtlMap_Custom)
	if result.mask == nil {
		return result, false
	}
	color3 := func(name string) [3]float64 {
		c := p.paramVec(name, [4]float32{1, 1, 1, 1})
		return [3]float64{float64(c[0]), float64(c[1]), float64(c[2])}
	}
	for i, channel := range []string{"R", "G", "B"} {
		result.colors[i] = color3("Mask_" + channel + "_Color")
		result.overrides[i] = float64(p.param("Mask_"+channel+"_Override", 0))
		result.strengths[i] = float64(p.param("Mask_"+channel, 0))
	}
	result.gloss = float64(p.param("Mask_A_Gloss", 0))
	result.shift = float64(p.param("Mask_A_GlossShift", 0.5))
	result.specColor = color3("Mask_A_SpecColor")
	result.specMix = float64(p.param("Mask_A_SpecColor_Override", 0))
	return result, true
}

// overlayAlbedo is the baked base color of a material with an overlay, nil without one or when it can't be baked
func (doc *Document) overlayAlbedo(diffuse *mtl.Texture, p pbrInputs, o overlayMask, ok bool) *gltf.Texture {
	if !ok {
		return nil
	}
	return doc.bakeOverlayAlbedo(diffuse, [3]float32{p.diffuse[0], p.diffuse[1], p.diffuse[2]}, o)
}

// overlayRoughness is the baked roughness of a material with an overlay that shifts the gloss, nil else
func (doc *Document) overlayRoughness(smoothness *mtl.Texture, p pbrInputs, o overlayMask, ok bool) *gltf.Texture {
	if !ok {
		return nil
	}
	return doc.bakeOverlayRoughness(smoothness, p.gloss, o)
}

// albedo applies the mask colors to a linear albedo (applyOverlayMask of the viewer)
func (o overlayMask) albedo(albedo [3]float64, mask color.NRGBA) [3]float64 {
	lum := albedo[0]*0.2125 + albedo[1]*0.7154 + albedo[2]*0.0721
	weights := [3]float64{float64(mask.R) / 255, float64(mask.G) / 255, float64(mask.B) / 255}
	result := albedo
	for i := range 3 {
		amount := weights[i] * o.strengths[i]
		if amount <= 0 {
			continue
		}
		for c := range 3 {
			color := o.colors[i][c]
			// overrides are squared, the game found them too bright
			dyed := mix(overlayBlend(lum, color), color*color, o.overrides[i])
			result[c] = mix(result[c], dyed, amount)
		}
	}
	return result
}

// gloss applies the gloss shift of the mask's alpha: 0.5 is neutral, 0 pulls to zero, 1 to full gloss
func (o overlayMask) shiftGloss(gloss float64, mask color.NRGBA) float64 {
	shifted := mix(0, gloss, saturate(o.shift/0.5))
	shifted = mix(shifted, 1, saturate((o.shift-0.5)/0.5))
	return mix(gloss, shifted, float64(mask.A)/255*o.gloss)
}

// specular mixes a linear specular color towards the mask's specular color by its alpha
func (o overlayMask) specular(spec [3]float64, mask color.NRGBA) [3]float64 {
	amount := float64(mask.A) / 255 * o.specMix
	return [3]float64{mix(spec[0], o.specColor[0], amount), mix(spec[1], o.specColor[1], amount), mix(spec[2], o.specColor[2], amount)}
}

// bakeOverlayAlbedo bakes the base color with the overlay: diffuse map (sRGB) × diffuse color, masked, sRGB again.
// The diffuse alpha stays. Returns nil when the images can't be loaded, the caller keeps the plain mapping.
func (doc *Document) bakeOverlayAlbedo(diffuse *mtl.Texture, diffuseColor [3]float32, o overlayMask) *gltf.Texture {
	if diffuse == nil {
		return nil
	}
	ref := bakeRef(diffuse, "overlay", fmt.Sprint(diffuseColor), o.key(), o.mask.File, o.mask.AssetId)
	tex, err := doc.loadOrStoreBake(doc.LoadOrStoreSampler(diffuse), ref, true, func() ([]byte, error) {
		base, mask, err := doc.loadPair(diffuse, o.mask)
		if err != nil {
			return nil, err
		}
		baked, err := image.MixPngOnto(base, mask, func(c, m color.NRGBA) color.NRGBA {
			albedo := [3]float64{
				srgbToLinear(c.R) * float64(diffuseColor[0]),
				srgbToLinear(c.G) * float64(diffuseColor[1]),
				srgbToLinear(c.B) * float64(diffuseColor[2]),
			}
			albedo = o.albedo(albedo, m)
			return color.NRGBA{linearToSrgb(albedo[0]), linearToSrgb(albedo[1]), linearToSrgb(albedo[2]), c.A}
		})
		if err != nil {
			return nil, err
		}
		return baked, nil
	})
	if err != nil {
		slog.Warn("overlay albedo not baked", "file", diffuse.File, "err", err)
		return nil
	}
	return tex
}

// bakeOverlaySpecular bakes the specular color with the overlay: specular map (sRGB, white without) × f0, masked, sRGB
func (doc *Document) bakeOverlaySpecular(specMap *mtl.Texture, f0 [3]float32, o overlayMask) *gltf.Texture {
	source := specMap
	if source == nil {
		// the mask carries the resolution, the specular is the f0 alone
		source = o.mask
	}
	ref := bakeRef(source, "overlayspec", fmt.Sprint(f0), o.key(), o.mask.File, o.mask.AssetId, fmt.Sprint(specMap == nil))
	tex, err := doc.loadOrStoreBake(doc.LoadOrStoreSampler(source), ref, true, func() ([]byte, error) {
		base, mask, err := doc.loadPair(source, o.mask)
		if err != nil {
			return nil, err
		}
		baked, err := image.MixPngOnto(base, mask, func(c, m color.NRGBA) color.NRGBA {
			spec := [3]float64{float64(f0[0]), float64(f0[1]), float64(f0[2])}
			if specMap != nil {
				spec = [3]float64{spec[0] * srgbToLinear(c.R), spec[1] * srgbToLinear(c.G), spec[2] * srgbToLinear(c.B)}
			}
			spec = o.specular(spec, m)
			return color.NRGBA{linearToSrgb(spec[0]), linearToSrgb(spec[1]), linearToSrgb(spec[2]), 255}
		})
		if err != nil {
			return nil, err
		}
		return baked, nil
	})
	if err != nil {
		slog.Warn("overlay specular not baked", "file", source.File, "err", err)
		return nil
	}
	return tex
}

// bakeOverlayRoughness bakes roughness = 1 − shifted(factor × smoothness) into G of a metallicRoughness texture, the
// gloss shift by the mask's alpha (see bakeRoughness)
func (doc *Document) bakeOverlayRoughness(smoothness *mtl.Texture, factor float32, o overlayMask) *gltf.Texture {
	if smoothness == nil || o.gloss <= 0 {
		return nil
	}
	ref := bakeRef(smoothness, "overlayroughness", fmt.Sprint(factor), o.key(), o.mask.File, o.mask.AssetId)
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
		maskImg, err := doc.ResolveAndLoadImage(o.mask)
		if err != nil {
			return nil, err
		}
		if maskImg == nil || maskImg.Data == nil {
			return nil, fmt.Errorf("mask image not loaded")
		}
		baked, err := image.MixPngOnto(data, maskImg.Data, func(c, m color.NRGBA) color.NRGBA {
			gloss := o.shiftGloss(float64(factor)*float64(c.R)/255, m)
			return color.NRGBA{R: 255, G: unorm8(1 - gloss), B: 0, A: 255}
		})
		if err != nil {
			return nil, err
		}
		return baked, nil
	})
	if err != nil {
		slog.Warn("overlay roughness not baked", "file", smoothness.File, "err", err)
		return nil
	}
	return tex
}

// loadPair loads the png bytes of a texture and of the mask
func (doc *Document) loadPair(source, mask *mtl.Texture) ([]byte, []byte, error) {
	sourceImg, err := doc.ResolveAndLoadImage(source)
	if err != nil {
		return nil, nil, err
	}
	if sourceImg == nil || sourceImg.Data == nil {
		return nil, nil, fmt.Errorf("image not loaded: %s", source.File)
	}
	maskImg, err := doc.ResolveAndLoadImage(mask)
	if err != nil {
		return nil, nil, err
	}
	if maskImg == nil || maskImg.Data == nil {
		return nil, nil, fmt.Errorf("mask image not loaded: %s", mask.File)
	}
	return sourceImg.Data, maskImg.Data, nil
}

// getOverlayBlend of the shaders: multiply below a base of 0.5, screen above
func overlayBlend(base, top float64) float64 {
	if base < 0.5 {
		return 2 * base * top
	}
	return 1 - 2*(1-base)*(1-top)
}

func mix(a, b, t float64) float64 {
	return a + (b-a)*t
}

func saturate(v float64) float64 {
	return min(max(v, 0), 1)
}

func srgbToLinear(v uint8) float64 {
	c := float64(v) / 255
	if c <= 0.04045 {
		return c / 12.92
	}
	return math.Pow((c+0.055)/1.055, 2.4)
}

func linearToSrgb(v float64) uint8 {
	c := saturate(v)
	if c <= 0.0031308 {
		return unorm8(c * 12.92)
	}
	return unorm8(1.055*math.Pow(c, 1/2.4) - 0.055)
}
