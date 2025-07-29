#pragma eval_depth 1000
#pragma pattern_limit 1000000
import std.mem;
import std.io;
import std.array;
import std.ptr;
import std.string;

struct Str {
  u8 len;
  char value[len];
} [[format("format_str")]];

struct Pos {
  u16 x;
  u16 y;
};

fn format_str(ref Str it) {
  return std::format("{}", it.value);
};

struct File {
  u16 count;
  Str slices[count];
  Str variants[count];

  u32 count2;
  u16 indices[count2];
  Pos positions[count2];
};

File file @0;
// on some files we have to make an offset of 4 bytes.
// this is true for files starting with: 0xD6, 0xB9, 0x01, 0x00,
// File file @4;
