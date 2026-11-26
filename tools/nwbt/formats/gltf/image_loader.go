package gltf

import (
	"bytes"
	"fmt"
	"log/slog"
	"nw-buddy/tools/formats/dds"
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

func (doc *Document) LoadOrStoreMtlTexture(texture *mtl.Texture, alpha ...bool) *gltf.Texture {

	if texture == nil {
		return nil
	}

	if doc.ImageLoader == nil {
		return nil
	}

	readAlpha := len(alpha) > 0 && alpha[0]
	fileIsAlpha := false
	file := resolveFile(doc.ImageLoader, texture.AssetId, texture.File)
	if file == nil {
		return nil
	}
	if readAlpha {
		if f := resolveFile(doc.ImageLoader, utils.ReplaceExt(file.Path(), ".dds.a")); f != nil {
			file = f
			fileIsAlpha = true
		}
	}
	sampler := doc.LoadOrStoreSampler(texture)
	// the source asset of the loader (a split mip part loads its base .dds), known before the (maybe background) load
	source := file.Path()
	if dds.IsDDSSplitPart(source) {
		source = utils.ReplaceExt(source, "")
	}
	tex, err := doc.loadOrStoreTexture(sampler, file.Path(), func() ([]byte, error) {
		img, err := doc.ImageLoader.LoadImage(file.Path())
		if err != nil {
			return nil, err
		}
		if readAlpha && img.Alpha != nil {
			return img.Alpha, nil
		}
		return img.Data, nil
	}, nil, true)
	if tex != nil {
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

func (doc *Document) LoadOrStoreTexture(sampler *int, imageRef string, loadBytes func() ([]byte, error)) (*gltf.Texture, error) {
	return doc.loadOrStoreTexture(sampler, imageRef, loadBytes, nil, false)
}

// loadOrStoreBake stores the texture of a bake. bake returns png bytes and runs now, so the caller can fall back on
// its error. The encode runs in the background with AsyncImages.
func (doc *Document) loadOrStoreBake(sampler *int, imageRef string, srgb bool, bake func() ([]byte, error)) (*gltf.Texture, error) {
	return doc.loadOrStoreTexture(sampler, imageRef, bake, func(data []byte) ([]byte, error) {
		return doc.encodeBake(data, srgb)
	}, true)
}

// loadOrStoreTexture is LoadOrStoreTexture with an optional encode of the loaded bytes. With async (and AsyncImages)
// the encode runs in the background, without encode the load does.
func (doc *Document) loadOrStoreTexture(sampler *int, imageRef string, loadBytes func() ([]byte, error), encode func([]byte) ([]byte, error), async bool) (*gltf.Texture, error) {
	textureRef := imageRef
	index, err := doc.loadOrStoreImage(imageRef, loadBytes, encode, async)
	if err != nil {
		return nil, err
	}

	// imageRef may be altered by LoadOrStoreImage
	// grab actual imageRef and use it as textureRef
	img := doc.Images[*index]
	if ref, ok := ExtrasLoad[string](img.Extras, ExtraKeyRefID); ok {
		textureRef = ref
	}

	// sampler may be non default and is expected to have an own ref id
	// append it to textureRef to make unique texture/sampler pair
	if sampler != nil {
		s := doc.Samplers[*sampler]
		if samplerRef, ok := ExtrasLoad[string](s.Extras, ExtraKeyRefID); ok {
			textureRef = fmt.Sprintf("%s?sampler=%s", textureRef, samplerRef)
		}
	}

	for _, texture := range doc.Textures {
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
	doc.Textures = append(doc.Textures, texture)
	return texture, nil
}

func (doc *Document) LoadOrStoreImage(imageRef string, loadBytes func() ([]byte, error)) (*int, error) {
	return doc.loadOrStoreImage(imageRef, loadBytes, nil, false)
}

func (doc *Document) loadOrStoreImage(imageRef string, loadBytes func() ([]byte, error), encode func([]byte) ([]byte, error), async bool) (*int, error) {
	if imageRef == "" {
		return nil, nil
	}

	// the converter's target format, png otherwise (also the format of the bakes, see encodeBake)
	format := doc.imageFormat()
	mimeType := format.MimeType()
	if doc.ImageLinker != nil {
		// linked: the file name gets the format's extension; embedded images need no file name
		imageRef = toFormatRef(imageRef, format)
	}

	for i, image := range doc.Images {
		if k, _ := ExtrasLoad[string](image.Extras, ExtraKeyRefID); k == imageRef {
			return &i, nil
		}
	}

	if doc.ImageLinker != nil && doc.LinkedImages.Written(imageRef) {
		// another document wrote it: no load, bake or encode
		return doc.appendLinkedImage(imageRef, mimeType, doc.ImageLinker.LinkedURI(doc.TargetFile, imageRef)), nil
	}

	if async && doc.AsyncImages && doc.ImageLinker != nil {
		if encode == nil {
			return doc.storeImageAsync(imageRef, mimeType, loadBytes), nil
		}
		// the load (a bake) runs now, so the caller can fall back on its error
		data, err := loadBytes()
		if err != nil {
			return nil, err
		}
		return doc.storeImageAsync(imageRef, mimeType, func() ([]byte, error) {
			return encodeInSlot(encode, data)
		}), nil
	}

	imageData, err := loadBytes()
	if err != nil {
		return nil, err
	}
	if encode != nil {
		imageData, err = encodeInSlot(encode, imageData)
		if err != nil {
			return nil, err
		}
	}

	if doc.ImageLinker == nil {
		if index, err := modeler.WriteImage(doc.Document, imageRef, mimeType, bytes.NewBuffer(imageData)); err != nil {
			return nil, err
		} else {
			doc.Images[index].Extras = ExtrasStore(doc.Images[index].Extras, ExtraKeyRefID, imageRef)
			return &index, nil
		}
	}

	err = doc.LinkedImages.Write(imageRef, func() error {
		_, err := doc.ImageLinker.WriteLinkedResource(doc.TargetFile, imageRef, imageData)
		return err
	})
	if err != nil {
		slog.Warn("Linked image not written", "file", imageRef, "err", err)
	}
	return doc.appendLinkedImage(imageRef, mimeType, doc.ImageLinker.LinkedURI(doc.TargetFile, imageRef)), nil
}

func (doc *Document) appendLinkedImage(imageRef string, mimeType string, uri string) *int {
	doc.Images = append(doc.Images, &gltf.Image{
		URI:      uri,
		MimeType: mimeType,
		Extras: map[string]any{
			ExtraKeyRefID: imageRef,
		},
	})
	index := len(doc.Images) - 1
	return &index
}

// encodeInSlot runs an encode (a bake to the document's format) in one of the image conversion slots
func encodeInSlot(encode func([]byte) ([]byte, error), data []byte) ([]byte, error) {
	return image.WithConvertSlot(func() ([]byte, error) {
		return encode(data)
	})
}

func (doc *Document) LoadOrStoreSampler(tex *mtl.Texture) *int {
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
	for i, sampler := range doc.Samplers {
		if k, _ := ExtrasLoad[string](sampler.Extras, ExtraKeyRefID); k == ref {
			return &i
		}
	}
	samplerIndex := len(doc.Samplers)
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
	doc.Samplers = append(doc.Samplers, sampler)
	return &samplerIndex
}

// ResolveAndLoadImage loads a texture for the bakes: png bytes, from BakeImageLoader when set
func (doc *Document) ResolveAndLoadImage(texture *mtl.Texture) (*image.LoadedImage, error) {
	loader := doc.BakeImageLoader
	if loader == nil {
		loader = doc.ImageLoader
	}
	if file := resolveFile(loader, texture.AssetId, texture.File); file != nil {
		return loader.LoadImage(file.Path())
	}
	return nil, nil
}

// imageFormat is the format of the images in the document: the converter's target, png otherwise
func (doc *Document) imageFormat() image.Format {
	if conv, ok := doc.ImageLoader.(image.LoaderWithConverter); ok && conv.Converter != nil {
		return conv.Converter.TargetFormat()
	}
	return image.FormatPNG
}

// storeImageAsync adds a linked image now and loads + writes it in the background, the uri is set once written
// (WaitImages). A failed load leaves the image without uri and logs a warning. The conversions bound themselves
// (image.WithConvertSlot): a load that waits for a conversion of another document holds no slot.
func (doc *Document) storeImageAsync(imageRef string, mimeType string, loadBytes func() ([]byte, error)) *int {
	img := &gltf.Image{
		MimeType: mimeType,
		Extras: map[string]any{
			ExtraKeyRefID: imageRef,
		},
	}
	doc.Images = append(doc.Images, img)
	index := len(doc.Images) - 1
	doc.pendingImages.Add(1)
	go func() {
		defer doc.pendingImages.Done()
		err := doc.LinkedImages.Write(imageRef, func() (err error) {
			defer utils.HandleRecover(&err)
			data, err := loadBytes()
			if err != nil {
				return fmt.Errorf("image not loaded: %w", err)
			}
			_, err = doc.ImageLinker.WriteLinkedResource(doc.TargetFile, imageRef, data)
			return err
		})
		if err != nil {
			slog.Warn("Linked image not written", "file", imageRef, "err", err)
			return
		}
		img.URI = doc.ImageLinker.LinkedURI(doc.TargetFile, imageRef)
	}()
	return &index
}

// WaitImages waits for the background image loads (AsyncImages)
func (doc *Document) WaitImages() {
	doc.pendingImages.Wait()
}

// encodeBake converts the png bytes of a bake to the image format of the document (DDS: BC7). srgb tells whether the
// bake holds color (emissive) or data (roughness).
func (doc *Document) encodeBake(data []byte, srgb bool) ([]byte, error) {
	target := doc.imageFormat()
	if target != image.FormatDDS && target != image.FormatKTX2 && target != image.FormatWEBP {
		return data, nil
	}
	format := "BC7_UNORM"
	if srgb {
		format = "BC7_UNORM_SRGB"
	}
	// KTX2: R8G8B8A8_SRGB or _UNORM by srgb (image.ConvertPNG)
	return image.ConvertPNG(data, target, image.WithDDSFormat(format), image.WithSRGB(srgb))
}

func (doc *Document) LoadTextureBytes(t *gltf.Texture) ([]byte, error) {
	if t.Source == nil {
		return nil, nil
	}
	return doc.LoadImageBytes(doc.Images[*t.Source])
}

func (doc *Document) LoadImageBytes(img *gltf.Image) ([]byte, error) {
	if img == nil {
		return nil, nil
	}

	if img.BufferView != nil {
		if view := doc.BufferViews[*img.BufferView]; view != nil {
			return modeler.ReadBufferView(doc.Document, view)
		}
		return nil, nil
	}

	// a background image gets its uri once written
	doc.WaitImages()
	if img.URI != "" && doc.ImageLinker != nil {
		return doc.ImageLinker.ReadLinkedResource(doc.TargetFile, img.URI)
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
	if tex.TexMod.RotateW != nil && *tex.TexMod.RotateW != 0 {
		// RotateW is in degrees (the engine and the viewer convert with DEGREE_TO_RAD), glTF wants radians.
		// Exact only for uniform tiling: the engine rotates before the scale, KHR_texture_transform after it.
		texTransform.Rotation = float64(*tex.TexMod.RotateW) * 3.14159265358979323846 / 180.0
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
