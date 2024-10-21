#pragma pattern_limit 10000000

struct TerrainInfo {
    u32 mapSizeInUnits;
    u32 unitInMeters;
    u32 sectorInMeters;
    u32 sectrosTableInSectors;
    float zRatio;
    float waterLevel;
};

struct TerrainHeader {
    u8 version;
    u8 dummy;
    u8 flags1;
    u8 flags2;
    u32 chunkSize;
};

struct GroupString {
    char value[0x100];
};
struct Groups {
    u32 countStatic;
    u32 numObjects;
    GroupString objects[numObjects];
    u32 numMaterials;
    GroupString materials[numMaterials];
};

struct Vec3 {
    float x;
    float y;
    float z;
};

struct AABB {
    Vec3 min;
    Vec3 max;
};

struct SurfaceWeight {
    u8 id[3];
    u8 weight[3];
};

fn alignTo4Bytes(u32 size) {
    return 3 & (4 - size % 4);
};

fn getChunkCount(TerrainHeader header, TerrainInfo info) {
    u32 count = 0;
    u32 size = info.mapSizeInUnits * info.unitInMeters;
    u32 index = 0;
    while (size >= info.sectorInMeters && size > 0) {
        count += (1 << index) * (1 << index);
        size = size >> 1;
        index += 1;
    }
    return count;
};

fn getUnitToSectorBitShift(TerrainInfo info) {
    u32 count = 0;
    while (info.sectorInMeters >> count > info.unitInMeters) {
        count += 1;
    }
    return count;
};

struct Chunk {
    u16 version;
    u16 hasHoles;
    AABB aabb;
    float offset;
    float range;
    u32 size;
    u32 surfaceTypeNum;
    if (size) {
        u16 heightmap[size * size];
        u8 pad1[alignTo4Bytes(size * size * sizeof(u16))];
        SurfaceWeight weights[size * size];
        u8 pad2[alignTo4Bytes(size * size * sizeof(SurfaceWeight))];
    }
    float lodErrors[5]; // TODO: calculate from info (getUnitToSectorBitShift)
    if (surfaceTypeNum) {
        u8 surfaceType[surfaceTypeNum];
        u8 pad3[alignTo4Bytes(surfaceTypeNum)];
    }
};

enum EERType : u8
{
  NotRenderNode,
  Brush,
  Vegetation,
  Light,
  Cloud,
  TerrainSystem, // used to be eERType_Dummy_1 which used to be eERType_VoxelObject, preserve order for compatibility
  FogVolume,
  Decal,
  ParticleEmitter,
  WaterVolume,
  Dummy_5, // used to be eERType_WaterWave, preserve order for compatibility
  Road,
  DistanceCloud,
  VolumeObject,
  Dummy_0, // used to be eERType_AutoCubeMap, preserve order for compatibility
  Rope,
  PrismObject,
  Dummy_2, // used to be eERType_IsoMesh, preserve order for compatibility
  Dummy_4,
  RenderComponent,
  GameEffect,
  BreakableGlass,
  Dummy_3, // used to be eERType_LightShape, preserve order for compatibility
  MergedMesh,
  GeomCache,
  StaticMeshRenderComponent,
  DynamicMeshRenderComponent,
  SkinnedMeshRenderComponent,
  TypesNum, // MUST BE AT END TOTAL NUMBER OF ERTYPES
};


fn getObjectTreeChildCount(u32 childMask) {
  u32 count = 0;
  for (u32 i = 0, i < 8, i+=1) {
    if (childMask & (1 << i)) {
      count += 1;
    }
  }
  return count;
};

struct ObjectTreeHeader {
    u16 version;
    u16 childMask;
    AABB aabb;
    u32 blockSize;
};

struct ObjectTree {
    ObjectTreeHeader header;
    EERType data[header.blockSize];
    ObjectTree children[getObjectTreeChildCount(header.childMask)];
};

struct Terrain {
    TerrainHeader header;
    TerrainInfo info;
    Groups groups;
    Chunk chunks[getChunkCount(header, info)];
    ObjectTree objectTree;
};

Terrain terrain @ 0x0;
// Chunk c1 @ 0x70;
// Chunk c2 @ 0xF8;
// Chunk c3 @ 0x180;
// Chunk c4 @ 0x1c4;
// ObjectTree tree @ 0x00899BC0;
