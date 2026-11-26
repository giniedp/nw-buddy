package gltf

import (
	"fmt"
	"iter"
	"log/slog"
	"nw-buddy/tools/formats/cgf"
	"nw-buddy/tools/utils/math"
	"nw-buddy/tools/utils/math/mat4"

	"github.com/qmuntal/gltf"
	"github.com/qmuntal/gltf/binary"
	"github.com/qmuntal/gltf/modeler"
)

func (doc *Document) ImportCgfSkin(cgfile *cgf.File, chunk cgf.ChunkCompiledBones, base math.Base) (*int, error) {
	if len(chunk.Bones) == 0 {
		slog.Debug("no bones", "file", cgfile.Source)
		return nil, nil
	}

	gltfBones := make([]*gltf.Node, len(chunk.Bones))
	transforms := make([]mat4.Data, len(chunk.Bones))
	inverse := make([]mat4.Data, len(chunk.Bones))
	for i, bone := range chunk.Bones {
		transforms[i] = base.Mat4(mat4.Transpose(mat4.Data{
			bone.BoneToWorld[0],
			bone.BoneToWorld[1],
			bone.BoneToWorld[2],
			bone.BoneToWorld[3],
			bone.BoneToWorld[4],
			bone.BoneToWorld[5],
			bone.BoneToWorld[6],
			bone.BoneToWorld[7],
			bone.BoneToWorld[8],
			bone.BoneToWorld[9],
			bone.BoneToWorld[10],
			bone.BoneToWorld[11],
			0,
			0,
			0,
			1,
		}))
		inverse[i] = base.Mat4(mat4.Transpose(mat4.Data{
			bone.WorldToBone[0],
			bone.WorldToBone[1],
			bone.WorldToBone[2],
			bone.WorldToBone[3],
			bone.WorldToBone[4],
			bone.WorldToBone[5],
			bone.WorldToBone[6],
			bone.WorldToBone[7],
			bone.WorldToBone[8],
			bone.WorldToBone[9],
			bone.WorldToBone[10],
			bone.WorldToBone[11],
			0,
			0,
			0,
			1,
		}))
		gltfBones[i], _ = doc.NewNode()
		gltfBones[i].Name = bone.BoneName
		gltfBones[i].Extras = map[string]any{
			ExtraKeyControllerID: bone.ControllerId,
			ExtraKeyLimbID:       bone.LimbId,
			ExtraKeyInverse:      inverse[i],
		}
	}

	for i, bone := range chunk.Bones {
		gltfBone := gltfBones[i]
		transform := transforms[i]

		if bone.M_nOffsetParent == 0 {
			scene := doc.DefaultScene()
			scene.Nodes = append(scene.Nodes, doc.NodeIndex(gltfBone))
		} else {
			parentIndex := i + int(bone.M_nOffsetParent)
			if parentIndex >= len(chunk.Bones) || parentIndex < 0 {
				return nil, fmt.Errorf("parent index out of bounds %d len %d i %d offset %d", parentIndex, len(chunk.Bones), i, int(bone.M_nOffsetParent))
			}
			gltfParent := gltfBones[parentIndex]
			gltfParent.Children = append(gltfParent.Children, doc.NodeIndex(gltfBone))
			transform = mat4.Multiply(inverse[parentIndex], transform)
		}
		gltfBone.Matrix = mat4.ToFloat64(transform)
	}

	joints := make([]int, 0)
	for i := range chunk.Bones {
		joints = append(joints, doc.NodeIndex(gltfBones[i]))
	}

	data := make([][4][4]float32, 0)
	for _, mat := range inverse {
		data = append(data, [4][4]float32{
			{mat[0], mat[4], mat[8], mat[12]},
			{mat[1], mat[5], mat[9], mat[13]},
			{mat[2], mat[6], mat[10], mat[14]},
			{mat[3], mat[7], mat[11], mat[15]},
		})
	}
	accessor := modeler.WriteAccessor(doc.Document, gltf.TargetNone, data)

	doc.Document.Skins = append(doc.Skins, &gltf.Skin{
		Joints:              joints,
		InverseBindMatrices: gltf.Index(accessor),
	})

	return gltf.Index(len(doc.Skins) - 1), nil
}

