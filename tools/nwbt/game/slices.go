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

type EntityWalker struct {
	Assets    *Assets
	Visit     func(node *EntityNode)
	VisitMeta func(node *MetaDataNode)
}

type EntityNode struct {
	File       nwfs.File
	Parent     *EntityNode
	Slice      *nwt.SliceComponent
	Entity     *nwt.AZ__Entity
	Walker     *EntityWalker
	Components []any
	Transform  mat4.Data
	Context    context.Context
}

func (it *EntityNode) ContextStr(key string) (string, bool) {
	v, ok := it.Context.Value(key).(string)
	return v, ok
}

func (it *EntityNode) ContextStrSet(key string, value string) {
	it.Context = context.WithValue(it.Context, key, value)
}

func (it *EntityNode) ContextInt(key string) (int, bool) {
	v, ok := it.Context.Value(key).(int)
	return v, ok
}

func (it *EntityNode) ContextIntSet(key string, value int) {
	it.Context = context.WithValue(it.Context, key, value)
}

func (it *EntityNode) ContextFloat(key string) (float32, bool) {
	v, ok := it.Context.Value(key).(float32)
	return v, ok
}

func (it *EntityNode) ContextFloatSet(key string, value float32) {
	it.Context = context.WithValue(it.Context, key, value)
}

func (it *EntityNode) WalkAsset(asset nwt.AzAsset) bool {
	return it.Walker.WalkAsset(it, asset)
}

func (it *EntityNode) Walk(file nwfs.File) {
	it.Walker.Walk(it, file)
}

func (it *EntityNode) isCircle(file nwfs.File) bool {
	if it.File != nil && it.File.Path() == file.Path() {
		return true
	}
	if it.Parent != nil {
		return it.Parent.isCircle(file)
	}
	return false
}

func (it *EntityWalker) WalkAsset(parent *EntityNode, asset nwt.AzAsset) bool {
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
		aliasParent := EntityNode{
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

func (it *EntityWalker) Walk(parent *EntityNode, file nwfs.File) {
	if parent != nil && parent.isCircle(file) {
		return
	}
	component, err := it.Assets.LoadSliceComponent(file)
	if err != nil {
		slog.Error("can't load slice component", "error", err)
		return
	}
	for entity := range EntitiesOf(component) {
		transform := FindTransformMat4(entity)
		if parent != nil {
			transform = mat4.Multiply(parent.Transform, transform)
		}
		ctx := context.Background()
		if parent != nil {
			ctx = parent.Context
		}
		it.Visit(&EntityNode{
			File:       file,
			Parent:     parent,
			Entity:     entity,
			Slice:      component,
			Transform:  transform,
			Components: entity.Components.Element,
			Walker:     it,
			Context:    ctx,
		})
	}
}

func (it *Assets) WalkSlice(file nwfs.File, visit func(node *EntityNode)) {
	walker := &EntityWalker{
		Assets: it,
		Visit:  visit,
	}
	walker.Walk(nil, file)
}

type MetaDataWalker struct {
	Assets *Assets
	Visit  func(node *MetaDataNode)
}

type MetaDataNode struct {
	File      nwfs.File
	Parent    *MetaDataNode
	MetaData  *nwt.SliceMetaData
	Transform mat4.Data
}

func (it *MetaDataWalker) Walk(parent *MetaDataNode, file nwfs.File, recursive bool) bool {
	if path.Ext(file.Path()) != ".dynamicslice" {
		slog.Warn("not a dynamicslice file", "file", file.Path())
		return false
	}

	metaFile, _ := it.Assets.Archive.Lookup(utils.ReplaceExt(file.Path(), ".slice.meta"))
	if metaFile == nil {
		slog.Warn("slice meta file not found", "file", file.Path())
		return false
	}

	data, err := it.Assets.LoadObjectStream(metaFile)
	if err != nil {
		slog.Error("slice meta not loaded", "error", err, "file", file.Path())
		return false
	}

	meta, ok := data.(nwt.SliceMetaData)
	if !ok {
		slog.Error("slice meta not loaded", "file", file.Path())
		return false
	}

	transform := mat4.Identity()
	if parent != nil {
		transform = mat4.Multiply(parent.Transform, transform)
	}
	it.Visit(&MetaDataNode{
		File:      file,
		Parent:    parent,
		MetaData:  &meta,
		Transform: transform,
	})

	if !recursive {
		return true
	}

	for _, element := range meta.Spawners.Element {
		spawnFile := it.Assets.ResolveDynamicSliceByName(string(element.Slicename))
		if spawnFile == nil {
			spawnFile, err = it.Assets.LookupFileByAssetId(element.Sliceassetid)
			if err != nil {
				slog.Error("slice asset not loaded", "error", err, "file", file.Path())
			}
		}
		if spawnFile == nil {
			continue
		}

		it.Walk(&MetaDataNode{
			File:      file,
			Parent:    parent,
			MetaData:  &meta,
			Transform: mat4.Multiply(transform, mat4.FromAzTransform(element.Worldtm)),
		}, spawnFile, recursive)
	}
	return true
}

func (it *Assets) WalkSliceMeta(file nwfs.File, visit func(node *MetaDataNode), recursive bool) bool {
	walker := &MetaDataWalker{
		Assets: it,
		Visit:  visit,
	}
	return walker.Walk(nil, file, recursive)
}
