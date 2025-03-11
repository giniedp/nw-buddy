package gltf

import (
	"log/slog"
	"nw-buddy/tools/formats/cgf"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/buf"
	"slices"
	"strings"

	"github.com/x448/float16"

	"github.com/qmuntal/gltf"
	"github.com/qmuntal/gltf/modeler"
)

func (d *Document) ImportCgfMesh(chunk cgf.ChunkMesh, cgfile *cgf.File, materials []*gltf.Material) (*int, *gltf.Mesh) {
	subsets, hasSubsets := cgf.FindChunk[cgf.ChunkMeshSubsets](cgfile, chunk.SubsetsChunkId)
	if !hasSubsets {
		return nil, nil
	}

	mesh := &gltf.Mesh{}
	for _, subset := range subsets.Subsets {
		var material *gltf.Material
		if subset.MaterialId >= 0 && len(materials) > 0 {
			if int(subset.MaterialId) < len(materials) {
				material = materials[subset.MaterialId]
			}
			if material == nil {
				material = materials[0]
			}
		}
		if material != nil && strings.Contains(strings.ToLower(material.Name), "shadow_proxy") {
			continue
		}
		mtl := lookupMtl(material)
		if mtl != nil && mtl.CanBeSkipped() {
			continue
		}
		primitive, err := convertPrimitive(d.Document, subset, chunk, cgfile)
		if err != nil {
			slog.Warn("Failed to convert primitive", "err", err)
			continue
		}
		if primitive == nil {
			continue
		}
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

func convertPrimitive(doc *gltf.Document, subset cgf.MeshSubset, chunk cgf.ChunkMesh, cgFile *cgf.File) (out *gltf.Primitive, err error) {
	defer utils.HandleRecover(&err)

	out = &gltf.Primitive{
		Indices:    nil,
		Mode:       gltf.PrimitiveTriangles,
		Attributes: gltf.PrimitiveAttributes{},
	}

	for _, ids := range chunk.StreamChunkID {
		for _, id := range ids {
			if id == 0 {
				continue
			}
			stream, hasStream := cgf.FindChunk[cgf.ChunkDataStream](cgFile, id)
			if !hasStream {
				continue
			}

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
						vertices[i] = CryToGltfVec3([3]float32{
							r.MustReadFloat32(),
							r.MustReadFloat32(),
							r.MustReadFloat32(),
						})
					}
					out.Attributes[gltf.POSITION] = modeler.WritePosition(doc, vertices)
				case 8:
					vertices := make([][3]float32, subset.NumVertices)
					for i := range subset.NumVertices {
						vertices[i] = CryToGltfVec3([3]float32{
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
						vertices[i] = CryToGltfVec3([3]float32{
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
						vertices[i] = CryToGltfVec3([3]float32{
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
						t := CryToGltfQuat([4]float32{
							float32(r.MustReadInt16()) / 32767.0,
							float32(r.MustReadInt16()) / 32767.0,
							float32(r.MustReadInt16()) / 32767.0,
							float32(r.MustReadInt16()) / 32767.0,
						})
						b := CryToGltfQuat([4]float32{
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
			}
		}
	}
	return
}
