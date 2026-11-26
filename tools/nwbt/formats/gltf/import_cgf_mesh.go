package gltf

import (
	"fmt"
	"log/slog"
	gomath "math"
	"nw-buddy/tools/formats/cgf"
	"nw-buddy/tools/formats/mtl"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/math"
	"slices"
	"strings"

	"maps"

	"github.com/qmuntal/gltf"
)

const KHR_mesh_quantization = "KHR_mesh_quantization"

// meshGeometry holds the converted streams of one cgf mesh chunk. All subsets of the chunk share the vertex
// accessors and reference ranges of one index buffer view with their raw (absolute) indices.
type meshGeometry struct {
	attributes  gltf.PrimitiveAttributes
	vertexCount int
	indexView   int
	indexType   gltf.ComponentType
	indexSize   int
	indexCount  int
	// index accessor per subset, reused when the mesh is referenced by more nodes
	subsetIndices map[int]int
}

type meshGeometryKey struct {
	file   *cgf.File
	source string
	id     int32
}

// ImportCgfMesh adds a mesh with a primitive per subset, and a second one for each subset that has an overcoat material.
// They share the geometry.
func (doc *Document) ImportCgfMesh(name string, chunk cgf.ChunkMesh, cgfile *cgf.File, heap []byte, materialLookup MaterialLookup, overcoatLookup MaterialLookup) (*gltf.Mesh, *int) {
	subsets, hasSubsets := cgf.FindChunk[cgf.ChunkMeshSubsets](cgfile, chunk.SubsetsChunkId)
	if !hasSubsets {
		return nil, nil
	}

	geometry, err := doc.cgfMeshGeometry(chunk, cgfile, heap)
	if err != nil {
		slog.Warn("mesh geometry not converted", "file", cgfile.Source, "chunk", chunk.Id, "err", err)
		return nil, nil
	}

	mesh := &gltf.Mesh{}
	addPrimitive := func(i int, subset cgf.MeshSubset, material *gltf.Material) {
		indices, ok := geometry.subsetIndexAccessor(doc, i, subset)
		if !ok || doc.isHiddenMaterial(material) {
			return
		}
		primitive := &gltf.Primitive{
			Mode:       gltf.PrimitiveTriangles,
			Attributes: maps.Clone(geometry.attributes),
			Indices:    gltf.Index(indices),
		}
		primitive.Extras = ExtrasStore(primitive.Extras, ExtraKeyRefID, subsetRefId(cgfile, chunk, i))
		primitive.Extras = ExtrasStore(primitive.Extras, ExtraKeySource, cgfile.Source)
		primitive.Extras = ExtrasStore(primitive.Extras, ExtraKeyName, name)
		if index := slices.Index(doc.Materials, material); index != -1 {
			primitive.Material = gltf.Index(index)
		}
		mesh.Primitives = append(mesh.Primitives, primitive)
	}
	for i, subset := range subsets.Subsets {
		addPrimitive(i, subset, materialLookup.Get(int(subset.MaterialId)))
	}
	for i, subset := range subsets.Subsets {
		if overcoat := overcoatLookup.Get(int(subset.MaterialId)); overcoat != nil {
			addPrimitive(i, subset, overcoat)
		}
	}

	if len(mesh.Primitives) == 0 {
		return nil, nil
	}

	return mesh, doc.AppendMesh(mesh)
}

// isHiddenMaterial reports whether subsets with the material are not exported: NoDraw (shader or MtlFlags NODRAW)
// unless KeepNoDraw, and shadow proxies with SkipShadowProxy. The game does not draw them either.
func (doc *Document) isHiddenMaterial(material *gltf.Material) bool {
	m := lookupMtl(material)
	if m == nil {
		return false
	}
	if !doc.Options.KeepNoDraw {
		if strings.EqualFold(m.Shader, "nodraw") || (m.MtlFlags != nil && *m.MtlFlags&mtl.MTL_FLAG_NODRAW != 0) {
			return true
		}
	}
	return doc.Options.SkipShadowProxy && m.IsShadowProxy()
}

func subsetRefId(cgfile *cgf.File, chunk cgf.ChunkMesh, subset int) string {
	if cgfile.Source == "" {
		return ""
	}
	return hashString(fmt.Sprintf("%s_%d_%d_%d", cgfile.Source, chunk.Id, chunk.SubsetsChunkId, subset))
}

