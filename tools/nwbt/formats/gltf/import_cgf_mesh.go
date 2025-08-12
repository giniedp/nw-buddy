package gltf

import (
	"fmt"
	"log/slog"
	gomath "math"
	"nw-buddy/tools/formats/cgf"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/buf"
	"nw-buddy/tools/utils/math"
	"nw-buddy/tools/utils/math/mat4"
	"slices"
	"strings"

	"github.com/x448/float16"

	"github.com/qmuntal/gltf"
	"github.com/qmuntal/gltf/modeler"
)

func (d *Document) ImportCgfMesh(name string, chunk cgf.ChunkMesh, cgfile *cgf.File, heap []byte, materialLookup MaterialLookup) (*int, *gltf.Mesh) {

	subsets, hasSubsets := cgf.FindChunk[cgf.ChunkMeshSubsets](cgfile, chunk.SubsetsChunkId)
	if !hasSubsets {
		return nil, nil
	}

	mesh := &gltf.Mesh{}
	for i, subset := range subsets.Subsets {
		material := materialLookup.Get(int(subset.MaterialId))
		if material != nil && strings.Contains(strings.ToLower(material.Name), "shadow_proxy") {
			continue
		}
		mtl := lookupMtl(material)
		if mtl != nil && mtl.CanBeSkipped() {
			continue
		}

		subRefId := subsetRefId(cgfile, chunk, i)
		var primitive *gltf.Primitive
		if found := d.FindPrimitiveByRef(subRefId); found != nil {
			primitive = d.CopyPrimitive(found)
		} else if prim, err := convertPrimitive(d.Document, subset, chunk, cgfile, heap); err != nil {
			slog.Warn("Failed to convert primitive", "ref", subRefId, "err", err)
			continue
		} else {
			primitive = prim
		}
		if primitive == nil {
			continue
		}
		primitive.Extras = ExtrasStore(primitive.Extras, ExtraKeyRefID, subRefId)
		primitive.Extras = ExtrasStore(primitive.Extras, ExtraKeySource, cgfile.Source)
		primitive.Extras = ExtrasStore(primitive.Extras, ExtraKeyName, name)

		index := slices.Index(d.Materials, material)
		if index != -1 {
			primitive.Material = gltf.Index(index)
		}
		mesh.Primitives = append(mesh.Primitives, primitive)
	}

	if len(mesh.Primitives) == 0 {
		return nil, nil
	}

	return d.AppendMesh(mesh), mesh
}

func subsetRefId(cgfile *cgf.File, chunk cgf.ChunkMesh, subset int) string {
	if cgfile.Source == "" {
		return ""
	}
	return hashString(fmt.Sprintf("%s_%d_%d_%d", cgfile.Source, chunk.Id, chunk.SubsetsChunkId, subset))
}

func convertPrimitive(doc *gltf.Document, subset cgf.MeshSubset, chunk cgf.ChunkMesh, cgFile *cgf.File, heap []byte) (out *gltf.Primitive, err error) {
	defer utils.HandleRecover(&err)

	out = &gltf.Primitive{
		Indices:    nil,
		Mode:       gltf.PrimitiveTriangles,
		Attributes: gltf.PrimitiveAttributes{},
	}

	for streamTypeId, ids := range chunk.StreamChunkID {
		for _, id := range ids {
			if id == 0 {
				continue
			}
			streamType := cgf.DataStreamType(streamTypeId)
			if stream, ok := cgf.FindChunk[cgf.ChunkDataStream](cgFile, id); ok {
				convertPrimitiveStream(doc, subset, stream, out)
				continue
			}
			if ref, ok := cgf.FindChunk[cgf.ChunkDataRef](cgFile, id); ok {
				convertPrimitiveRef(doc, subset, streamType, ref, heap, out)
				continue
			}

		}
	}
	if len(out.Attributes) == 0 {
		err = fmt.Errorf("no attributes found for primitive in %s", cgFile.Source)
	}
	return
}

