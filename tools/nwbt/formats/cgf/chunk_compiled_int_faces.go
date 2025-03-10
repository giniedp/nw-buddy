package cgf

import (
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/buf"
)

func init() {
	RegisterChunkReader(ChunkType_CompiledIntFaces, 0x0800, ReadChunkCompiledIntFaces)
}

type ChunkCompiledIntFaces struct {
	ChunkHeader
	Faces []IntSkinFace
}

func ReadChunkCompiledIntFaces(r *buf.Reader, header ChunkHeader) (res Chunker, err error) {
	defer utils.HandleRecover(&err, "Read ChunkCompiledIntFaces")
	r.SeekAbsolute(int(header.Offset))

	out := ChunkCompiledIntFaces{}
	out.ChunkHeader = header
	out.Faces = make([]IntSkinFace, header.Size/6)
	for i := range out.Faces {
		out.Faces[i], err = ReadIntSkinFace(r)
		if err != nil {
			return nil, err
		}
	}
	return out, nil
}

type IntSkinFace [3]uint16

func ReadIntSkinFace(r *buf.Reader) (out IntSkinFace, err error) {
	defer utils.HandleRecover(&err)
	out = utils.Must(r.ReadUint16Vec3())
	return
}
