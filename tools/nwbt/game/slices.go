package game

import (
	"context"
	"log/slog"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/rtti/nwt"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/math/mat4"
	"path"
)

type SliceWalker struct {
	SliceWalkOptions
	Assets *Assets
	Visit  func(node *SliceNode)
}

type SliceWalkOptions struct {
	// Context values a child entity takes from its parent entity. Everything else, and every value without this
	// option, comes from the spawner of the slice.
	InheritKeys []string
}

type SliceNode struct {
	File       nwfs.File
	Parent     *SliceNode
	Slice      *nwt.SliceComponent
	Entity     *nwt.AZ__Entity
	Walker     *SliceWalker
	Components []any
	Transform  mat4.Data
	// SliceTransform places the slice's own space: Transform = SliceTransform * entity worldTM
	SliceTransform mat4.Data
	Context        context.Context
}

func (it *SliceNode) ContextHasValue(key string) bool {
	return it.Context.Value(key) != nil
}

func (it *SliceNode) ContextSetValue(key string, value any) {
	it.Context = context.WithValue(it.Context, key, value)
}

func (it *SliceNode) ContextProvideIfMissing(key string, value any) {
	if !it.ContextHasValue(key) {
		it.Context = context.WithValue(it.Context, key, value)
	}
}

func (it *SliceNode) ContextStrGet(key string) string {
	v, _ := it.Context.Value(key).(string)
	return v
}

func (it *SliceNode) ContextStrSet(key string, value string) {
	it.Context = context.WithValue(it.Context, key, value)
}

func (it *SliceNode) ContextStrArrGet(key string) []string {
	v, _ := it.Context.Value(key).([]string)
	return v
}

func (it *SliceNode) ContextIntGet(key string) int {
	if v, ok := it.Context.Value(key).(int); ok {
		return v
	}
	return 0
}

func (it *SliceNode) ContextFloatPtrOrNil(key string) *float32 {
	v, ok := it.Context.Value(key).(float32)
	if !ok {
		return nil
	}
	return &v
}

func (it *SliceNode) ContextFloatSet(key string, value float32) {
	it.Context = context.WithValue(it.Context, key, value)
}

func (it *SliceNode) ContextBoolGet(key string) bool {
	if v, ok := it.Context.Value(key).(bool); ok {
		return v
	}
	return false
}

func (it *SliceNode) WalkAsset(asset nwt.AzAsset) bool {
	return it.Walker.WalkAsset(it, asset)
}

func (it *SliceNode) Walk(file nwfs.File) {
	it.Walker.Walk(it, file)
}

func (it *SliceNode) isCircle(file nwfs.File) bool {
	if it.File != nil && it.File.Path() == file.Path() {
		return true
	}
	if it.Parent != nil {
		return it.Parent.isCircle(file)
	}
	return false
}

func (it *SliceWalker) WalkAsset(parent *SliceNode, asset nwt.AzAsset) bool {
	file, err := it.Assets.LookupFileByAsset(asset)
	if err != nil {
		return false
	}
	if file == nil {
		return false
	}
	if parent != nil && parent.isCircle(file) {
		return false
	}

	switch path.Ext(file.Path()) {
	case ".slice":
		file, ok := it.Assets.Archive.Lookup(utils.ReplaceExt(file.Path(), ".dynamicslice"))
		if !ok {
			return false
		}
		it.Walk(parent, file)
	case ".dynamicslice":
		it.Walk(parent, file)
	case ".aliasasset":
		aliasParent := SliceNode{
			File:   file,
			Walker: it,
		}
		if parent != nil {
			aliasParent = *parent
			aliasParent.File = file
		}

		alias, err := it.Assets.LoadAliasAsset(file)
		if err != nil {
			slog.Error(".aliasasset not loaded", "error", err)
			return false
		}
		if alias == nil {
			slog.Warn(".aliasasset not loaded", "file", file.Path())
			return false
		}
		for _, tag := range alias.Tags.Element {
			for _, slice := range tag.Slices.Element {
				it.WalkAsset(&aliasParent, slice.Slice)
			}
		}
	}
	return true
}