func convertPrimitiveStream(doc *gltf.Document, subset cgf.MeshSubset, stream cgf.ChunkDataStream, out *gltf.Primitive) {
	switch stream.StreamType {
	case cgf.STREAM_TYPE_INDICES:
		r := buf.NewReaderLE(stream.Data)
		r.SeekAbsolute(int(stream.ElementSize) * int(subset.FirstIndex))
		switch stream.ElementSize {
		case 2:
			indices := make([]uint16, subset.NumIndices)
			for i := range indices {
				indices[i] = r.MustReadUint16() - uint16(subset.FirstVertex)
			}
			out.Indices = gltf.Index(modeler.WriteIndices(doc, indices))
		case 4:
			indices := make([]uint32, subset.NumIndices)
			for i := range indices {
				indices[i] = r.MustReadUint32() - uint32(subset.FirstVertex)
			}
			out.Indices = gltf.Index(modeler.WriteIndices(doc, indices))
		default:
			slog.Warn("Unsupported index size", "size", stream.ElementSize)
		}
	case cgf.STREAM_TYPE_POSITIONS:
		r := buf.NewReaderLE(stream.Data)
		r.SeekAbsolute(int(stream.ElementSize) * int(subset.FirstVertex))
		switch stream.ElementSize {
		case 12:
			vertices := make([][3]float32, subset.NumVertices)
			for i := range vertices {
				vertices[i] = math.CryToGltfVec3([3]float32{
					r.MustReadFloat32(),
					r.MustReadFloat32(),
					r.MustReadFloat32(),
				})
			}
			out.Attributes[gltf.POSITION] = modeler.WritePosition(doc, vertices)
		case 8:
			vertices := make([][3]float32, subset.NumVertices)
			for i := range subset.NumVertices {
				vertices[i] = math.CryToGltfVec3([3]float32{
					float16.Float16(r.MustReadUint16()).Float32(),
					float16.Float16(r.MustReadUint16()).Float32(),
					float16.Float16(r.MustReadUint16()).Float32(),
				})
				r.SeekRelative(2)
			}
			out.Attributes[gltf.POSITION] = modeler.WritePosition(doc, vertices)
		default:
			slog.Warn("Unsupported position size", "size", stream.ElementSize)
		}
	case cgf.STREAM_TYPE_NORMALS:
		r := buf.NewReaderLE(stream.Data)
		r.SeekAbsolute(int(stream.ElementSize) * int(subset.FirstVertex))
		switch stream.ElementSize {
		case 12:
			vertices := make([][3]float32, subset.NumVertices)
			for i := range subset.NumVertices {
				vertices[i] = math.CryToGltfVec3([3]float32{
					r.MustReadFloat32(),
					r.MustReadFloat32(),
					r.MustReadFloat32(),
				})
			}
			out.Attributes[gltf.NORMAL] = modeler.WriteNormal(doc, vertices)
		case 8:
			r := buf.NewReaderLE(stream.Data)
			r.SeekRelative(8 * int(subset.FirstVertex))
			vertices := make([][3]float32, subset.NumVertices)
			for i := range subset.NumVertices {
				vertices[i] = math.CryToGltfVec3([3]float32{
					float16.Float16(r.MustReadUint16()).Float32(),
					float16.Float16(r.MustReadUint16()).Float32(),
					float16.Float16(r.MustReadUint16()).Float32(),
				})
				r.SeekRelative(2)
			}
			out.Attributes[gltf.NORMAL] = modeler.WriteNormal(doc, vertices)
		default:
			slog.Warn("Unsupported normal size", "size", stream.ElementSize)
		}
	case cgf.STREAM_TYPE_TANGENTS:
		r := buf.NewReaderLE(stream.Data)
		r.SeekAbsolute(int(stream.ElementSize) * int(subset.FirstVertex))
		switch stream.ElementSize {
		case 16:
			tangents := make([][4]float32, subset.NumVertices)
			normals := make([][3]float32, subset.NumVertices)
			for i := range subset.NumVertices {
				t := math.CryToGltfQuat([4]float32{
					float32(r.MustReadInt16()) / 32767.0,
					float32(r.MustReadInt16()) / 32767.0,
					float32(r.MustReadInt16()) / 32767.0,
					float32(r.MustReadInt16()) / 32767.0,
				})
				b := math.CryToGltfQuat([4]float32{
					float32(r.MustReadInt16()) / 32767.0,
					float32(r.MustReadInt16()) / 32767.0,
					float32(r.MustReadInt16()) / 32767.0,
					float32(r.MustReadInt16()) / 32767.0,
				})
				tangents[i] = t
				normals[i] = [3]float32{
					(t[1]*b[2] - t[2]*b[1]) * t[3],
					(t[2]*b[0] - t[0]*b[2]) * t[3],
					(t[0]*b[1] - t[1]*b[0]) * t[3],
				}
			}
			out.Attributes[gltf.TANGENT] = modeler.WriteTangent(doc, tangents)
			out.Attributes[gltf.NORMAL] = modeler.WriteNormal(doc, normals)
		default:
			slog.Warn("Unsupported tangent size", "size", stream.ElementSize)
		}
	case cgf.STREAM_TYPE_TEXCOORDS:
		r := buf.NewReaderLE(stream.Data)
		r.SeekAbsolute(int(stream.ElementSize) * int(subset.FirstVertex))
		switch stream.ElementSize {
		case 8:
			coords := make([][2]float32, subset.NumVertices)
			for i := range subset.NumVertices {
				coords[i] = [2]float32{
					r.MustReadFloat32(),
					r.MustReadFloat32(),
				}
			}
			out.Attributes[gltf.TEXCOORD_0] = modeler.WriteTextureCoord(doc, coords)
		default:
			slog.Warn("Unsupported texcoord size", "size", stream.ElementSize)
		}
	case cgf.STREAM_TYPE_COLORS:
		r := buf.NewReaderLE(stream.Data)
		r.SeekAbsolute(int(stream.ElementSize) * int(subset.FirstVertex))
		switch stream.ElementSize {
		case 4:
			data := make([][4]uint8, subset.NumVertices)
			for i := range subset.NumVertices {
				data[i] = [4]uint8{
					uint8(r.MustReadByte()),
					uint8(r.MustReadByte()),
					uint8(r.MustReadByte()),
					uint8(r.MustReadByte()),
				}
			}
			out.Attributes[gltf.COLOR_0] = modeler.WriteColor(doc, data)
		default:
			slog.Warn("Unsupported color size", "size", stream.ElementSize)
		}
	case cgf.STREAM_TYPE_COLORS2:
		r := buf.NewReaderLE(stream.Data)
		r.SeekAbsolute(int(stream.ElementSize) * int(subset.FirstVertex))
		switch stream.ElementSize {
		case 4:
			data := make([][4]uint8, subset.NumVertices)
			for i := range subset.NumVertices {
				data[i] = [4]uint8{
					uint8(r.MustReadByte()),
					uint8(r.MustReadByte()),
					uint8(r.MustReadByte()),
					uint8(r.MustReadByte()),
				}
			}
			out.Attributes["COLOR_1"] = modeler.WriteColor(doc, data)
		default:
			slog.Warn("Unsupported color size", "size", stream.ElementSize)
		}
	case cgf.STREAM_TYPE_BONEMAPPING:
		r := buf.NewReaderLE(stream.Data)
		r.SeekAbsolute(int(stream.ElementSize) * int(subset.FirstVertex))
		switch stream.ElementSize {
		case 8:
			joints := make([][4]uint8, subset.NumVertices)
			weights := make([][4]uint8, subset.NumVertices)
			for i := range subset.NumVertices {
				joints[i] = [4]uint8{
					r.MustReadUint8(),
					r.MustReadUint8(),
					r.MustReadUint8(),
					r.MustReadUint8(),
				}
				weights[i] = [4]uint8{
					r.MustReadUint8(),
					r.MustReadUint8(),
					r.MustReadUint8(),
					r.MustReadUint8(),
				}
			}
			out.Attributes["JOINTS_0"] = modeler.WriteJoints(doc, joints)
			out.Attributes["WEIGHTS_0"] = modeler.WriteWeights(doc, weights)
		case 12:
			joints := make([][4]uint16, subset.NumVertices)
			weights := make([][4]uint8, subset.NumVertices)
			for i := range subset.NumVertices {
				joints[i] = [4]uint16{
					r.MustReadUint16(),
					r.MustReadUint16(),
					r.MustReadUint16(),
					r.MustReadUint16(),
				}
				weights[i] = [4]uint8{
					r.MustReadUint8(),
					r.MustReadUint8(),
					r.MustReadUint8(),
					r.MustReadUint8(),
				}
			}
			out.Attributes["JOINTS_0"] = modeler.WriteJoints(doc, joints)
			out.Attributes["WEIGHTS_0"] = modeler.WriteWeights(doc, weights)
		default:
			slog.Warn("Unsupported bone size", "size", stream.ElementSize)
		}
	case cgf.STREAM_TYPE_QTANGENTS:
		r := buf.NewReaderLE(stream.Data)
		r.SeekAbsolute(int(stream.ElementSize) * int(subset.FirstVertex))
		normals := make([][3]float32, subset.NumVertices)
		tangents := make([][4]float32, subset.NumVertices)
		switch stream.ElementSize {
		case 8:
			//factor := float32(1.0 / 1023.0)
			factor := float32(1.0 / 32767.0)

			for i := range subset.NumVertices {
				// decode quaternion
				x := float32(r.MustReadInt16()) * factor
				y := float32(r.MustReadInt16()) * factor
				z := float32(r.MustReadInt16()) * factor
				w := float32(r.MustReadInt16()) * factor

				// normalize quaternion
				length := gomath.Sqrt(float64(x*x + y*y + z*z + w*w))
				x /= float32(length)
				y /= float32(length)
				z /= float32(length)
				w /= float32(length)

				// convert quaternion to matrix
				m4 := mat4.FromQuatXYZW(x, y, z, w)

				tangent := math.CryToGltfVec4([4]float32{
					m4[0],
					m4[1],
					m4[2],
					1.0,
				})
				if w < 0 {
					tangent[3] = -1.0
				}
				tangents[i] = tangent

				normal := math.CryToGltfVec3([3]float32{
					m4[8],
					m4[9],
					m4[10],
				})
				if w < 0 {
					normal[0] = -normal[0]
					normal[1] = -normal[1]
					normal[2] = -normal[2]
				}
				normals[i] = normal
			}
		}
		if _, ok := out.Attributes[gltf.NORMAL]; !ok {
			out.Attributes[gltf.NORMAL] = modeler.WriteNormal(doc, normals)
		}
		// if _, ok := out.Attributes[gltf.TANGENT]; !ok {
		// 	out.Attributes[gltf.TANGENT] = modeler.WriteTangent(doc, tangents)
		// }
	default:
		slog.Debug("unknown", "size", stream.ElementSize, "firstIndex", subset.FirstIndex, "numIndices", subset.NumIndices)
		slog.Warn("Unsupported stream type", "type", stream.StreamType)
	}
	return
}

