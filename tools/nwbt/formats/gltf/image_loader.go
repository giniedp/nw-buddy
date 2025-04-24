package gltf

import (
	"bytes"
	"log/slog"
	"nw-buddy/tools/formats/image"
	"nw-buddy/tools/formats/mtl"
	"nw-buddy/tools/utils"
	"strings"

	"github.com/qmuntal/gltf"
	"github.com/qmuntal/gltf/modeler"
)

func (c *Document) LoadTexture(texture *mtl.Texture) *gltf.Texture {
	if texture == nil {
		return nil
	}
	if c.ImageLoader == nil {
		return nil
	}
	candidates := make([]string, 0)
	candidates = utils.AppendUniqNoZero(candidates, texture.File)
	candidates = utils.AppendUniqNoZero(candidates, texture.AssetId)
	if texture.File != "" {
		candidates = utils.AppendUniqNoZero(candidates, utils.ReplaceExt(texture.File, ".dds"))
	}
	errors := make([]error, 0)
	for _, fileOrAsset := range candidates {
		var source string
		tex, err := c.LoadTextureFunc(fileOrAsset, func() ([]byte, error) {
			img, err := c.ImageLoader.LoadImage(fileOrAsset)
			if err != nil {
				return nil, err
			}
			source = img.Source
			return img.Data, nil
		})
		if tex != nil && source != "" {
			tex.Extras = ExtrasStore(tex.Extras, ExtraKeySource, source)
		}
		if tex != nil {
			return tex
		}
		if err != nil {
			errors = append(errors, err)
		}
	}
	if len(errors) > 0 {
		slog.Warn("texture image not loaded", "tried", candidates, "errors", errors)
	}
	return nil
}

func (c *Document) LoadTextureFunc(ref string, loader func() ([]byte, error)) (*gltf.Texture, error) {
	if ref == "" {
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
			ref = toFormatRef(ref, format)
		} else {
			// image will be linked to the gltf file
			// assumed to be converted to png
			ref = toFormatRef(ref, ".png")
		}
	}

	for _, texture := range c.Textures {
		if k, _ := ExtrasLoad[string](texture.Extras, ExtraKeyRefID); k == ref {
			return texture, nil
		}
	}

	imageData, err := loader()
	if err != nil {
		return nil, err
	}

	var texIndex int = -1
	if c.ImageLinker == nil {
		//
		if index, err := modeler.WriteImage(c.Document, ref, mimeType, bytes.NewBuffer(imageData)); err != nil {
			return nil, err
		} else {
			texIndex = index
		}
	} else {
		imageUri, err := c.ImageLinker.WriteLinkedResource(c.TargetFile, ref, imageData)
		if err != nil {
			return nil, err
		}
		c.Images = append(c.Images, &gltf.Image{
			URI:      imageUri,
			MimeType: mimeType,
		})
		texIndex = len(c.Images) - 1
	}

	texture := &gltf.Texture{
		Name:   ref,
		Source: gltf.Index(texIndex),
		Extras: map[string]any{
			ExtraKeyRefID: ref,
		},
	}
	c.Textures = append(c.Textures, texture)
	return texture, nil
}

func (c *Document) LoadImage(texture *mtl.Texture) (*image.LoadedImage, error) {
	candidates := []string{texture.File, texture.AssetId}
	for _, file := range candidates {
		if file == "" {
			continue
		}
		img, err := c.ImageLoader.LoadImage(file)
		if err != nil {
			slog.Warn("texture image not loaded", "file", file, "err", err)
		} else if img != nil {
			return img, nil
		}
	}
	return nil, nil
}

func (c *Document) ReadTextureImage(t *gltf.Texture) ([]byte, error) {
	if t.Source == nil {
		return nil, nil
	}

	img := c.Images[*t.Source]
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
