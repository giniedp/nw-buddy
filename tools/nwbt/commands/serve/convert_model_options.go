package serve

import (
	"archive/zip"
	"bytes"
	"fmt"
	"io/fs"
	"net/url"
	"nw-buddy/tools/formats/gltf"
	"nw-buddy/tools/formats/image"
	"nw-buddy/tools/game"
	"os"
	"path"
	"path/filepath"
	"strconv"
	"strings"
)

// Query options of the model conversions (`.glb`, `.gltf`, `.gltf.zip`, `.glb.zip`). Without options the result is the
// one the viewers load: textures linked as `.dds`.
const (
	// textures:
	//   - link (default): `.dds` urls of this server
	//   - embed: png images
	//   - dds: the original DDS images, normal maps as RGBA8 with z (for Blender)
	//   - none: no textures
	//
	// embed and dds: the images are inside a `.glb` / `.gltf`, separate files in a `.gltf.zip` / `.glb.zip`
	QUERY_TEXTURES = "textures"
	QUERY_SIZE     = "size"     // max texture size of embedded textures
	QUERY_QUANTIZE = "quantize" // KHR_mesh_quantization for normals and tangents
	QUERY_NODRAW   = "nodraw"   // keep: export NoDraw subsets
	QUERY_EMISSIVE = "emissive" // emissive reference luminance in cd/m², gltf.DefaultEmissiveRef by default
	QUERY_LOD      = "lod"      // all: add the sibling `_lodN` files of a model
	QUERY_IOR      = "ior"      // > 1: specular workflow with that ior and a scaled specular color (Blender), else ior 0
)

const (
	// a zip of `<name>.gltf`, `<name>.bin` and the images
	targetGltfZip = ".gltf.zip"
	// a zip of `<name>.glb` (the buffer inside) and the images
	targetGlbZip = ".glb.zip"
)

func isModelTarget(target string) bool {
	return target == ".gltf" || target == ".glb" || isZipTarget(target)
}

func isZipTarget(target string) bool {
	return target == targetGltfZip || target == targetGlbZip
}

type modelExportOptions struct {
	textures     string
	normalFormat string
	size         uint
	quantize     bool
	keepNoDraw   bool
	emissiveRef  float32
	specularIOR  float32
	lodAll       bool
}

func parseModelExportOptions(query url.Values, target string) modelExportOptions {
	opts := modelExportOptions{
		textures:   query.Get(QUERY_TEXTURES),
		quantize:   isTrueParam(query.Get(QUERY_QUANTIZE)),
		keepNoDraw: query.Get(QUERY_NODRAW) == "keep",
		lodAll:     query.Get(QUERY_LOD) == "all",
		// no cap unless the request asks for one: the server flag (--texture-size) is for linked textures only, an
		// export without `size` ("full" in the viewer) keeps the original size
		size: 0,
	}
	if opts.textures == "" {
		opts.textures = "link"
		if isZipTarget(target) {
			// a zip is for editing, linked `.dds` urls would point to this server
			opts.textures = "embed"
		}
	}
	if opts.textures == "dds" {
		// normal maps as Blender reads them: RGB with z
		opts.normalFormat = image.NormalFormatRGBA8
	}
	if size, err := strconv.Atoi(query.Get(QUERY_SIZE)); err == nil && size > 0 {
		opts.size = uint(size)
	}
	if ref, err := strconv.ParseFloat(query.Get(QUERY_EMISSIVE), 32); err == nil && ref > 0 {
		opts.emissiveRef = float32(ref)
	}
	if ior, err := strconv.ParseFloat(query.Get(QUERY_IOR), 32); err == nil {
		opts.specularIOR = float32(ior)
	}
	return opts
}

// lodSiblings returns the existing `<model>_lodN.cgf` files of a model, N = 1..9
func lodSiblings(assets *game.Assets, model string) []string {
	ext := path.Ext(model)
	base := strings.TrimSuffix(model, ext)
	result := []string{}
	for i := 1; i <= 9; i++ {
		file := fmt.Sprintf("%s_lod%d%s", base, i, ext)
		if _, ok := assets.Archive.Lookup(file); ok {
			result = append(result, file)
		}
	}
	return result
}

