package gltf

import (
	"bytes"
	"fmt"
	"log/slog"
	"nw-buddy/tools/formats/image"
	"nw-buddy/tools/formats/mtl"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils"
	"strconv"
	"strings"

	"github.com/qmuntal/gltf"
	"github.com/qmuntal/gltf/ext/texturetransform"
	"github.com/qmuntal/gltf/modeler"
)

func (c *Document) LoadOrStoreMtlTexture(texture *mtl.Texture, alpha ...bool) *gltf.Texture {

	if texture == nil {
		return nil
	}

	if c.ImageLoader == nil {
		return nil
	}

	readAlpha := len(alpha) > 0 && alpha[0]
	fileIsAlpha := false
	file := resolveFile(c.ImageLoader, texture.AssetId, texture.File)
	if file == nil {
		return nil
	}
	if readAlpha {
		if f := resolveFile(c.ImageLoader, utils.ReplaceExt(file.Path(), ".dds.a")); f != nil {
			file = f
			fileIsAlpha = true
		}
	}
	sampler := c.LoadOrStoreSampler(texture)
	var source string
	tex, err := c.LoadOrStoreTexture(sampler, file.Path(), func() ([]byte, error) {
		img, err := c.ImageLoader.LoadImage(file.Path())
		if err != nil {
			return nil, err
		}
		source = img.Source
		if readAlpha && img.Alpha != nil {
			return img.Alpha, nil
		}
		return img.Data, nil
	})
	if tex != nil && source != "" {
		tex.Extras = ExtrasStore(tex.Extras, ExtraKeySource, source)
		tex.Extras = ExtrasStore(tex.Extras, ExtraKeyAlpha, fileIsAlpha)
	}
	if tex != nil {
		return tex
	}
	if err != nil {
		slog.Warn("Texture not loaded", "file", file.Path(), "error", err)
	}

	return nil
}

func (c *Document) LoadOrStoreTexture(sampler *int, imageRef string, loadBytes func() ([]byte, error)) (*gltf.Texture, error) {
	textureRef := imageRef
	index, err := c.LoadOrStoreImage(imageRef, loadBytes)
	if err != nil {
		return nil, err
	}

	// imageRef may be altered by LoadOrStoreImage
	// grab actual imageRef and use it as textureRef
	img := c.Images[*index]
	if ref, ok := ExtrasLoad[string](img.Extras, ExtraKeyRefID); ok {
		textureRef = ref
	}

	// sampler may be non default and is expected to have an own ref id
	// append it to textureRef to make unique texture/sampler pair
	if sampler != nil {
		s := c.Samplers[*sampler]
		if samplerRef, ok := ExtrasLoad[string](s.Extras, ExtraKeyRefID); ok {
			textureRef = fmt.Sprintf("%s?sampler=%s", textureRef, samplerRef)
		}
	}

	for _, texture := range c.Textures {
		if ref, _ := ExtrasLoad[string](texture.Extras, ExtraKeyRefID); ref == textureRef {
			return texture, nil
		}
	}

	texture := &gltf.Texture{
		Name:   textureRef,
		Source: index,
		Extras: map[string]any{
			ExtraKeyRefID: textureRef,
		},
	}
	c.Textures = append(c.Textures, texture)
	return texture, nil
}

func (c *Document) LoadOrStoreImage(imageRef string, loadBytes func() ([]byte, error)) (*int, error) {
	if imageRef == "" {
		return nil, nil
	}

	mimeType := "image/png"
	if c.ImageLinker == nil {
		// image will be embedded in the gltf file
		// assumed to be converted to png
		// no file reference needed
	} else {
		if conv, ok := c.ImageLoader.(image.LoaderWithConverter); ok {
			// specific conversion is active
			format := conv.Converter.TargetFormat()
			mimeType = format.MimeType()
			imageRef = toFormatRef(imageRef, format)
		} else {
			// image will be linked to the gltf file
			// assumed to be converted to png
			imageRef = toFormatRef(imageRef, ".png")
		}
	}

	for i, image := range c.Images {
		if k, _ := ExtrasLoad[string](image.Extras, ExtraKeyRefID); k == imageRef {
			return &i, nil
		}
	}

	imageData, err := loadBytes()
	if err != nil {
		return nil, err
	}

	if c.ImageLinker == nil {
		if index, err := modeler.WriteImage(c.Document, imageRef, mimeType, bytes.NewBuffer(imageData)); err != nil {
			return nil, err
		} else {
			c.Images[index].Extras = ExtrasStore(c.Images[index].Extras, ExtraKeyRefID, imageRef)
			return &index, nil
		}
	}

	imageUri, err := c.ImageLinker.WriteLinkedResource(c.TargetFile, imageRef, imageData)
	if err != nil {
		slog.Warn("Linked image not written", "file", imageRef, "err", err)
	}
	c.Images = append(c.Images, &gltf.Image{
		URI:      imageUri,
		MimeType: mimeType,
		Extras: map[string]any{
			ExtraKeyRefID: imageRef,
		},
	})
	index := len(c.Images) - 1

	return &index, nil
}