func (doc *Document) MergeSkins() {
	if len(doc.Skins) <= 1 {
		return
	}

	newSkinIndex := len(doc.Skins)
	newSkin := &gltf.Skin{}
	doc.Skins = append(doc.Skins, newSkin)

	for _, oldSkin := range doc.Skins {
		for _, i := range oldSkin.Joints {
			joint := doc.Nodes[i]
			newNode := doc.jointCopy(joint, newSkin)
			if parent := doc.NodeParent(newNode); parent != nil {
				continue
			}
			if parent := doc.NodeParent(joint); parent != nil {
				newParent := doc.jointCopy(parent, newSkin)
				if !doc.NodeHasChild(newParent, newNode) {
					doc.NodeAddChild(newParent, newNode)
				}
			}
		}
	}

	data := make([][4][4]float32, 0)
	for node := range doc.EachSkinNode(newSkin) {
		if doc.NodeParent(node) == nil {
			scene := doc.DefaultScene()
			scene.Nodes = append(scene.Nodes, doc.NodeIndex(node))
		}
		mat, _ := ExtrasLoad[mat4.Data](node.Extras, ExtraKeyInverse)
		data = append(data, [4][4]float32{
			{mat[0], mat[4], mat[8], mat[12]},
			{mat[1], mat[5], mat[9], mat[13]},
			{mat[2], mat[6], mat[10], mat[14]},
			{mat[3], mat[7], mat[11], mat[15]},
		})
	}
	accessor := modeler.WriteAccessor(doc.Document, gltf.TargetNone, data)
	newSkin.InverseBindMatrices = gltf.Index(accessor)

	// primitives of a mesh share their JOINTS_0 accessor, remap each accessor once
	remapped := map[int]bool{}
	for _, node := range doc.Nodes {
		if node.Skin == nil || node.Mesh == nil {
			continue
		}
		oldSkin := doc.Skins[*node.Skin]
		node.Skin = gltf.Index(newSkinIndex)

		mesh := doc.Meshes[*node.Mesh]
		for _, primitive := range mesh.Primitives {
			attr, ok := primitive.Attributes["JOINTS_0"]
			if !ok || remapped[attr] {
				continue
			}
			remapped[attr] = true
			acc := doc.Accessors[attr]
			view := doc.BufferViews[*acc.BufferView]
			buf := doc.Buffers[view.Buffer]
			pos := view.ByteOffset + acc.ByteOffset

			switch acc.ComponentType {
			case gltf.ComponentUbyte:
				tmp := make([][4]uint8, acc.Count)
				binary.Read(buf.Data[pos:], view.ByteStride, tmp)
				for i, v := range tmp {
					for j, oldIndex := range v {
						joint := oldSkin.Joints[oldIndex]
						node := doc.Nodes[joint]
						controllerId, _ := ExtrasLoad[uint32](node.Extras, ExtraKeyControllerID)
						newIndex := doc.jointIndexOfControllerId(newSkin, controllerId)
						tmp[i][j] = uint8(newIndex)
					}
				}
				binary.Write(buf.Data[pos:], view.ByteStride, tmp)
			case gltf.ComponentUshort:
				tmp := make([][4]uint16, acc.Count)
				binary.Read(buf.Data[pos:], view.ByteStride, tmp)
				for i, v := range tmp {
					for j, oldIndex := range v {
						joint := oldSkin.Joints[oldIndex]
						node := doc.Nodes[joint]
						controllerId, _ := ExtrasLoad[uint32](node.Extras, ExtraKeyControllerID)
						newIndex := doc.jointIndexOfControllerId(newSkin, controllerId)
						tmp[i][j] = uint16(newIndex)
					}
				}
				binary.Write(buf.Data[pos:], view.ByteStride, tmp)
			default:
				panic("unsupported component type")
			}
		}
	}

	for i, skin := range doc.Skins {
		if i == newSkinIndex {
			continue
		}
		for node := range doc.EachSkinNode(skin) {
			node.Extras = ExtrasDelete(node.Extras, ExtraKeyControllerID)
		}
	}
}

func (doc *Document) jointCopy(joint *gltf.Node, newSkin *gltf.Skin) *gltf.Node {
	controllerId, _ := ExtrasLoad[uint32](joint.Extras, ExtraKeyControllerID)
	inverse, _ := ExtrasLoad[mat4.Data](joint.Extras, ExtraKeyInverse)
	for node := range doc.EachSkinNode(newSkin) {
		if ci, _ := ExtrasLoad[uint32](node.Extras, ExtraKeyControllerID); ci == controllerId {
			return node
		}
	}

	result, i := doc.NewNode()
	result.Name = joint.Name
	result.Matrix = joint.Matrix
	result.Extras = ExtrasStore(result.Extras, ExtraKeyControllerID, controllerId)
	result.Extras = ExtrasStore(result.Extras, ExtraKeyInverse, inverse)
	newSkin.Joints = append(newSkin.Joints, i)
	return result
}

func (doc *Document) EachSkinNode(skin *gltf.Skin) iter.Seq[*gltf.Node] {
	return func(yield func(*gltf.Node) bool) {
		for _, i := range skin.Joints {
			if !yield(doc.Nodes[i]) {
				break
			}
		}
	}
}

func (doc *Document) jointIndexOfControllerId(skin *gltf.Skin, controllerId uint32) int {
	for i, joint := range skin.Joints {
		node := doc.Nodes[joint]
		if ci, _ := ExtrasLoad[uint32](node.Extras, ExtraKeyControllerID); ci == controllerId {
			return i
		}
	}
	return -1
}
