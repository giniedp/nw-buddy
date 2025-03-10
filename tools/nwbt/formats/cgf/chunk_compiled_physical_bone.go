package cgf

import (
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/buf"
)

func init() {
	RegisterChunkReader(ChunkType_CompiledPhysicalBones, 0x0800, ReadChunkCompiledPhysicalBone)
}

type ChunkCompiledPhysicalBone struct {
	ChunkHeader
	Bones []BoneEntity
}

func ReadChunkCompiledPhysicalBone(r *buf.Reader, header ChunkHeader) (res Chunker, err error) {
	defer utils.HandleRecover(&err, "Read ChunkCompiledPhysicalBone")
	r.SeekAbsolute(int(header.Offset))
	r.SeekRelative(32)

	out := ChunkCompiledPhysicalBone{}
	out.ChunkHeader = header
	boneCount := (header.Size - 32) / 152
	out.Bones = make([]BoneEntity, boneCount)
	for i := range out.Bones {
		out.Bones[i], err = ReadBoneEntity(r)
		if err != nil {
			return nil, err
		}
	}

	return out, nil
}

type BoneEntity struct {
	BoneId       int32
	ParentId     int32
	NumChildren  int32
	ControllerId int32  // Id of controller (CRC32 From name of bone).
	Prop         string // char[32];
	Phys         BonePhysics
}

func ReadBoneEntity(r *buf.Reader) (out BoneEntity, err error) {
	defer utils.HandleRecover(&err)

	out.BoneId = utils.Must(r.ReadInt32())
	out.ParentId = utils.Must(r.ReadInt32())
	out.NumChildren = utils.Must(r.ReadInt32())
	out.ControllerId = utils.Must(r.ReadInt32())
	out.Prop = utils.Must(r.ReadCStringFixedBlock(32))
	out.Phys = utils.Must(ReadBonePysics(r))
	return
}
