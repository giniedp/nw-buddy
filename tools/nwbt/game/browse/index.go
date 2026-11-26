// Package browse indexes the archive for the asset browser of nw-viewer: the type of every file,
// folders and search. Built once at serve start.
package browse

import (
	"iter"
	"nw-buddy/tools/formats/catalog"
	"nw-buddy/tools/nwfs"
	"path"
	"slices"
	"strings"
)

// Type is one asset type that occurs in the archive
type Type struct {
	// catalog type uuid, or "ext:<extension>" for files without a catalog type
	Key    string                `json:"key"`
	Label  string                `json:"label"`
	Group  catalog.TypeGroup     `json:"group"`
	Format catalog.ContentFormat `json:"format"`
	// parts of other assets, e.g. split texture mips, not listed unless asked for
	Hidden bool `json:"hidden"`
	// false for catalog uuids missing from catalog.KnownTypes and extensions missing from catalog.ExtTypes
	Known bool `json:"known"`
	// number of files of this type
	Count int `json:"count"`
}

// Index of the archive files, sorted by path
type Index struct {
	// the types that occur, a file's type is an index into it
	Types []*Type

	files    []nwfs.File
	fileType []uint16
	asset    []*catalog.Asset
}

// Build indexes the files. A file's type is the type uuid of its catalog asset. Files without an
// asset, or whose asset has the null type (copy jobs: wem, bnk, json, ...), are typed by their
// extension instead.
func Build(files []nwfs.File, assets iter.Seq[*catalog.Asset]) *Index {
	assetOf := assetsByFile(assets)

	index := &Index{
		files:    slices.Clone(files),
		fileType: make([]uint16, len(files)),
		asset:    make([]*catalog.Asset, len(files)),
	}
	slices.SortFunc(index.files, func(a, b nwfs.File) int {
		return strings.Compare(a.Path(), b.Path())
	})

	byKey := make(map[string]uint16)
	for i, file := range index.files {
		ext := fileExt(file.Path())
		asset := assetOf[file.Path()]
		index.asset[i] = asset

		typed := asset != nil && asset.Type != catalog.NullUUID
		key := "ext:" + ext
		if typed {
			key = asset.Type
		}
		id, ok := byKey[key]
		if !ok {
			id = uint16(len(index.Types))
			byKey[key] = id
			if typed {
				index.Types = append(index.Types, uuidType(asset.Type, ext))
			} else {
				index.Types = append(index.Types, extType(ext))
			}
		}
		index.fileType[i] = id
		index.Types[id].Count++
	}
	return index
}

// assetsByFile maps archive paths (lowercase) to their catalog asset. Several assets may name the
// same file, the one with a type wins.
func assetsByFile(assets iter.Seq[*catalog.Asset]) map[string]*catalog.Asset {
	result := make(map[string]*catalog.Asset)
	for asset := range assets {
		file := nwfs.NormalizePath(asset.File)
		if prev, ok := result[file]; ok && prev.Type != catalog.NullUUID {
			continue
		}
		result[file] = asset
	}
	return result
}

// Len is the number of files
func (index *Index) Len() int {
	return len(index.files)
}

// File returns the file at a position of the sorted file list, its type and its catalog asset (nil if none)
func (index *Index) File(i int) (nwfs.File, *Type, *catalog.Asset) {
	return index.files[i], index.Types[index.fileType[i]], index.asset[i]
}

// fileExt is the extension after the last dot of the file name, without the dot, "" when there is none
func fileExt(filePath string) string {
	name := path.Base(filePath)
	dot := strings.LastIndexByte(name, '.')
	if dot < 0 {
		return ""
	}
	return name[dot+1:]
}

func uuidType(uuid string, ext string) *Type {
	if known, ok := catalog.LookupKnownType(uuid); ok {
		return &Type{
			Key:    uuid,
			Label:  known.Name,
			Group:  known.Group,
			Format: known.Format,
			Hidden: known.Group == catalog.GroupHidden,
			Known:  true,
		}
	}
	// named after the extension of the first file seen with it
	return &Type{
		Key:    uuid,
		Label:  "Unknown " + extLabel(ext),
		Group:  catalog.GroupOther,
		Format: catalog.FormatBinary,
	}
}

func extType(ext string) *Type {
	if known, ok := catalog.LookupExtType(ext); ok {
		return &Type{
			Key:    "ext:" + ext,
			Label:  known.Name,
			Group:  known.Group,
			Format: known.Format,
			Known:  true,
		}
	}
	return &Type{
		Key:    "ext:" + ext,
		Label:  extLabel(ext),
		Group:  catalog.GroupOther,
		Format: catalog.FormatBinary,
	}
}

func extLabel(ext string) string {
	if ext == "" {
		return "(no extension)"
	}
	return "*." + ext
}