// setupTextures configures image loading of the document for the texture option. Returns the temp directory of a zip
// export (the images are written there, the document as `<name>.gltf` or `<name>.glb`), or "".
func setupTextures(
	document *gltf.Document,
	assets *game.Assets,
	opts modelExportOptions,
	target string,
	name string,
) (string, error) {
	switch opts.textures {
	case "none":
		return "", nil
	case "embed", "dds":
		pngLoader := image.LoaderWithConverter{
			Archive: assets.Archive,
			Catalog: assets.Catalog,
			Converter: image.BasicConverter{
				Format:  image.FormatPNG,
				MaxSize: opts.size,
			},
		}
		document.ImageLoader = pngLoader
		if opts.textures == "dds" {
			// the original DDS (larger mips dropped for the size), BC5_SNORM normal maps converted for Blender.
			// The bakes read png and are encoded to DDS (gltf encodeBake).
			document.ImageLoader = image.LoaderWithConverter{
				Archive: assets.Archive,
				Catalog: assets.Catalog,
				Converter: image.BasicConverter{
					Format:       image.FormatDDS,
					MaxSize:      opts.size,
					NormalFormat: opts.normalFormat,
				},
			}
			document.BakeImageLoader = pngLoader
		}
		if !isZipTarget(target) {
			return "", nil
		}
		// gltf + bin or glb, and image files: images are written as files next to it
		dir, err := os.MkdirTemp(flg.TempDir, "gltfzip-*")
		if err != nil {
			return "", err
		}
		linker := gltf.NewResourceLinker(dir)
		linker.SetRelativeMode(true)
		document.ImageLinker = linker
		// Save writes a binary GLB for the `.glb` extension
		extension := ".gltf"
		if target == targetGlbZip {
			extension = ".glb"
		}
		document.TargetFile = path.Join(filepath.ToSlash(dir), name+extension)
		return dir, nil
	}

	// link: the viewers load `.dds` from this server (merged mips, resized)
	cacheDir := imageCacheDir(flg.CacheDir, flg.TextureSize)
	linker := gltf.NewResourceLinker(cacheDir)
	linker.SetRelativeMode(false)
	linker.SkipWrite(true)
	queryParam := "merge=true"
	if flg.TextureSize > 0 {
		queryParam = fmt.Sprintf("%s&size=%d", queryParam, flg.TextureSize)
	}
	linker.SetQueryParam(queryParam)
	document.ImageLinker = linker
	document.ImageLoader = image.LoaderWithConverter{
		Archive: assets.Archive,
		Catalog: assets.Catalog,
		Converter: image.BasicConverter{
			Format:  ".dds",
			MaxSize: flg.TextureSize,
		},
	}
	return "", nil
}

// encodeGltfZip writes the document as `<name>.gltf` + `<name>.bin`, or as `<name>.glb`, and zips it with the image
// files in dir
func encodeGltfZip(document *gltf.Document, dir string, name string) ([]byte, error) {
	// a glb keeps its buffer inside, a gltf gets it as `<name>.bin`
	binary := path.Ext(document.TargetFile) == ".glb"
	if !binary && len(document.Buffers) > 0 && document.Buffers[0].URI == "" {
		document.Buffers[0].URI = name + ".bin"
		// the encoder writes external buffers only with a file system, write it here
		if err := os.WriteFile(filepath.Join(dir, name+".bin"), document.Buffers[0].Data, 0o644); err != nil {
			return nil, err
		}
	}
	if err := document.Save(); err != nil {
		return nil, err
	}
	buf := &bytes.Buffer{}
	zw := zip.NewWriter(buf)
	err := filepath.WalkDir(dir, func(file string, entry fs.DirEntry, err error) error {
		if err != nil || entry.IsDir() {
			return err
		}
		rel, err := filepath.Rel(dir, file)
		if err != nil {
			return err
		}
		data, err := os.ReadFile(file)
		if err != nil {
			return err
		}
		w, err := zw.Create(filepath.ToSlash(rel))
		if err != nil {
			return err
		}
		_, err = w.Write(data)
		return err
	})
	if err != nil {
		return nil, err
	}
	if err := zw.Close(); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}
