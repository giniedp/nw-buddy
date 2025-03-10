package cgf

import (
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/buf"
)

func init() {
	RegisterChunkReader(ChunkType_Node, 0x0824, ReadChunkNode_0x0824)
}

type ChunkNode struct {
	ChunkHeader
	Name                 string
	ObjectId             int32
	ParentId             int32
	NumChildren          int32
	MaterialId           int32
	Transform            [16]float32
	PositionControllerId int32
	RotationControllerId int32
	ScaleControllerId    int32
	PropertyString       string
}

func ReadChunkNode_0x0824(r *buf.Reader, header ChunkHeader) (res Chunker, err error) {
	defer utils.HandleRecover(&err, "Read ChunkNode 0x0824")

	// STRUCT_INFO_BEGIN(NODE_CHUNK_DESC_0824)
	// STRUCT_VAR_INFO(name, TYPE_ARRAY(64, TYPE_INFO(char)))
	// STRUCT_VAR_INFO(ObjectID, TYPE_INFO(int))
	// STRUCT_VAR_INFO(ParentID, TYPE_INFO(int))
	// STRUCT_VAR_INFO(nChildren, TYPE_INFO(int))
	// STRUCT_VAR_INFO(MatID, TYPE_INFO(int))
	// STRUCT_VAR_INFO(_obsoleteA_, TYPE_ARRAY(4, TYPE_INFO(uint8)))
	// STRUCT_VAR_INFO(tm, TYPE_ARRAY(4, TYPE_ARRAY(4, TYPE_INFO(float))))
	// STRUCT_VAR_INFO(_obsoleteB_, TYPE_ARRAY(3, TYPE_INFO(float)))
	// STRUCT_VAR_INFO(_obsoleteC_, TYPE_ARRAY(4, TYPE_INFO(float)))
	// STRUCT_VAR_INFO(_obsoleteD_, TYPE_ARRAY(3, TYPE_INFO(float)))
	// STRUCT_VAR_INFO(pos_cont_id, TYPE_INFO(int))
	// STRUCT_VAR_INFO(rot_cont_id, TYPE_INFO(int))
	// STRUCT_VAR_INFO(scl_cont_id, TYPE_INFO(int))
	// STRUCT_VAR_INFO(PropStrLen, TYPE_INFO(int))
	// STRUCT_INFO_END(NODE_CHUNK_DESC_0824)

	out := ChunkNode{}
	out.ChunkHeader = header
	r.SeekAbsolute(int(header.Offset))

	out.Name = utils.Must(r.ReadCStringFixedBlock(64))
	out.ObjectId = r.MustReadInt32()
	out.ParentId = r.MustReadInt32()
	out.NumChildren = r.MustReadInt32()
	out.MaterialId = r.MustReadInt32()
	r.SeekRelative(4)
	for i := range out.Transform {
		out.Transform[i] = r.MustReadFloat32()
	}
	out.Transform[12] *= 0.01
	out.Transform[13] *= 0.01
	out.Transform[14] *= 0.01
	out.Transform[15] = 1
	r.SeekRelative(10) // 3 + 4 + 3
	out.PositionControllerId = r.MustReadInt32()
	out.RotationControllerId = r.MustReadInt32()
	out.ScaleControllerId = r.MustReadInt32()
	strLen := r.MustReadInt32()
	if strLen > 0 {
		out.PropertyString = utils.Must(r.ReadCStringFixedBlock(int(strLen)))
	}

	// slog.Debug("Node", "name", out.Name, "id", out.Id, "parent", out.ParentId, "objectId", out.ObjectId, "numChildren", out.NumChildren)
	return out, nil
}
