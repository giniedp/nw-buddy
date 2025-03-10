package cgf

import (
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/buf"
)

type ChunkCompiledPhysicalProxies struct {
	ChunkHeader
	NumProxies uint32
}

func init() {
	RegisterChunkReader(ChunkType_CompiledPhysicalProxies, 0x0800, ReadChunkCompiledPhysicalProxies)
}

func ReadChunkCompiledPhysicalProxies(r *buf.Reader, header ChunkHeader) (res Chunker, err error) {
	defer utils.HandleRecover(&err, "Read ChunkCompiledPhysicalProxies")
	r.SeekAbsolute(int(header.Offset))

	// STRUCT_INFO_BEGIN(COMPILED_PHYSICALPROXY_CHUNK_DESC_0800)
	// STRUCT_VAR_INFO(numPhysicalProxies, TYPE_INFO(uint32))
	// STRUCT_INFO_END(COMPILED_PHYSICALPROXY_CHUNK_DESC_0800)
	out := ChunkCompiledPhysicalProxies{}
	out.ChunkHeader = header
	out.NumProxies = r.MustReadUint32()
	return out, nil
}
