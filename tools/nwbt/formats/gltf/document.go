package gltf

import (
	"slices"

	"github.com/qmuntal/gltf"
)

const (
	ExtraKeyInstanceRef = "instanceRef"
	ExtraKeyRef         = "ref"
)

func NewDocument() *Document {
	return &Document{
		Document: gltf.NewDocument(),
	}
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

func (d *Document) AddChild(parent *gltf.Node, child ...*gltf.Node) {
	for _, c := range child {
		parent.Children = append(parent.Children, slices.Index(d.Nodes, c))
	}
}

func (c *Document) NewNode() (*gltf.Node, int) {
	node := &gltf.Node{}
	index := c.AppendNode(node)
	return node, index
}

func (c *Document) NodeIndex(node *gltf.Node) int {
	return slices.Index(c.Nodes, node)
}

func (d *Document) FindNodeInstance(instanceRef string) *gltf.Node {
	for _, node := range d.Nodes {
		if ref, ok := ExtrasLoad[string](node.Extras, ExtraKeyInstanceRef); ok && ref == instanceRef {
			return node
		}
	}
	return nil
}

func (d *Document) AddToSceneWithTransform(scene *gltf.Scene, node *gltf.Node, transform [16]float32) {
	parent, _ := d.NewNode()
	parent.Matrix = Mat4ToFloat64(transform)
	d.AddChild(parent, node)
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
