package gltf

import (
	"bytes"
	"log/slog"
	"nw-buddy/tools/formats/image"
	"nw-buddy/tools/formats/mtl"

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
	candidates := []string{texture.File, texture.AssetId}
	for _, file := range candidates {
		if file == "" {
			continue
		}
		tex, err := c.LoadTextureFunc(file, func() ([]byte, error) {
			img, err := c.ImageLoader.LoadImage(file)
			if err != nil {
				return nil, err
			}
			return img.Data, nil
		})
		if err != nil {
			slog.Warn("texture image not loaded", "file", file, "err", err)
		} else if tex != nil {
			return tex
		}
	}
	return nil
}

func (c *Document) LoadTextureFunc(key string, loader func() ([]byte, error)) (*gltf.Texture, error) {
	if key == "" {
		return nil, nil
	}
	for _, texture := range c.Textures {
		k, _ := ExtrasLoad[string](texture.Extras, "textureKey")
		if key == k {
			return texture, nil
		}
	}

	img, err := loader()
	if err != nil {
		return nil, err
	}
	index, err := modeler.WriteImage(c.Document, key, "image/png", bytes.NewBuffer(img))
	if err != nil {
		return nil, err
	}
	texture := &gltf.Texture{
		Name:   key,
		Source: gltf.Index(index),
		Extras: ExtrasStore(make(map[string]any), "textureKey", key),
	}
	c.Textures = append(c.Textures, texture)
	return texture, nil
}

func (c *Document) LoadTextureImage(texture *mtl.Texture) (*image.LoadedImage, error) {
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
	if img == nil || img.BufferView == nil {
		return nil, nil
	}

	view := c.BufferViews[*img.BufferView]
	if view == nil {
		return nil, nil
	}
	return modeler.ReadBufferView(c.Document, view)
}
