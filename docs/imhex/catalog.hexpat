#pragma eval_depth 1000
#pragma array_limit 10000000000
#pragma pattern_limit 10000000000
import std.mem;
import std.io;
import std.array;
import std.ptr;
import std.string;

struct Header {
  u32 signature;
  u32 version;
  u32 fileSize;
  u32 field4;

  u32 pBlockUuids;
  u32 pBlockTypes;
  u32 pBlockDirs;
  u32 pBlockFiles;
  u32 fileSize2;
};

struct AssetInfoRef {
  u32 uidIndex1;
  u32 subId1;
  u32 uidIndex2;
  u32 subId2;
  u32 typeIndex;
  u32 field6;
  u32 fileSize;
  u32 field8;
  u32 dirOffset;
  u32 fileNameOffset;
};

struct File {
  Header header;
  u32 assetInfoCount;
  AssetInfoRef assets[assetInfoCount];
};

File file @0;
