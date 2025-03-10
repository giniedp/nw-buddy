package gltf

import (
	"bytes"
	"log/slog"
	"nw-buddy/tools/formats/image"
	"nw-buddy/tools/formats/mtl"
	"os"
	"slices"

	"github.com/qmuntal/gltf"
	"github.com/qmuntal/gltf/modeler"
)

type Converter struct {
	Doc            *gltf.Document
	IgnoreSkin     bool
	IgnoreGeometry bool
	ImageLoader    image.Loader
}

func NewConverter() *Converter {
	return &Converter{
		Doc: gltf.NewDocument(),
	}
}

func (c *Converter) AppendMesh(mesh *gltf.Mesh) *int {
	c.Doc.Meshes = append(c.Doc.Meshes, mesh)
	return gltf.Index(len(c.Doc.Meshes) - 1)
}

func (c *Converter) AppendNode(node *gltf.Node) *int {
	c.Doc.Nodes = append(c.Doc.Nodes, node)
	index := gltf.Index(len(c.Doc.Nodes) - 1)
	return index
}

func (c *Converter) NewNode() (*gltf.Node, *int) {
	node := &gltf.Node{}
	index := c.AppendNode(node)
	return node, index
}

func (c *Converter) NodeIndex(node *gltf.Node) int {
	return slices.Index(c.Doc.Nodes, node)
}

func (c *Converter) Save(file string) error {
	f, err := os.Create(file)
	if err != nil {
		return err
	}
	e := gltf.NewEncoder(f)
	e.SetJSONIndent("", "\t")
	e.AsBinary = false
	return e.Encode(c.Doc)
}

func (c *Converter) DefaultScene() *gltf.Scene {
	return c.Doc.Scenes[*c.Doc.Scene]
}

func (c *Converter) FindMaterialByRef(ref string) *gltf.Material {
	index := slices.IndexFunc(c.Doc.Materials, func(it *gltf.Material) bool {
		if lookup, ok := it.Extras.(map[string]any); ok {
			if refId, ok := lookup["refId"].(string); ok {
				return refId == ref
			}
		}
		return false
	})
	if index == -1 {
		return nil
	}
	return c.Doc.Materials[index]
}

func (c *Converter) FindOrAddMaterial(material mtl.Material) *gltf.Material {
	refId, _ := material.CalculateHash()
	gltfMtl := c.FindMaterialByRef(refId)
	if gltfMtl != nil {
		return gltfMtl
	}
	gltfMtl = &gltf.Material{}
	gltfMtl.Name = material.Name
	gltfMtl.Extras = map[string]any{"refId": refId, "mtl": material}
	c.Doc.Materials = append(c.Doc.Materials, gltfMtl)
	return gltfMtl
}

func (c *Converter) LoadTexture(texture *mtl.Texture) *gltf.Texture {
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

func (c *Converter) LoadTextureFunc(key string, loader func() ([]byte, error)) (*gltf.Texture, error) {
	if key == "" {
		return nil, nil
	}
	for _, texture := range c.Doc.Textures {
		k, _ := extrasLoad[string](texture.Extras, "textureKey")
		if key == k {
			return texture, nil
		}
	}

	img, err := loader()
	if err != nil {
		return nil, err
	}
	index, err := modeler.WriteImage(c.Doc, key, "image/png", bytes.NewBuffer(img))
	if err != nil {
		return nil, err
	}
	texture := &gltf.Texture{
		Name:   key,
		Source: gltf.Index(index),
		Extras: extrasStore(make(map[string]any), "textureKey", key),
	}
	c.Doc.Textures = append(c.Doc.Textures, texture)
	return texture, nil
}

func (c *Converter) LoadTextureImage(texture *mtl.Texture) (*image.LoadedImage, error) {
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

func (c *Converter) ReadTextureImage(t *gltf.Texture) ([]byte, error) {
	if t.Source == nil {
		return nil, nil
	}

	img := c.Doc.Images[*t.Source]
	if img == nil || img.BufferView == nil {
		return nil, nil
	}

	view := c.Doc.BufferViews[*img.BufferView]
	if view == nil {
		return nil, nil
	}
	return modeler.ReadBufferView(c.Doc, view)
}

func extrasLoad[T any](data any, key string) (value T, ok bool) {
	lookup, ok := data.(map[string]any)
	if !ok {
		return value, false
	}
	v, ok := lookup[key]
	if !ok {
		return value, false
	}
	return v.(T), true
}

func extrasStore[T any](data any, key string, value T) any {
	if data == nil {
		data = map[string]any{}
	}
	lookup, ok := data.(map[string]any)
	if !ok {
		return lookup
	}
	lookup[key] = value
	return lookup
}

func extrasDelete(data any, key string) any {
	if data == nil {
		return data
	}
	lookup, ok := data.(map[string]any)
	if !ok {
		return lookup
	}
	delete(lookup, key)
	return lookup
}
