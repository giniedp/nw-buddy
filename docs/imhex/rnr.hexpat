#pragma eval_depth 1000
import std.mem;
import std.io;
import std.array;
import std.ptr;
import std.string;

struct Mtl {
 u32 len;
 char name[len];
 u32 pad;
 u16 data[pad];
};

struct File {
  char magic[4];
  u32 version;
  u32 mcount;
  Mtl materials[mcount];
  u32 field1;
  u32 field2;
  u32 field3;
  u32 field4;
  u16 field5;
  u16 field6;
  u16 field7;
  u32 someCount;
};

struct V3 {
  float x;
  float y;
  float z;
};

struct Chunk {
  u16 type;   // 80 3F
  u32 field1; // 00 00 00 00
  u32 field2; // 0A 00 00 00 (10)
  u32 field3; // 64 00 00 00 (100)
  u32 vertexCount;
  u32 indexCount; // face count? 1 face => 2 triangles => 3 * 2 * indexCount
  V3 positions[vertexCount];
  u16 indices[2*3*indexCount];
};

File file @0;
//Mtl file @0x0C;