func (it *SliceWalker) Walk(parent *SliceNode, file nwfs.File) {
	if parent != nil && parent.isCircle(file) {
		return
	}
	component, err := it.Assets.LoadSliceComponent(file)
	if err != nil {
		slog.Error("can't load slice component", "error", err)
		return
	}

	ApplyVariationData(it.Assets, component)

	tree := EntityTree(component)

	ctx := context.Background()
	if parent != nil {
		ctx = parent.Context
	}
	parentTransform := mat4.Identity()
	if parent != nil {
		parentTransform = parent.Transform
	}
	// the game places a slice by its root: the root stands at the placement, every entity at
	// placement * inverse(root) * entity
	if root, ok := SliceRootTransform(component); ok && !mat4.IsIdentity(root) {
		parentTransform = mat4.Multiply(parentTransform, mat4.Invert(root))
	}
	WalkEntityTree(tree, func(node *EntityTreeNode) {
		node.Transform2 = mat4.Multiply(parentTransform, node.Transform)

		visited := &SliceNode{
			File:           file,
			Parent:         parent,
			Entity:         node.Entity,
			Slice:          component,
			Transform:      node.Transform2,
			SliceTransform: parentTransform,
			Components:     node.Entity.Components.Element,
			Walker:         it,
			Context:        ctx,
		}
		if node.Parent != nil {
			for _, key := range it.InheritKeys {
				if value := node.Parent.Context.Value(key); value != nil {
					visited.Context = context.WithValue(visited.Context, key, value)
				}
			}
		}
		it.Visit(visited)
		node.Context = visited.Context
	})
}

func (it *Assets) WalkSlice(file nwfs.File, visit func(node *SliceNode)) {
	walker := &SliceWalker{
		Assets: it,
		Visit:  visit,
	}
	walker.Walk(nil, file)
}

func (it *Assets) WalkSliceWith(file nwfs.File, options SliceWalkOptions, visit func(node *SliceNode)) {
	walker := &SliceWalker{
		SliceWalkOptions: options,
		Assets:           it,
		Visit:            visit,
	}
	walker.Walk(nil, file)
}

// SliceRootTransform returns the transform of the slice's root entity. A slice with several entities without a
// parent has no root and keeps its own space.
func SliceRootTransform(slice *nwt.SliceComponent) (mat4.Data, bool) {
	var root *nwt.AZ__Entity
	for entity := range EntitiesOf(slice) {
		hasTransform := false
		for _, component := range entity.Components.Element {
			switch component.(type) {
			case nwt.GameTransformComponent, nwt.TransformComponent:
				hasTransform = true
			}
		}
		if !hasTransform || FindEntityParent(slice, entity) != nil {
			continue
		}
		if root != nil {
			return mat4.Identity(), false
		}
		root = entity
	}
	if root == nil {
		return mat4.Identity(), false
	}
	return FindEntityTransformMat4(root), true
}

func ApplyVariationData(assets *Assets, slice *nwt.SliceComponent) {
	for _, it := range slice.Entities.Element {
		v := FindVariationDataComponent(&it)
		if v == nil {
			continue
		}
		if v.M_variationTableUniqueName == "" || v.M_selectedVariant == "" {
			continue
		}
		row := assets.FindTableRow(string(v.M_variationTableUniqueName), "VariantID", string(v.M_selectedVariant))
		if row == nil {
			continue
		}
		for _, data := range v.M_variantData.Element {
			switch data.M_action {
			case "Change Prefab Spawner Slice":
				entity := FindEntityById(slice, data.M_entity.EntityId.Id)
				if entity == nil {
					continue
				}
				MutatePrefabSpawner(entity, func(prefab *nwt.PrefabSpawnerComponent) {
					value := row.GetString(string(data.M_colName))
					if value == "" {
						prefab.M_aliasAsset = nwt.AzAsset{}
						prefab.M_sliceAsset = nwt.AzAsset{}
					} else {
						prefab.M_aliasAsset.Hint = value
					}
				})

			}
		}
	}
}

func FindVariationDataComponent(entity *nwt.AZ__Entity) *nwt.VariationDataComponent {
	if entity == nil {
		return nil
	}
	for _, component := range entity.Components.Element {
		if v, ok := component.(nwt.VariationDataComponent); ok {
			return &v
		}
	}
	return nil
}

func FindPrefabSpawnerComponent(entity *nwt.AZ__Entity) *nwt.PrefabSpawnerComponent {
	if entity == nil {
		return nil

	}
	for _, component := range entity.Components.Element {
		if v, ok := component.(nwt.PrefabSpawnerComponent); ok {
			return &v
		}
	}
	return nil
}

func MutatePrefabSpawner(entity *nwt.AZ__Entity, mutate func(it *nwt.PrefabSpawnerComponent)) {
	for i, component := range entity.Components.Element {
		if v, ok := component.(nwt.PrefabSpawnerComponent); ok {
			ptr := &v
			mutate(ptr)
			entity.Components.Element[i] = *ptr
		}
	}
}
