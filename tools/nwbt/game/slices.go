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
	Assets *Assets
	Visit  func(node *SliceNode)
}

type SliceNode struct {
	File       nwfs.File
	Parent     *SliceNode
	Slice      *nwt.SliceComponent
	Entity     *nwt.AZ__Entity
	Walker     *SliceWalker
	Components []any
	Transform  mat4.Data
	Context    context.Context
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

func (it *SliceNode) ContextStr(key string) (string, bool) {
	v, ok := it.Context.Value(key).(string)
	return v, ok
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

func (it *SliceNode) ContextInt(key string) (int, bool) {
	v, ok := it.Context.Value(key).(int)
	return v, ok
}

func (it *SliceNode) ContextIntGet(key string) int {
	if v, ok := it.Context.Value(key).(int); ok {
		return v
	}
	return 0
}

func (it *SliceNode) ContextIntSet(key string, value int) {
	it.Context = context.WithValue(it.Context, key, value)
}

func (it *SliceNode) ContextFloat(key string) (float32, bool) {
	v, ok := it.Context.Value(key).(float32)
	return v, ok
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
	WalkEntityTree(tree, func(node *EntityTreeNode) {
		node.Transform2 = mat4.Multiply(parentTransform, node.Transform)

		if node.Parent == nil {
			node.Context = ctx
		} else {
			node.Context = node.Parent.Context
		}

		it.Visit(&SliceNode{
			File:       file,
			Parent:     parent,
			Entity:     node.Entity,
			Slice:      component,
			Transform:  node.Transform2,
			Components: node.Entity.Components.Element,
			Walker:     it,
			Context:    ctx,
		})
	})
}

func (it *Assets) WalkSlice(file nwfs.File, visit func(node *SliceNode)) {
	walker := &SliceWalker{
		Assets: it,
		Visit:  visit,
	}
	walker.Walk(nil, file)
}

func ApplyVariationData(assets *Assets, slice *nwt.SliceComponent) {
	for _, it := range slice.Entities.Element {
		v := FindVariationDataComponent(&it)
		if v == nil {
			continue
		}
		if v.M_variationtableuniquename == "" || v.M_selectedvariant == "" {
			continue
		}
		row := assets.FindTableRow(string(v.M_variationtableuniquename), "VariantID", string(v.M_selectedvariant))
		if row == nil {
			continue
		}
		for _, data := range v.M_variantdata.Element {
			switch data.M_action {
			case "Change Prefab Spawner Slice":
				entity := FindEntityById(slice, data.M_entity.EntityId.Id)
				if entity == nil {
					continue
				}
				MutatePrefabSpawner(entity, func(prefab *nwt.PrefabSpawnerComponent) {
					value := row.GetString(string(data.M_colname))
					if value == "" {
						prefab.M_aliasAsset = nwt.AzAsset{}
						prefab.M_sliceAsset = nwt.AzAsset{}
					} else {
						prefab.M_aliasAsset.Hint = value
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