func (g *meshGeometry) subsetIndexAccessor(doc *Document, i int, subset cgf.MeshSubset) (int, bool) {
	if index, ok := g.subsetIndices[i]; ok {
		return index, true
	}
	first, count := int(subset.FirstIndex), int(subset.NumIndices)
	if count <= 0 || first < 0 || first+count > g.indexCount {
		slog.Warn("subset index range out of bounds", "first", first, "count", count, "indices", g.indexCount)
		return 0, false
	}
	index := doc.appendAccessor(g.indexView, first*g.indexSize, count, g.indexType, gltf.AccessorScalar, false)
	g.subsetIndices[i] = index
	return index, true
}

// cgfStream is the element data of one stream, either inline (DataStream chunk) or a slice of the .cgfheap (DataRef chunk)
type cgfStream struct {
	id     int32
	data   []byte
	stride int
	count  int
	inline bool
}

func findCgfStream(cgfile *cgf.File, heap []byte, chunk cgf.ChunkMesh, streamType cgf.DataStreamType) (cgfStream, bool) {
	streams := findCgfStreams(cgfile, heap, chunk, streamType)
	if len(streams) == 0 {
		return cgfStream{}, false
	}
	return streams[0], true
}

// findCgfStreams returns all streams of a type in set order (e.g. texcoord sets 0 and 1)
func findCgfStreams(cgfile *cgf.File, heap []byte, chunk cgf.ChunkMesh, streamType cgf.DataStreamType) []cgfStream {
	var result []cgfStream
	for _, id := range chunk.StreamChunkID[streamType] {
		if id == 0 {
			continue
		}
		if s, ok := cgf.FindChunk[cgf.ChunkDataStream](cgfile, id); ok {
			if s.ElementSize == 0 {
				continue
			}
			result = append(result, cgfStream{id: id, data: s.Data, stride: int(s.ElementSize), count: int(s.ElementCount), inline: true})
			continue
		}
		if ref, ok := cgf.FindChunk[cgf.ChunkDataRef](cgfile, id); ok {
			end := int(ref.Offset) + int(ref.Size)
			if ref.Stride == 0 || end > len(heap) {
				slog.Warn("heap stream out of bounds or missing heap", "file", cgfile.Source, "type", streamType, "end", end, "heap", len(heap))
				continue
			}
			result = append(result, cgfStream{id: id, data: heap[ref.Offset:end], stride: int(ref.Stride), count: int(ref.Size / ref.Stride)})
		}
	}
	return result
}

