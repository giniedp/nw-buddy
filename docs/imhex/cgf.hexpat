#pragma eval_depth 1000
import std.mem;
import std.io;
import std.array;
import std.ptr;
import std.string;

struct Header {
  u32 fileType;
  u32 fileVersion;
  u32 chunkCount;
  u32 chunkOffset;
} [[format("format_file_header")]];

fn format_file_header(ref Header it) {
  return std::format("0x{:x} 0x{:x} chunks {}", it.fileType, it.fileVersion, it.chunkCount);
};

struct ChunkHeader {
  u16 chunkType;
  u16 chunkVersion;
  u32 offset;
  u32 id;
  u32 size;
} [[format("format_chunk_header")]];

fn format_chunk_header(ref ChunkHeader it) {
  return std::format("0x{:x} 0x{:x}", it.chunkType, it.chunkVersion);
};

struct File {
  char magic[4];
  Header header;
  ChunkHeader chunks[header.chunkCount];
  u8 data[];
};

File file @0;
