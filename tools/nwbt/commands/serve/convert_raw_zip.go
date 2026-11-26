package serve

import (
	"archive/zip"
	"bytes"
	"log/slog"
	"nw-buddy/tools/formats/dds"
	"nw-buddy/tools/formats/image"
	"nw-buddy/tools/formats/mtl"
	"nw-buddy/tools/nwfs"
	"strings"
)

const targetRawZip = ".raw.zip"

// convertRawZip zips a model (.cgf, .skin) with its dependencies as stored in the paks: the model and its heap, the
// `_lodN` siblings and their heaps, the material and every part of its textures (`.dds`, `.dds.N`, `.dds.a`,
// `.dds.Na`). Paths in the zip are the archive paths.
func convertRawZip(params convertParams) ([]byte, error) {
	assets := params.assets
	model, material := assets.ResolveCgfAndMtl(params.file.Path(), params.query.Get("material"))

	files := []nwfs.File{}
	seen := map[string]bool{}
	add := func(f nwfs.File) {
		if f != nil && !seen[f.Path()] {
			seen[f.Path()] = true
			files = append(files, f)
		}
	}
	lookup := func(file string) nwfs.File {
		f, _ := assets.Archive.Lookup(file)
		add(f)
		return f
	}

	for _, m := range append([]string{model}, lodSiblings(assets, model)...) {
		lookup(m)
		lookup(m + "heap")
	}

	if mtlFile := lookup(material); mtlFile != nil {
		doc, err := mtl.Load(mtlFile)
		if err != nil {
			slog.Warn("material not parsed", "file", material, "err", err)
		} else {
			resolver := image.LoaderWithConverter{Archive: assets.Archive, Catalog: assets.Catalog}
			for _, m := range doc.Collection() {
				for _, tex := range m.Textures.Texture {
					addTextureParts(resolver, tex, add)
				}
			}
		}
	}

	buf := &bytes.Buffer{}
	zw := zip.NewWriter(buf)
	for _, f := range files {
		data, err := f.Read()
		if err != nil {
			return nil, err
		}
		w, err := zw.Create(f.Path())
		if err != nil {
			return nil, err
		}
		if _, err := w.Write(data); err != nil {
			return nil, err
		}
	}
	if err := zw.Close(); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

// addTextureParts adds the dds header file and all split parts (mips and attached alpha) of a material texture.
// Engine textures (`$...`) are skipped.
func addTextureParts(resolver image.LoaderWithConverter, tex mtl.Texture, add func(nwfs.File)) {
	if strings.HasPrefix(strings.TrimSpace(tex.File), "$") {
		return
	}
	var file nwfs.File
	for _, ref := range []string{tex.AssetId, tex.File} {
		if ref == "" {
			continue
		}
		if f, err := resolver.ResolveFile(ref); err == nil {
			file = f
			break
		}
	}
	if file == nil {
		return
	}
	splits, err := dds.FindSplits(file)
	if err != nil {
		add(file)
		return
	}
	add(splits.Base.Header)
	for _, f := range splits.Base.Files {
		add(f)
	}
	add(splits.Alpha.Header)
	for _, f := range splits.Alpha.Files {
		add(f)
	}
}