// cgfMeshGeometry converts the streams of a mesh chunk once per document.
//
// One pass per stream writes straight into the glTF buffer: no intermediate slices, no per subset copies.
// The basis transform (Z-up → Y-up) stays per vertex, a root node transform breaks animations.
// Data that needs no conversion (indices, f32 texcoords, bone mapping) is copied as is.
func (doc *Document) cgfMeshGeometry(chunk cgf.ChunkMesh, cgfile *cgf.File, heap []byte) (g *meshGeometry, err error) {
	defer utils.HandleRecover(&err)

	key := meshGeometryKey{source: cgfile.Source, id: chunk.Id}
	if key.source == "" {
		key.file = cgfile
	}
	if doc.geometries == nil {
		doc.geometries = make(map[meshGeometryKey]*meshGeometry)
	}
	if g, ok := doc.geometries[key]; ok {
		return g, nil
	}

	base := doc.Options.Base
	if base == nil {
		base = math.GetBase(false)
	}
	simplify := doc.Options.Simplify
	quantize := doc.Options.Quantize && !simplify

	find := func(t cgf.DataStreamType) (cgfStream, bool) {
		return findCgfStream(cgfile, heap, chunk, t)
	}

	indices, ok := find(cgf.STREAM_TYPE_INDICES)
	if !ok {
		return nil, fmt.Errorf("no indices")
	}
	positions, ok := find(cgf.STREAM_TYPE_POSITIONS)
	if !ok {
		return nil, fmt.Errorf("no positions")
	}

	g = &meshGeometry{
		attributes:    gltf.PrimitiveAttributes{},
		vertexCount:   positions.count,
		subsetIndices: map[int]int{},
	}
	n := g.vertexCount
	// streams with fewer elements than positions are dropped
	usable := func(s cgfStream, ok bool) bool {
		if ok && s.count < n {
			slog.Warn("stream has fewer elements than positions", "file", cgfile.Source, "count", s.count, "vertices", n)
			return false
		}
		return ok
	}

	texcoordSets := findCgfStreams(cgfile, heap, chunk, cgf.STREAM_TYPE_TEXCOORDS)
	colors, hasColors := find(cgf.STREAM_TYPE_COLORS)
	hasColors = usable(colors, hasColors) && !simplify
	colors2, hasColors2 := find(cgf.STREAM_TYPE_COLORS2)
	hasColors2 = usable(colors2, hasColors2) && !simplify
	normals, hasNormals := find(cgf.STREAM_TYPE_NORMALS)
	hasNormals = usable(normals, hasNormals) && !simplify
	tangents, hasTangents := find(cgf.STREAM_TYPE_TANGENTS)
	hasTangents = usable(tangents, hasTangents) && !simplify
	qtangents, hasQTangents := find(cgf.STREAM_TYPE_QTANGENTS)
	hasQTangents = usable(qtangents, hasQTangents) && !simplify
	bones, hasBones := find(cgf.STREAM_TYPE_BONEMAPPING)
	hasBones = usable(bones, hasBones)

	// one reservation for all views of this mesh
	doc.reserveBuffer(len(indices.data) + n*(24+28+16+8) + 64)

	// indices: raw copy, subsets reference ranges of it
	switch indices.stride {
	case 2:
		g.indexType, g.indexSize = gltf.ComponentUshort, 2
	case 4:
		g.indexType, g.indexSize = gltf.ComponentUint, 4
	default:
		return nil, fmt.Errorf("unsupported index size %d", indices.stride)
	}
	g.indexCount = indices.count
	view, dst := doc.appendBufferView(indices.count*indices.stride, 0, gltf.TargetElementArrayBuffer)
	copy(dst, indices.data)
	g.indexView = view

	// a skin's vertices are relative to its mesh offset, a glTF skinned mesh ignores its node transform
	var offset [3]float32
	if hasBones {
		offset = skinMeshOffset(cgfile, chunk.Id)
	}
	if !positions.inline {
		// heap: interleaved position, color and texcoord (P3S_C4B_T2S 16 B or P3F_C4B_T2F 24 B)
		if err := doc.writeHeapVertices(g, positions, base, offset, !simplify); err != nil {
			return nil, err
		}
	} else {
		if err := doc.writePositions(g, positions, base, offset); err != nil {
			return nil, err
		}
		if hasColors {
			doc.writeColors(g, colors, gltf.COLOR_0)
		}
	}
	// texcoord sets, set 0 of the heap layout is part of the interleaved vertex stream
	for set, s := range texcoordSets {
		if set > 1 || (set == 0 && s.id == positions.id && !positions.inline) || !usable(s, true) {
			continue
		}
		doc.writeTexcoords(g, s, fmt.Sprintf("TEXCOORD_%d", set))
	}
	if hasColors2 {
		doc.writeColors(g, colors2, "COLOR_1")
	}
	// normals like the engine shades: from the tangent frame, the normal stream (old inline format) only without one
	switch {
	case hasTangents:
		doc.writeTangentFrame(g, tangents, base, quantize)
	case hasNormals:
		doc.writeNormals(g, normals, base, quantize)
	case hasQTangents:
		doc.writeQTangentFrame(g, qtangents, base, quantize)
	}
	if hasBones {
		doc.writeBoneMapping(g, bones)
	}
	if quantize && (hasNormals || hasTangents || hasQTangents) {
		doc.ExtensionsUsed = utils.AppendUniq(doc.ExtensionsUsed, KHR_mesh_quantization)
		doc.ExtensionsRequired = utils.AppendUniq(doc.ExtensionsRequired, KHR_mesh_quantization)
	}

	doc.geometries[key] = g
	return g, nil
}

