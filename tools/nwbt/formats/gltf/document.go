package gltf

import (
	"fmt"
	"io"
	"nw-buddy/tools/formats/image"
	"nw-buddy/tools/formats/mtl"
	"nw-buddy/tools/utils/math/mat4"
	"os"
	"path"
	"slices"

	"maps"

	"github.com/qmuntal/gltf"
)

const (
	ExtraKeyRefID        = "refId"
	ExtraKeyControllerID = "controllerId"
	ExtraKeyLimbID       = "limbId"
	ExtraKeySource       = "source"
	ExtraKeyName         = "name"
	ExtraKeyInverse      = "inverse"
	ExtraKeyAlpha        = "alpha"
)

type Document struct {
	*gltf.Document
	TargetFile  string
	ImageLoader image.Loader
	ImageLinker ImageLinker
}

func NewDocument() *Document {
	return &Document{
		Document: gltf.NewDocument(),
	}
}

func (c *Document) Save() error {
	file := c.TargetFile
	if file == "" {
		return fmt.Errorf("no target file specified")
	}
	outDir := path.Dir(file)
	if err := os.MkdirAll(outDir, os.ModePerm); err != nil {
		return err
	}

	f, err := os.Create(file)
	if err != nil {
		return err
	}
	defer f.Close()
	return c.Encode(f, path.Ext(file) == ".glb")
}

func (c *Document) Encode(f io.Writer, binary bool) error {
	e := gltf.NewEncoder(f)
	e.SetJSONIndent("", "\t")
	e.AsBinary = binary
	return e.Encode(c.Document)
}

func (d *Document) DefaultScene() *gltf.Scene {
	if d.Scene == nil {
		d.Scene = d.AppendScene(&gltf.Scene{})
	}
	return d.Scenes[*d.Scene]
}

func (c *Document) AppendScene(scene *gltf.Scene) *int {
	c.Document.Scenes = append(c.Document.Scenes, scene)
	return gltf.Index(slices.Index(c.Document.Scenes, scene))
}

func (c *Document) AppendMesh(mesh *gltf.Mesh) *int {
	c.Document.Meshes = append(c.Document.Meshes, mesh)
	return gltf.Index(slices.Index(c.Document.Meshes, mesh))
}

func (c *Document) AppendNode(node *gltf.Node) int {
	c.Document.Nodes = append(c.Document.Nodes, node)
	return slices.Index(c.Document.Nodes, node)
}

func (d *Document) NodeAddChild(parent *gltf.Node, child ...*gltf.Node) {
	for _, c := range child {
		parent.Children = append(parent.Children, slices.Index(d.Nodes, c))
	}
}

func (d *Document) NodeHasChild(parent *gltf.Node, child *gltf.Node) bool {
	return slices.Contains(parent.Children, d.NodeIndex(child))
}

func (c *Document) NewNode() (*gltf.Node, int) {
	node := &gltf.Node{}
	index := c.AppendNode(node)
	return node, index
}

func (c *Document) NodeIndex(node *gltf.Node) int {
	return slices.Index(c.Nodes, node)
}

func (d *Document) NodeParent(node *gltf.Node) *gltf.Node {
	index := d.NodeIndex(node)
	for _, n := range d.Nodes {
		if slices.Index(n.Children, index) != -1 {
			return n
		}
	}
	return nil
}

func (d *Document) FindNodeByRefID(instanceRef string) (*gltf.Node, int) {
	for i, node := range d.Nodes {
		if ref, ok := ExtrasLoad[string](node.Extras, ExtraKeyRefID); ok && ref == instanceRef {
			return node, i
		}
	}
	return nil, -1
}

func (d *Document) FindNodeByControllerId(controllerId uint32) (*gltf.Node, int) {
	for i, node := range d.Nodes {
		if ref, ok := ExtrasLoad[uint32](node.Extras, ExtraKeyControllerID); ok && ref == controllerId {
			return node, i
		}
	}
	return nil, -1
}

func (d *Document) AddToSceneWithTransform(scene *gltf.Scene, node *gltf.Node, transform [16]float32) {
	parent, _ := d.NewNode()
	parent.Matrix = mat4.ToFloat64(transform)
	d.NodeAddChild(parent, node)
	d.AddToScene(scene, parent)
}

func (d *Document) AddToScene(scene *gltf.Scene, node *gltf.Node) {
	scene.Nodes = append(scene.Nodes, d.NodeIndex(node))
}

func (d *Document) CopyNode(node *gltf.Node) (*gltf.Node, int) {
	copy, index := d.NewNode()

	copy.Camera = node.Camera
	copy.Matrix = node.Matrix
	copy.Mesh = node.Mesh
	copy.Skin = node.Skin
	copy.Rotation = node.Rotation
	copy.Scale = node.Scale
	copy.Translation = node.Translation
	copy.Name = node.Name
	copy.Weights = node.Weights

	for _, child := range node.Children {
		_, childIndex := d.CopyNode(d.Nodes[child])
		copy.Children = append(copy.Children, childIndex)
	}
	return copy, index
}

func (d *Document) FindPrimitiveByRef(refId string) *gltf.Primitive {
	if refId == "" {
		return nil
	}
	for _, mesh := range d.Meshes {
		for _, prim := range mesh.Primitives {
			if ref, ok := ExtrasLoad[string](prim.Extras, ExtraKeyRefID); ok && ref == refId {
				return prim
			}
		}
	}
	return nil
}

func (d *Document) CopyPrimitive(prim *gltf.Primitive) *gltf.Primitive {
	copy := &gltf.Primitive{}
	copy.Attributes = copyPrimitiveAttributes(prim.Attributes)
	copy.Indices = prim.Indices
	copy.Material = prim.Material
	copy.Mode = prim.Mode
	copy.Targets = make([]gltf.PrimitiveAttributes, len(prim.Targets))
	for i, target := range prim.Targets {
		copy.Targets[i] = copyPrimitiveAttributes(target)
	}
	return copy
}

func copyPrimitiveAttributes(attrs gltf.PrimitiveAttributes) gltf.PrimitiveAttributes {
	copy := make(gltf.PrimitiveAttributes)
	maps.Copy(copy, attrs)
	return copy
}

func (c *Document) FindMaterialByRef(ref string) *gltf.Material {
	index := slices.IndexFunc(c.Materials, func(it *gltf.Material) bool {
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
	return c.Materials[index]
}

func (c *Document) FindOrAddMaterial(material mtl.Material) *gltf.Material {
	refId, _ := material.CalculateHash()
	gltfMtl := c.FindMaterialByRef(refId)
	if gltfMtl != nil {
		return gltfMtl
	}
	gltfMtl = &gltf.Material{}
	gltfMtl.Name = material.Name
	gltfMtl.Extras = map[string]any{"refId": refId, "mtl": material}
	c.Materials = append(c.Materials, gltfMtl)
	return gltfMtl
}

func ExtrasLoad[T any](data any, key string) (value T, ok bool) {
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

func ExtrasStore[T any](data any, key string, value T) any {
	if data == nil {
		data = make(map[string]any)
	}
	lookup, ok := data.(map[string]any)
	if !ok {
		return lookup
	}
	lookup[key] = value
	return lookup
}

func ExtrasDelete(data any, key string) any {
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

func (d *Document) IsMaterialReferenced(material *gltf.Material) bool {
	index := slices.Index(d.Materials, material)
	for _, mesh := range d.Meshes {
		for _, primitive := range mesh.Primitives {
			if primitive.Material != nil && *primitive.Material == index {
				return true
			}
		}
	}
	return false
}
