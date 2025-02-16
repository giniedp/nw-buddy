#pragma endian big
#pragma eval_depth 1000
import std.mem;
import std.io;
import std.array;
import std.ptr;
import std.string;


struct Uuid {
  u8 data[16];
} [[format("format_uuid")]];

fn format_uuid(ref Uuid it) {
  return
    std::format("{:x}{:x}{:x}{:x}-", it.data[0], it.data[1], it.data[2], it.data[3]) +
    std::format("{:x}{:x}-{:x}{:x}-", it.data[4], it.data[5], it.data[6], it.data[7]) +
    std::format("{:x}{:x}-{:x}{:x}-", it.data[8], it.data[9], it.data[10], it.data[11]) +
    std::format("{:x}{:x}{:x}{:x}", it.data[12], it.data[13], it.data[14], it.data[5]);
};

struct Head {
  u8 pad;
  u32 version;
};

fn format_flags(ref u8 it) {
  return std::format("{:b}", it);
};
struct Element<auto v> {
  u8 flags [[format("format_flags")]];
  std::print("flg {:08b} {:08x}", flags, $);
  if (flags == 0) {
    break;
  }
  if (flags & 64) {
    u32 crcName;
    std::print("crc {:x} {:08x}", crcName, $);
  } else {
    u32 crcName = 0;
  }
  if (flags & 128) {
    u8 version;
    std::print("ver {} {:08x}", version, $);
  } else {
    u8 version = 0;
  }
  Uuid type;

  if (v == 2) {
    Uuid type2;
  }
  u32 size = 0;
  if (flags & 16) {
    size = flags & 0x07;
    if (flags & 32) {
      if (size == 1) {
        u8 s;
        size = s;
      } else if (size == 2) {
        u16 s;
        size = s;
      } else if (size == 4) {
        u32 s;
        size = s;
      }
    }
  }

  u8 data[size];

  Element<v> children[while(std::mem::read_unsigned($, 1) != 0x0)];
  u8;
};

struct Object {
  Head head;
  Element<head.version> root;
};

Object obj @0;
