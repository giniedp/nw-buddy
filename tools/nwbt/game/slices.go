package game

import (
	"log/slog"
	"nw-buddy/tools/formats/gltf"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/rtti/nwt"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/crymath"
	"path"
)

type EntityWalker struct {
	Assets *Assets
	Visit  func(node *EntityNode)
}

type EntityNode struct {
	File       nwfs.File
	Parent     *EntityNode
	Slice      *nwt.SliceComponent
	Entity     *nwt.AZ__Entity
	Walker     *EntityWalker
	Components []any
	Transform  crymath.Mat4x4
}

func (it *EntityNode) WalkAsset(asset nwt.AzAsset) {
	it.Walker.WalkAsset(it, asset)
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

func (it *EntityWalker) WalkAsset(parent *EntityNode, asset nwt.AzAsset) {
	file, err := it.Assets.LookupFileByAsset(asset)
	if err != nil {
		return
	}
	if file == nil {
		return
	}
	if parent != nil && parent.isCircle(file) {
		return
	}

	switch path.Ext(file.Path()) {
	case ".slice":
		file, ok := it.Assets.Archive.Lookup(utils.ReplaceExt(file.Path(), ".dynamicslice"))
		if !ok {
			return
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
			return
		}
		if alias == nil {
			slog.Warn(".aliasasset not loaded", "file", file.Path())
			return
		}
		for _, tag := range alias.Tags.Element {
			for _, slice := range tag.Slices.Element {
				it.WalkAsset(&aliasParent, slice.Slice)
			}
		}
	}
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
			transform = gltf.Mat4Multiply(parent.Transform, transform)
		}
		it.Visit(&EntityNode{
			File:       file,
			Parent:     parent,
			Entity:     entity,
			Slice:      component,
			Transform:  transform,
			Components: entity.Components.Element,
			Walker:     it,
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
