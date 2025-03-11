package gltf

import (
	"fmt"
	"nw-buddy/tools/formats/cgf"

	"github.com/qmuntal/gltf"
	"github.com/qmuntal/gltf/modeler"
)

func (d *Document) ImportCgfSkin(cgfile *cgf.File, chunk cgf.ChunkCompiledBones) (*int, error) {
	if len(chunk.Bones) == 0 {
		return nil, nil
	}

	gltfBones := make([]*gltf.Node, len(chunk.Bones))
	transforms := make([]Mat4x4, len(chunk.Bones))
	inverse := make([]Mat4x4, len(chunk.Bones))
	for i, bone := range chunk.Bones {
		gltfBones[i], _ = d.NewNode()
		gltfBones[i].Name = bone.BoneName
		gltfBones[i].Extras = map[string]any{
			"controllerId": int(bone.ControllerId),
			"limbId":       int(bone.LimbId),
		}
		transforms[i] = CryToGltfMat4(Mat4Transpose(Mat4x4{
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
		inverse[i] = CryToGltfMat4(Mat4Transpose(Mat4x4{
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
	}

	for i, bone := range chunk.Bones {
		gltfBone := gltfBones[i]
		transform := transforms[i]

		if bone.M_nOffsetParent == 0 {
			scene := d.DefaultScene()
			scene.Nodes = append(scene.Nodes, d.NodeIndex(gltfBone))
		} else {
			parentIndex := i + int(bone.M_nOffsetParent)
			if parentIndex >= len(chunk.Bones) || parentIndex < 0 {
				return nil, fmt.Errorf("parent index out of bounds %d len %d i %d offset %d", parentIndex, len(chunk.Bones), i, int(bone.M_nOffsetParent))
			}
			gltfParent := gltfBones[parentIndex]
			gltfParent.Children = append(gltfParent.Children, d.NodeIndex(gltfBone))
			transform = Mat4Multiply(inverse[parentIndex], transform)
		}
		gltfBone.Matrix = Mat4ToFloat64(transform)
	}

	joints := make([]int, 0)
	for i := range chunk.Bones {
		joints = append(joints, d.NodeIndex(gltfBones[i]))
	}
	data := make([][4][4]float32, 0)
	for _, mat := range inverse {
		data = append(data, [4][4]float32{
			{mat[0], mat[1], mat[2], mat[3]},
			{mat[4], mat[5], mat[6], mat[7]},
			{mat[8], mat[9], mat[10], mat[11]},
			{mat[12], mat[13], mat[14], mat[15]},
		})
	}
	accessor := modeler.WriteAccessor(d.Document, gltf.TargetNone, data)

	d.Document.Skins = append(d.Skins, &gltf.Skin{
		Joints:              joints,
		InverseBindMatrices: gltf.Index(accessor),
	})

	return gltf.Index(len(d.Skins) - 1), nil
}
