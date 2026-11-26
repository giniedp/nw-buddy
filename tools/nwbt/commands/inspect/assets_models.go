package inspect

import (
	"fmt"
	"nw-buddy/tools/formats/catalog"
	"nw-buddy/tools/formats/cgf"
	"nw-buddy/tools/formats/mtl"
	"nw-buddy/tools/game"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/maps"
	"path"
	"regexp"
	"strconv"
	"strings"

	"github.com/spf13/cobra"
)

var cmdModels = &cobra.Command{
	Use:   "models [glob...]",
	Short: "collects statistics of .cgf and .skin files (LODs, helpers, shadow proxies, vertex streams, sizes)",
	Long: `collects statistics of .cgf and .skin files and writes one json row per file.

Sizes are uncompressed (size) and compressed in the pak (csize).
Geometry bytes are classified by the node that references the mesh: main, lod ($lodN nodes), helper ($ nodes), shadow (shadow proxy nodes or materials).`,
	Run: runModels,
}

type ModelRow struct {
	File      string `json:"file"`
	Ext       string `json:"ext"`
	Dir       string `json:"dir"`
	FileType  string `json:"type"`
	LodOf     string `json:"lodOf,omitempty"` // base file if this is a _lodN file
	LodIndex  int    `json:"lodIndex,omitempty"`
	Size      int64  `json:"size"`
	CSize     int64  `json:"csize"`
	HeapSize  int64  `json:"heapSize,omitempty"`
	HeapCSize int64  `json:"heapCSize,omitempty"`
	Material  string `json:"material,omitempty"` // default material
	// kind of the material reference in the MtlName chunk: assetid, path or empty
	MtlRef string `json:"mtlRef,omitempty"`
	// largest power of two (up to 16) that divides all DataRef offsets
	RefAlign int `json:"refAlign,omitempty"`
	// DataRef chunks whose size is not a multiple of 4
	RefOddSize  int `json:"refOddSize,omitempty"`
	Nodes       int `json:"nodes"`
	InlineLods  int `json:"inlineLods,omitempty"` // highest $lodN node index
	HelperNodes int `json:"helperNodes,omitempty"`
	// shadow proxy by node name
	ShadowNodes int `json:"shadowNodes,omitempty"`
	// subsets that use a shadow proxy material
	ShadowSubsets int `json:"shadowSubsets,omitempty"`
	Meshes        int `json:"meshes"`
	Subsets       int `json:"subsets"`
	Verts         int `json:"verts"` // main nodes only
	Indices       int `json:"indices"`
	MaxVerts      int `json:"maxVerts"` // largest mesh, main nodes only
	// geometry bytes by node class: main, lod, helper, shadow
	Bytes map[string]int64 `json:"bytes"`
	// geometry bytes by stream type, main nodes only
	Streams map[string]int64 `json:"streams"`
	// stream layouts e.g. "positions:heap:16", main nodes only
	Layouts []string `json:"layouts"`
	// bytes by chunk type (from chunk table)
	Chunks map[string]int64 `json:"chunks"`
	Error  string           `json:"error,omitempty"`
}

var modelLodRegex = regexp.MustCompile(`_lod(\d+)\.(cgf|skin)$`)
var nodeLodRegex = regexp.MustCompile(`\$lod(\d+)`)

var streamNames = []string{
	"positions", "normals", "texcoords", "colors", "colors2", "indices", "tangents", "shcoeffs",
	"shapedeform", "bonemapping", "facemap", "vertmats", "qtangents", "skindata", "dummy2", "p3s_c4b_t2s",
}

func streamName(t cgf.DataStreamType) string {
	if int(t) < len(streamNames) {
		return streamNames[t]
	}
	return fmt.Sprintf("stream%d", t)
}

func runModels(ccmd *cobra.Command, args []string) {
	assets := utils.Must(game.InitPackedAssets(flgGameDir))
	if len(args) == 0 {
		args = []string{"**.cgf", "**.skin"}
	}
	files := utils.Must(listFiles(args, false, assets.Archive))
	shadowCache := maps.NewSafeMap[string, []bool]()
	processRows("Models", files, func(file nwfs.File) *ModelRow {
		return inspectModel(assets, file, shadowCache)
	})
}

