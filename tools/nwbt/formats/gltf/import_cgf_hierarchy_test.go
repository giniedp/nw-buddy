package gltf

import (
	"nw-buddy/tools/formats/cgf"
	"testing"
)

func TestSkinMeshOffset(t *testing.T) {
	// parent at (1, 2, 3), rotated 90° about z (column major, translation at 12-14)
	parent := cgf.ChunkNode{ParentId: -1, ObjectId: -1, Transform: [16]float32{
		0, 1, 0, 0,
		-1, 0, 0, 0,
		0, 0, 1, 0,
		1, 2, 3, 1,
	}}
	parent.Id = 1
	// the mesh node at (1, 0, 0) below it
	child := cgf.ChunkNode{ParentId: 1, ObjectId: 5, Transform: [16]float32{
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		1, 0, 0, 1,
	}}
	child.Id = 2
	file := &cgf.File{Chunks: []cgf.Chunker{parent, child}}

	if got := skinMeshOffset(file, 5); got != [3]float32{1, 3, 3} {
		t.Errorf("offset = %v, want the world translation [1 3 3]", got)
	}
	if got := skinMeshOffset(file, 9); got != [3]float32{} {
		t.Errorf("offset of a mesh without node = %v, want zero", got)
	}
	if hasCompiledBones(file) {
		t.Error("a file without CompiledBones is no skin")
	}
	file.Chunks = append(file.Chunks, cgf.ChunkCompiledBones{})
	if !hasCompiledBones(file) {
		t.Error("a file with CompiledBones is a skin")
	}
}