// writeHeapVertices converts the interleaved heap stream into one interleaved view:
// position f32x3 @0 (plus offset, in game axes), texcoord f32x2 @12, color rgba8 @20 (optional)
func (doc *Document) writeHeapVertices(g *meshGeometry, s cgfStream, base math.Base, offset [3]float32, withColor bool) error {
	if s.stride != 16 && s.stride != 24 {
		return fmt.Errorf("unsupported position stride %d", s.stride)
	}
	stride := 20
	if withColor {
		stride = 24
	}
	n := g.vertexCount
	view, dst := doc.appendBufferView(n*stride, stride, gltf.TargetArrayBuffer)
	bounds := minMax{}
	for i := range n {
		src := s.data[i*s.stride:]
		out := dst[i*stride:]
		var p [3]float32
		var color []byte
		if s.stride == 16 {
			p = [3]float32{readF16(src[0:]), readF16(src[2:]), readF16(src[4:])}
			color = src[8:12]
			putF32(out[12:], finiteOr0(readF16(src[12:])))
			putF32(out[16:], finiteOr0(readF16(src[14:])))
		} else {
			p = [3]float32{readF32(src[0:]), readF32(src[4:]), readF32(src[8:])}
			color = src[12:16]
			putF32(out[12:], finiteOr0(readF32(src[16:])))
			putF32(out[16:], finiteOr0(readF32(src[20:])))
		}
		p = base.Vec3([3]float32{p[0] + offset[0], p[1] + offset[1], p[2] + offset[2]})
		bounds.add(p)
		putVec3(out, p)
		if withColor {
			putBGRA(out[20:], color)
		}
	}
	pos := doc.appendAccessor(view, 0, n, gltf.ComponentFloat, gltf.AccessorVec3, false)
	bounds.apply(doc.Accessors[pos])
	g.attributes[gltf.POSITION] = pos
	g.attributes[gltf.TEXCOORD_0] = doc.appendAccessor(view, 12, n, gltf.ComponentFloat, gltf.AccessorVec2, false)
	if withColor {
		g.attributes[gltf.COLOR_0] = doc.appendAccessor(view, 20, n, gltf.ComponentUbyte, gltf.AccessorVec4, true)
	}
	return nil
}

// writePositions converts an inline position stream (f32x3 or f16x4) to f32x3, plus offset (in game axes)
func (doc *Document) writePositions(g *meshGeometry, s cgfStream, base math.Base, offset [3]float32) error {
	if s.stride != 12 && s.stride != 8 {
		return fmt.Errorf("unsupported position size %d", s.stride)
	}
	n := g.vertexCount
	view, dst := doc.appendBufferView(n*12, 0, gltf.TargetArrayBuffer)
	bounds := minMax{}
	for i := range n {
		src := s.data[i*s.stride:]
		var p [3]float32
		if s.stride == 12 {
			p = [3]float32{readF32(src[0:]), readF32(src[4:]), readF32(src[8:])}
		} else {
			p = [3]float32{readF16(src[0:]), readF16(src[2:]), readF16(src[4:])}
		}
		p = base.Vec3([3]float32{p[0] + offset[0], p[1] + offset[1], p[2] + offset[2]})
		bounds.add(p)
		putVec3(dst[i*12:], p)
	}
	pos := doc.appendAccessor(view, 0, n, gltf.ComponentFloat, gltf.AccessorVec3, false)
	bounds.apply(doc.Accessors[pos])
	g.attributes[gltf.POSITION] = pos
	return nil
}

// writeTexcoords copies f32x2 texcoords as they are, f16x2 are converted
func (doc *Document) writeTexcoords(g *meshGeometry, s cgfStream, attribute string) {
	n := g.vertexCount
	switch s.stride {
	case 8:
		view, dst := doc.appendBufferView(n*8, 0, gltf.TargetArrayBuffer)
		copy(dst, s.data[:n*8])
		// raw copy, then a read only check for non-finite values (rare, fixed in place)
		for i := 0; i < n*2; i++ {
			if v := readF32(dst[i*4:]); finiteOr0(v) != v {
				putF32(dst[i*4:], 0)
			}
		}
		g.attributes[attribute] = doc.appendAccessor(view, 0, n, gltf.ComponentFloat, gltf.AccessorVec2, false)
	case 4:
		view, dst := doc.appendBufferView(n*8, 0, gltf.TargetArrayBuffer)
		for i := range n {
			putF32(dst[i*8:], finiteOr0(readF16(s.data[i*4:])))
			putF32(dst[i*8+4:], finiteOr0(readF16(s.data[i*4+2:])))
		}
		g.attributes[attribute] = doc.appendAccessor(view, 0, n, gltf.ComponentFloat, gltf.AccessorVec2, false)
	default:
		slog.Warn("unsupported texcoord size", "size", s.stride)
	}
}

// writeColors swizzles BGRA vertex colors to RGBA (glTF has no bgra)
func (doc *Document) writeColors(g *meshGeometry, s cgfStream, attribute string) {
	if s.stride != 4 {
		slog.Warn("unsupported color size", "size", s.stride)
		return
	}
	n := g.vertexCount
	view, dst := doc.appendBufferView(n*4, 0, gltf.TargetArrayBuffer)
	for i := range n {
		putBGRA(dst[i*4:], s.data[i*4:])
	}
	g.attributes[attribute] = doc.appendAccessor(view, 0, n, gltf.ComponentUbyte, gltf.AccessorVec4, true)
}

