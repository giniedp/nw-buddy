package cgf

import (
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/buf"
)

type ChunkExportFlags struct {
	ChunkHeader
	Flags             uint32
	RcVersion         uint32
	RcVersionString   string
	AssetAuthorTool   uint32
	AuthorToolVersion uint32
}

func init() {
	RegisterChunkReader(ChunkType_ExportFlags, 0x0001, ReadChunkExportFlags)
}

func ReadChunkExportFlags(r *buf.Reader, header ChunkHeader) (res Chunker, err error) {
	defer utils.HandleRecover(&err, "Read ChunkExportFlags")
	r.SeekAbsolute(int(header.Offset))

	// STRUCT_INFO_BEGIN(EXPORT_FLAGS_CHUNK_DESC)
	// STRUCT_VAR_INFO(flags, TYPE_INFO(unsigned int))
	// STRUCT_VAR_INFO(rc_version, TYPE_ARRAY(4, TYPE_INFO(unsigned int)))
	// STRUCT_VAR_INFO(rc_version_string, TYPE_ARRAY(16, TYPE_INFO(char)))
	// STRUCT_VAR_INFO(assetAuthorTool, TYPE_INFO(uint32))
	// STRUCT_VAR_INFO(authorToolVersion, TYPE_INFO(uint32))
	// STRUCT_VAR_INFO(reserved, TYPE_ARRAY(30, TYPE_INFO(unsigned int)))
	// STRUCT_INFO_END(EXPORT_FLAGS_CHUNK_DESC)

	out := ChunkExportFlags{}
	out.ChunkHeader = header
	out.Flags = r.MustReadUint32()
	out.RcVersion = r.MustReadUint32()
	out.RcVersionString = utils.Must(r.ReadCStringFixedBlock(16))
	out.AssetAuthorTool = r.MustReadUint32()
	out.AuthorToolVersion = r.MustReadUint32()
	return out, nil
}