func inspectModel(assets *game.Assets, file nwfs.File, shadowCache *maps.SafeMap[string, []bool]) *ModelRow {
	p := file.Path()
	row := &ModelRow{
		File:    p,
		Ext:     path.Ext(p),
		Dir:     topDir(p, 2),
		Size:    fileSize(file),
		CSize:   compressedSize(file),
		Bytes:   map[string]int64{},
		Streams: map[string]int64{},
		Chunks:  map[string]int64{},
	}
	if m := modelLodRegex.FindStringSubmatch(p); m != nil {
		row.LodIndex, _ = strconv.Atoi(m[1])
		row.LodOf = modelLodRegex.ReplaceAllString(p, ".$2")
	}
	heap, hasHeap := assets.Archive.Lookup(p + "heap")
	if hasHeap {
		row.HeapSize = fileSize(heap)
		row.HeapCSize = compressedSize(heap)
	}

	doc, err := cgf.Load(file)
	if err != nil {
		row.Error = err.Error()
		return row
	}
	row.FileType = doc.Header.FileType.String()
	for _, h := range doc.Table {
		row.Chunks[h.Type.String()] += int64(h.Size)
	}

	row.Material = assets.ResolveMtlFromCgf(p)
	shadowMtl := shadowProxyMaterials(assets, row.Material, shadowCache)
	for _, chunk := range doc.Chunks {
		if namer, ok := chunk.(cgf.ChunkMtlNamer); ok && namer.GetName() != "" {
			if _, isAssetId := catalog.ParseAssetId(namer.GetName()); isAssetId {
				row.MtlRef = "assetid"
			} else {
				row.MtlRef = "path"
			}
			break
		}
	}
	for _, ref := range cgf.SelectChunks[cgf.ChunkDataRef](doc) {
		align := 16
		for align > 1 && ref.Offset%uint32(align) != 0 {
			align /= 2
		}
		if row.RefAlign == 0 || align < row.RefAlign {
			row.RefAlign = align
		}
		if ref.Size%4 != 0 {
			row.RefOddSize++
		}
	}

	layouts := map[string]bool{}
	for _, node := range cgf.SelectChunks[cgf.ChunkNode](doc) {
		row.Nodes++
		name := strings.ToLower(node.Name)
		class := "main"
		switch {
		case strings.Contains(name, "$lod"):
			class = "lod"
			if m := nodeLodRegex.FindStringSubmatch(name); m != nil {
				lod, _ := strconv.Atoi(m[1])
				row.InlineLods = max(row.InlineLods, lod)
			}
		case strings.Contains(name, "shadowproxy") || strings.Contains(name, "shadow_proxy"):
			class = "shadow"
			row.ShadowNodes++
		case strings.HasPrefix(name, "$") || strings.Contains(name, "$physics"):
			class = "helper"
			row.HelperNodes++
		}
		mesh, ok := cgf.FindChunk[cgf.ChunkMesh](doc, node.ObjectId)
		if !ok {
			continue
		}
		row.Meshes++

		// bytes per vertex and per index, to split off shadow proxy subsets
		vertexStride := 0
		indexStride := 0
		// interleaved streams (position, color, texcoord) reference the same chunk
		seen := map[int32]bool{}
		for streamType, ids := range mesh.StreamChunkID {
			for _, id := range ids {
				if id == 0 || seen[id] {
					continue
				}
				seen[id] = true
				st := cgf.DataStreamType(streamType)
				var bytes int64
				var stride int
				var mode string
				if s, ok := cgf.FindChunk[cgf.ChunkDataStream](doc, id); ok {
					bytes = int64(s.ElementCount) * int64(s.ElementSize)
					stride = int(s.ElementSize)
					mode = "inline"
				} else if r, ok := cgf.FindChunk[cgf.ChunkDataRef](doc, id); ok {
					bytes = int64(r.Size)
					stride = int(r.Stride)
					mode = "heap"
				} else {
					continue
				}
				if st == cgf.STREAM_TYPE_INDICES {
					indexStride += stride
				} else {
					vertexStride += stride
				}
				row.Bytes[class] += bytes
				if class == "main" {
					row.Streams[streamName(st)] += bytes
					layouts[fmt.Sprintf("%s:%s:%d", streamName(st), mode, stride)] = true
				}
			}
		}
		if class == "main" {
			row.Verts += int(mesh.VertexCount)
			row.Indices += int(mesh.IndexCount)
			row.MaxVerts = max(row.MaxVerts, int(mesh.VertexCount))
		}
		if subsets, ok := cgf.FindChunk[cgf.ChunkMeshSubsets](doc, mesh.SubsetsChunkId); ok {
			for _, s := range subsets.Subsets {
				row.Subsets++
				id := int(s.MaterialId)
				if class != "lod" && id >= 0 && id < len(shadowMtl) && shadowMtl[id] {
					row.ShadowSubsets++
					b := int64(s.NumVertices)*int64(vertexStride) + int64(s.NumIndices)*int64(indexStride)
					row.Bytes["shadowMtl"] += b
				}
			}
		}
	}
	for l := range layouts {
		row.Layouts = append(row.Layouts, l)
	}
	return row
}

func shadowProxyMaterials(assets *game.Assets, file string, cache *maps.SafeMap[string, []bool]) []bool {
	if file == "" {
		return nil
	}
	if res, ok := cache.Load(file); ok {
		return res
	}
	var res []bool
	if f, ok := assets.Archive.Lookup(file); ok {
		if doc, err := mtl.Load(f); err == nil {
			for _, m := range doc.Collection() {
				res = append(res, m.IsShadowProxy())
			}
		}
	}
	cache.Store(file, res)
	return res
}
