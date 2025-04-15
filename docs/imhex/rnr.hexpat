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
};

File file @0;
//Mtl file @0x0C;