func convertPrimitiveRef(doc *gltf.Document, subset cgf.MeshSubset, streamType cgf.DataStreamType, ref cgf.ChunkDataRef, heap []byte, out *gltf.Primitive) {
	switch streamType {
	case cgf.STREAM_TYPE_INDICES:
		r := buf.NewReaderLE(heap)
		r.SeekAbsolute(int(ref.Offset))
		r.SeekRelative(int(ref.Stride) * int(subset.FirstIndex))
		switch ref.Stride {
		case 2:
			indices := make([]uint16, subset.NumIndices)
			for i := range indices {
				indices[i] = r.MustReadUint16() - uint16(subset.FirstVertex)
			}
			out.Indices = gltf.Index(modeler.WriteIndices(doc, indices))
		case 4:
			indices := make([]uint32, subset.NumIndices)
			for i := range indices {
				indices[i] = r.MustReadUint32() - uint32(subset.FirstVertex)
			}
			out.Indices = gltf.Index(modeler.WriteIndices(doc, indices))
		}

	case cgf.STREAM_TYPE_POSITIONS:
		r := buf.NewReaderLE(heap)
		r.SeekAbsolute(int(ref.Offset) + int(ref.Stride)*int(subset.FirstVertex))
		vertices := make([][3]float32, subset.NumVertices)

		switch ref.Stride {
		case 16:
			{
				for i := range subset.NumVertices {
					vertices[i] = math.CryToGltfVec3([3]float32{
						float16.Float16(r.MustReadUint16()).Float32(), // 2 byte X
						float16.Float16(r.MustReadUint16()).Float32(), // 2 byte Y
						float16.Float16(r.MustReadUint16()).Float32(), // 2 byte Z
					})
					r.SeekRelative(2) // unused
					r.SeekRelative(4) // color
					r.SeekRelative(4) // texture
				}
			}
		case 24:
			{
				for i := range subset.NumVertices {
					vertices[i] = math.CryToGltfVec3([3]float32{
						r.MustReadFloat32(), // 4 byte X
						r.MustReadFloat32(), // 4 byte Y
						r.MustReadFloat32(), // 4 byte Z
					})
					r.SeekRelative(4) // color
					r.SeekRelative(8) // texture
				}
			}
		default:
			{
				slog.Warn("Unsupported position stride", "stride", ref.Stride, "ref", ref)
				return
			}
		}
		out.Attributes[gltf.POSITION] = modeler.WritePosition(doc, vertices)
	case cgf.STREAM_TYPE_TEXCOORDS:
		r := buf.NewReaderLE(heap)
		r.SeekAbsolute(int(ref.Offset) + int(ref.Stride)*int(subset.FirstVertex))
		coords := make([][2]float32, subset.NumVertices)

		switch ref.Stride {
		case 16:
			{
				for i := range subset.NumVertices {
					r.SeekRelative(8) // position
					r.SeekRelative(4) // color
					coords[i] = [2]float32{
						float16.Float16(r.MustReadUint16()).Float32(),
						float16.Float16(r.MustReadUint16()).Float32(),
					}
				}
			}
		case 24:
			{
				for i := range subset.NumVertices {
					r.SeekRelative(12) // position
					r.SeekRelative(4)  // color
					coords[i] = [2]float32{
						r.MustReadFloat32(),
						r.MustReadFloat32(),
					}
				}
			}
		default:
			{
				slog.Warn("Unsupported texture stride", "stride", ref.Stride, "ref", ref)
				return
			}
		}

		out.Attributes[gltf.TEXCOORD_0] = modeler.WriteTextureCoord(doc, coords)

	case cgf.STREAM_TYPE_COLORS:
		r := buf.NewReaderLE(heap)
		r.SeekAbsolute(int(ref.Offset) + int(ref.Stride)*int(subset.FirstVertex))
		data := make([][4]uint8, subset.NumVertices)

		switch ref.Stride {
		case 16:
			{
				for i := range subset.NumVertices {
					r.SeekRelative(8) // position
					data[i] = [4]uint8{
						uint8(r.MustReadByte()),
						uint8(r.MustReadByte()),
						uint8(r.MustReadByte()),
						uint8(r.MustReadByte()),
					}
					r.SeekRelative(4) // texture
				}
			}
		case 24:
			{
				for i := range subset.NumVertices {
					r.SeekRelative(12) // position
					data[i] = [4]uint8{
						uint8(r.MustReadByte()),
						uint8(r.MustReadByte()),
						uint8(r.MustReadByte()),
						uint8(r.MustReadByte()),
					}
					r.SeekRelative(8) // texture
				}
			}
		default:
			{
				slog.Warn("Unsupported color stride", "stride", ref.Stride, "ref", ref)
				return
			}
		}
		out.Attributes[gltf.COLOR_0] = modeler.WriteColor(doc, data)

	case cgf.STREAM_TYPE_TANGENTS:
		if ref.Stride != 16 {
			slog.Warn("Unsupported tangent stride", "stride", ref.Stride, "ref", ref)
			return
		}
		r := buf.NewReaderLE(heap)
		r.SeekAbsolute(int(ref.Offset) + int(ref.Stride)*int(subset.FirstVertex))

		normals := make([][3]float32, subset.NumVertices)
		tangents := make([][4]float32, subset.NumVertices)

		factor := float32(1.0 / 32767.0)

		for i := range subset.NumVertices {

			// Read normal
			tx := float32(r.MustReadInt16()) * factor
			ty := float32(r.MustReadInt16()) * factor
			tz := float32(r.MustReadInt16()) * factor
			tw := float32(r.MustReadInt16()) * factor

			// Read tangent
			bx := float32(r.MustReadInt16()) * factor
			by := float32(r.MustReadInt16()) * factor
			bz := float32(r.MustReadInt16()) * factor
			r.MustReadInt16()

			tangent := math.CryToGltfVec3([3]float32{tx, ty, tz})
			bitangent := math.CryToGltfVec3([3]float32{bx, by, bz})

			normals[i] = math.Normalize(math.Cross(tangent, bitangent))
			if tw < 0 {
				normals[i][0] = -normals[i][0]
				normals[i][1] = -normals[i][1]
				normals[i][2] = -normals[i][2]
			}
			tangents[i][0] = tangent[0]
			tangents[i][1] = tangent[1]
			tangents[i][2] = tangent[2]
			tangents[i][3] = tw
		}

		out.Attributes[gltf.NORMAL] = modeler.WriteNormal(doc, normals)
		out.Attributes[gltf.TANGENT] = modeler.WriteTangent(doc, tangents)
	}

}