func (c *Document) LoadOrStoreSampler(tex *mtl.Texture) *int {
	if tex == nil {
		return nil
	}

	magFilter := gltf.MagUndefined
	minFilter := gltf.MinUndefined
	wrapU := gltf.WrapRepeat
	wrapV := gltf.WrapRepeat

	minName := ""
	magName := ""
	wrapUName := ""
	wrapVName := ""

	isDefault := true
	if tex.Filter != nil {
		switch *tex.Filter {
		case mtl.TextureFilterPoint:
			magFilter = gltf.MagNearest
			minFilter = gltf.MinNearest
			magName = "nearest"
			minName = "nearest"
			isDefault = false
		default:
			// anything else goes to gltf default
		}
	}
	if tex.IsTileU != nil {
		switch *tex.IsTileU {
		case 0:
			wrapU = gltf.WrapClampToEdge
			wrapUName = "clamp"
			isDefault = false
		default:
			// anything else goes to gltf default
		}
	}
	if tex.IsTileV != nil {
		switch *tex.IsTileV {
		case 0:
			wrapV = gltf.WrapClampToEdge
			wrapVName = "clamp"
			isDefault = false
		default:
			// anything else goes to gltf default
		}
	}

	if isDefault {
		return nil
	}
	ref := fmt.Sprintf("%s_%s_%s_%s", magName, minName, wrapUName, wrapVName)
	for i, sampler := range c.Samplers {
		if k, _ := ExtrasLoad[string](sampler.Extras, ExtraKeyRefID); k == ref {
			return &i
		}
	}
	samplerIndex := len(c.Samplers)
	sampler := &gltf.Sampler{
		Name:      ref,
		MagFilter: magFilter,
		MinFilter: minFilter,
		WrapS:     wrapU,
		WrapT:     wrapV,
		Extras: map[string]any{
			ExtraKeyRefID: ref,
		},
	}
	c.Samplers = append(c.Samplers, sampler)
	return &samplerIndex
}

func (c *Document) ResolveAndLoadImage(texture *mtl.Texture) (*image.LoadedImage, error) {
	if file := resolveFile(c.ImageLoader, texture.AssetId, texture.File); file != nil {
		return c.ImageLoader.LoadImage(file.Path())
	}
	return nil, nil
}

func (c *Document) LoadTextureBytes(t *gltf.Texture) ([]byte, error) {
	if t.Source == nil {
		return nil, nil
	}
	return c.LoadImageBytes(c.Images[*t.Source])
}

func (c *Document) LoadImageBytes(img *gltf.Image) ([]byte, error) {
	if img == nil {
		return nil, nil
	}

	if img.BufferView != nil {
		if view := c.BufferViews[*img.BufferView]; view != nil {
			return modeler.ReadBufferView(c.Document, view)
		}
		return nil, nil
	}

	if img.URI != "" && c.ImageLinker != nil {
		return c.ImageLinker.ReadLinkedResource(c.TargetFile, img.URI)
	}
	return nil, nil
}

func toFormatRef(ref string, format image.Format) string {
	ref = strings.ReplaceAll(ref, ":", "")
	if strings.HasSuffix(ref, ".dds") || strings.HasSuffix(ref, ".tif") {
		ref = utils.ReplaceExt(ref, "")
	}
	return ref + string(format)
}

func resolveFile(loader image.Loader, file ...string) nwfs.File {
	for _, tex := range file {
		if tex == "" {
			continue
		}
		if file, _ := loader.ResolveFile(tex); file != nil {
			return file
		} else {
			slog.Warn("texture image not found", "file", tex)
		}
	}
	return nil
}

func resolveTextureTransform(tex *mtl.Texture) *texturetransform.TextureTranform {
	if tex == nil || tex.TexMod == nil {
		return nil
	}

	isZero := true
	texTransform := texturetransform.TextureTranform{
		Scale:    [2]float64{1, 1},
		Offset:   [2]float64{0, 0},
		Rotation: 0,
	}
	if tex.TexMod.OffsetU != nil {
		texTransform.Offset[0] = float64(*tex.TexMod.OffsetU)
		isZero = false
	}
	if tex.TexMod.OffsetV != nil {
		texTransform.Offset[1] = float64(*tex.TexMod.OffsetV)
		isZero = false
	}
	if tex.TexMod.TileU != nil {
		texTransform.Scale[0] = float64(*tex.TexMod.TileU)
		isZero = false
	}
	if tex.TexMod.TileV != nil {
		texTransform.Scale[1] = float64(*tex.TexMod.TileV)
		isZero = false
	}
	if tex.TexMod.RotateW != nil {
		texTransform.Rotation = float64(*tex.TexMod.RotateW) * 180.0 / 3.14159265358979323846
		isZero = false
	}

	if isZero {
		return nil
	}

	return &texTransform
}

func resolveTextureTransformPublic(param *mtl.PublicParams) *texturetransform.TextureTranform {
	if param == nil {
		return nil
	}
	hasTile := param.Has("SOURCE_2D_TILE_X")
	hasPhase := param.Has("SOURCE_2D_PHASE_X")
	if !hasTile && !hasPhase {
		return nil
	}

	texTransform := texturetransform.TextureTranform{
		Scale:  [2]float64{1, 1},
		Offset: [2]float64{0, 0},
	}
	if param.Has("SOURCE_2D_TILE_X") {
		if v1, err := strconv.ParseFloat(param.Get("SOURCE_2D_TILE_X"), 32); err == nil {
			texTransform.Scale[0] = v1
		}
		if v2, err := strconv.ParseFloat(param.Get("SOURCE_2D_TILE_Y"), 32); err == nil {
			texTransform.Scale[1] = v2
		}
	}
	if param.Has("SOURCE_2D_PHASE_X") {
		if v1, err := strconv.ParseFloat(param.Get("SOURCE_2D_PHASE_X"), 32); err == nil {
			texTransform.Offset[0] = v1
		}
		if v2, err := strconv.ParseFloat(param.Get("SOURCE_2D_PHASE_Y"), 32); err == nil {
			texTransform.Offset[1] = v2
		}
	}
	return &texTransform
}
