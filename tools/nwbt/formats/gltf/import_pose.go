package gltf

import (
	"github.com/qmuntal/gltf"
)

// ApplyPose sets the local transforms of the joints by controller id (translation xyz, rotation xyzw), all copies of a
// joint (one skeleton per skinned part, or a merged one): the skins deform to the pose, the inverse bind matrices stay.
// Returns the number of posed nodes.
func (doc *Document) ApplyPose(pose map[uint32][7]float32) int {
	if len(pose) == 0 {
		return 0
	}
	posed := 0
	for _, node := range doc.Nodes {
		id, ok := ExtrasLoad[uint32](node.Extras, ExtraKeyControllerID)
		if !ok {
			continue
		}
		transform, ok := pose[id]
		if !ok {
			continue
		}
		// TRS in place of a matrix, the scale stays
		scale := node.ScaleOrDefault()
		node.Matrix = gltf.DefaultMatrix
		node.Translation = [3]float64{float64(transform[0]), float64(transform[1]), float64(transform[2])}
		node.Rotation = [4]float64{float64(transform[3]), float64(transform[4]), float64(transform[5]), float64(transform[6])}
		node.Scale = scale
		posed++
	}
	return posed
}