var (
	cryUp      = [3]float32{0, 0, 1}
	cryForward = [3]float32{1, 0, 0}
)

// writeNormals converts an f32x3 normal stream (inline format), normalized
func (doc *Document) writeNormals(g *meshGeometry, s cgfStream, base math.Base, quantize bool) {
	if s.stride != 12 {
		slog.Warn("unsupported normal size", "size", s.stride)
		return
	}
	n := g.vertexCount
	stride := directionStride(quantize)
	view, dst := doc.appendBufferView(n*stride, stride, gltf.TargetArrayBuffer)
	for i := range n {
		src := s.data[i*12:]
		v := unitOr([3]float32{readF32(src[0:]), readF32(src[4:]), readF32(src[8:])}, cryUp)
		writeDirection(dst[i*stride:], base.Vec3(v), quantize)
	}
	g.attributes[gltf.NORMAL] = doc.appendDirectionAccessor(view, 0, n, quantize)
}

// writeTangentFrame converts the tangent stream (tangent + bitangent as snorm16x4, w = sign) into TANGENT and,
// without a normal stream, NORMAL = normalize(cross(t, b)) * sign. Degenerate frames get a perpendicular fallback.
//
// Layout: float [normal f32x3 @0, tangent f32x4 @12] stride 28, quantized [normal snorm16x3 @0, tangent snorm16x4 @8] stride 16.
func (doc *Document) writeTangentFrame(g *meshGeometry, s cgfStream, base math.Base, quantize bool) {
	if s.stride != 16 {
		slog.Warn("unsupported tangent size", "size", s.stride)
		return
	}
	_, hasNormal := g.attributes[gltf.NORMAL]
	withNormal := !hasNormal
	n := g.vertexCount
	normalSize, tangentSize := 12, 16
	if quantize {
		normalSize, tangentSize = 8, 8
	}
	stride := tangentSize
	tangentOffset := 0
	if withNormal {
		stride += normalSize
		tangentOffset = normalSize
	}
	view, dst := doc.appendBufferView(n*stride, stride, gltf.TargetArrayBuffer)
	for i := range n {
		src := s.data[i*16:]
		t := [3]float32{readSnorm16(src[0:]), readSnorm16(src[2:]), readSnorm16(src[4:])}
		sign := float32(1)
		if readSnorm16(src[6:]) < 0 {
			sign = -1
		}
		tu := unitOr(t, cryForward)
		out := dst[i*stride:]
		if withNormal {
			b := [3]float32{readSnorm16(src[8:]), readSnorm16(src[10:]), readSnorm16(src[12:])}
			normal, ok := unit(vecScale(vecCross(t, b), sign))
			if !ok {
				normal = perpendicular(tu)
			}
			writeDirection(out, base.Vec3(normal), quantize)
		}
		tb := base.Vec3(tu)
		tangent := [4]float32{tb[0], tb[1], tb[2], sign}
		if quantize {
			for c := range 4 {
				putSnorm16(out[tangentOffset+c*2:], tangent[c])
			}
		} else {
			putVec4(out[tangentOffset:], tangent)
		}
	}
	if withNormal {
		g.attributes[gltf.NORMAL] = doc.appendDirectionAccessor(view, 0, n, quantize)
	}
	if quantize {
		g.attributes[gltf.TANGENT] = doc.appendAccessor(view, tangentOffset, n, gltf.ComponentShort, gltf.AccessorVec4, true)
	} else {
		g.attributes[gltf.TANGENT] = doc.appendAccessor(view, tangentOffset, n, gltf.ComponentFloat, gltf.AccessorVec4, false)
	}
}

