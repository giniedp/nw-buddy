package chunks

import (
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/buf"
)

type Node struct {
	Header               Header
	Name                 string
	ObjectId             int32
	ParentId             int32
	NumChildren          int32
	MaterialId           int32
	Transform            []float32
	PositionControllerId int32
	RotationControllerId int32
	ScaleControllerId    int32
	PropertyString       string
}

func (h *Header) Read_0824(r *buf.Reader) (out any, err error) {
	defer utils.HandleRecover(&err, "read_0824")

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

	chunk := Node{
		Header: *h,
	}
	r.SeekAbsolute(int(h.Offset))
	chunk.Name = string(utils.Must(r.ReadUntilByteCapped(0, 64)))
	chunk.ObjectId = utils.Must(r.ReadInt32())
	chunk.ParentId = utils.Must(r.ReadInt32())
	chunk.NumChildren = utils.Must(r.ReadInt32())
	chunk.MaterialId = utils.Must(r.ReadInt32())
	r.SeekRelative(4)
	chunk.Transform = utils.Must(r.ReadFloat32Array(16))
	r.SeekRelative(10)
	chunk.PositionControllerId = utils.Must(r.ReadInt32())
	chunk.RotationControllerId = utils.Must(r.ReadInt32())
	chunk.ScaleControllerId = utils.Must(r.ReadInt32())
	strLen := utils.Must(r.ReadInt32())
	if strLen > 0 {
		chunk.PropertyString = string(utils.Must(r.ReadUntilByteCapped(0, int(strLen))))
	}
	return chunk, nil
}