// writeQTangentFrame converts the qtangent stream (quaternion snorm16x4) into NORMAL and TANGENT, like Lumberyard
// QTangent::ToTangentBitangentReflection + SPipQTangents::GetN: tangent = column 0, bitangent = column 1,
// reflection = sign(w), normal = column 2 · reflection. That is the frame of the tangent stream (writeTangentFrame:
// N = cross(t, b) · sign, TANGENT.w = sign), so glTF's bitangent cross(N, T) · w is the engine's column 1.
// Without TANGENT the viewer's normal mapping had no tangent frame (NaN normals in the GBuffer).
//
// Layout like writeTangentFrame with a normal: float [normal f32x3 @0, tangent f32x4 @12] stride 28,
// quantized [normal snorm16x3 @0, tangent snorm16x4 @8] stride 16.
func (doc *Document) writeQTangentFrame(g *meshGeometry, s cgfStream, base math.Base, quantize bool) {
	if s.stride != 8 {
		slog.Warn("unsupported qtangent size", "size", s.stride)
		return
	}
	n := g.vertexCount
	normalSize, tangentSize := 12, 16
	if quantize {
		normalSize, tangentSize = 8, 8
	}
	stride := normalSize + tangentSize
	view, dst := doc.appendBufferView(n*stride, stride, gltf.TargetArrayBuffer)
	for i := range n {
		src := s.data[i*8:]
		x, y, z, w := readSnorm16(src[0:]), readSnorm16(src[2:]), readSnorm16(src[4:]), readSnorm16(src[6:])
		l := float32(gomath.Sqrt(float64(x*x + y*y + z*z + w*w)))
		normal, tangent, sign := cryUp, cryForward, float32(1)
		if l > 1e-6 {
			x, y, z, w = x/l, y/l, z/l, w/l
			if w < 0 {
				sign = -1
			}
			normal = vecScale(unitOr([3]float32{2 * (x*z + y*w), 2 * (y*z - x*w), 1 - 2*(x*x+y*y)}, cryUp), sign)
			tangent = unitOr([3]float32{1 - 2*(y*y+z*z), 2 * (x*y + z*w), 2 * (x*z - y*w)}, perpendicular(normal))
		}
		out := dst[i*stride:]
		writeDirection(out, base.Vec3(normal), quantize)
		tb := base.Vec3(tangent)
		t4 := [4]float32{tb[0], tb[1], tb[2], sign}
		if quantize {
			for c := range 4 {
				putSnorm16(out[normalSize+c*2:], t4[c])
			}
		} else {
			putVec4(out[normalSize:], t4)
		}
	}
	g.attributes[gltf.NORMAL] = doc.appendDirectionAccessor(view, 0, n, quantize)
	if quantize {
		g.attributes[gltf.TANGENT] = doc.appendAccessor(view, normalSize, n, gltf.ComponentShort, gltf.AccessorVec4, true)
	} else {
		g.attributes[gltf.TANGENT] = doc.appendAccessor(view, normalSize, n, gltf.ComponentFloat, gltf.AccessorVec4, false)
	}
}

// writeBoneMapping copies the bone mapping as it is: joints u8x4 + weights u8x4 (8 B) or joints u16x4 + weights u8x4 (12 B)
func (doc *Document) writeBoneMapping(g *meshGeometry, s cgfStream) {
	n := g.vertexCount
	var jointType gltf.ComponentType
	var weightOffset int
	switch s.stride {
	case 8:
		jointType, weightOffset = gltf.ComponentUbyte, 4
	case 12:
		jointType, weightOffset = gltf.ComponentUshort, 8
	default:
		slog.Warn("unsupported bone mapping size", "size", s.stride)
		return
	}
	view, dst := doc.appendBufferView(n*s.stride, s.stride, gltf.TargetArrayBuffer)
	copy(dst, s.data[:n*s.stride])
	g.attributes["JOINTS_0"] = doc.appendAccessor(view, 0, n, jointType, gltf.AccessorVec4, false)
	g.attributes["WEIGHTS_0"] = doc.appendAccessor(view, weightOffset, n, gltf.ComponentUbyte, gltf.AccessorVec4, true)
}

// directionStride is the byte stride of a NORMAL view: f32x3, or snorm16x3 padded to 4 byte alignment
func directionStride(quantize bool) int {
	if quantize {
		return 8
	}
	return 12
}

func writeDirection(out []byte, v [3]float32, quantize bool) {
	if quantize {
		putSnorm16(out[0:], v[0])
		putSnorm16(out[2:], v[1])
		putSnorm16(out[4:], v[2])
		out[6], out[7] = 0, 0
		return
	}
	putVec3(out, v)
}

func (doc *Document) appendDirectionAccessor(view, offset, count int, quantize bool) int {
	if quantize {
		return doc.appendAccessor(view, offset, count, gltf.ComponentShort, gltf.AccessorVec3, true)
	}
	return doc.appendAccessor(view, offset, count, gltf.ComponentFloat, gltf.AccessorVec3, false)
}
