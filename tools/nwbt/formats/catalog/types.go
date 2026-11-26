package catalog

// Asset types of the catalog: every product carries a type uuid assigned by the Lumberyard asset processor.
//
// Names and groups of the stock types come from lumberyard:
//   - dev/Code/Tools/AssetProcessor/AssetBuilderSDK/AssetBuilderSDK/AssetBuilderSDK.cpp
//     (JobProduct::InferAssetTypeByProductFileName, InferSubIDFromProductFileName)
//   - dev/Gems/LmbrCentral/Code/Source/LmbrCentral.cpp and the AssetTypeInfo files in Unhandled
//   - dev/AssetProcessorPlatformConfig.ini (productAssetType of the RC jobs)
//
// New World's own types are named after the extension that the type registry of
// assetcatalog_optimized.catalog lists for them.

// TypeGroup groups asset types for filtering
type TypeGroup string

const (
	GroupOther     TypeGroup = "other"
	GroupTexture   TypeGroup = "texture"
	GroupGeometry  TypeGroup = "geometry"
	GroupAnimation TypeGroup = "animation"
	GroupMaterial  TypeGroup = "material"
	GroupSlice     TypeGroup = "slice"
	GroupScript    TypeGroup = "script"
	GroupData      TypeGroup = "data"
	GroupUI        TypeGroup = "ui"
	GroupAudio     TypeGroup = "audio"
	GroupVideo     TypeGroup = "video"
	GroupEffects   TypeGroup = "effects"
	GroupPhysics   TypeGroup = "physics"
	GroupTerrain   TypeGroup = "terrain"
	GroupAI        TypeGroup = "ai"
	GroupConfig    TypeGroup = "config"
	// parts of other assets, e.g. split texture mips
	GroupHidden TypeGroup = "hidden"
)

// ContentFormat is how a product is stored, as far as known. Xml and Json typed products may still
// be binary object streams, the content decides.
type ContentFormat string

const (
	FormatBinary ContentFormat = "binary"
	FormatXml    ContentFormat = "xml"
	FormatJson   ContentFormat = "json"
	FormatIni    ContentFormat = "ini"
	FormatLua    ContentFormat = "lua"
	FormatText   ContentFormat = "text"
	// CryEngine chunk file (cgf, skin, chr, caf)
	FormatChunks ContentFormat = "chunks"
	// New World datasheet
	FormatDatasheet ContentFormat = "datasheet"
)

type KnownType struct {
	// lowercase 8-4-4-4-12, as uuid.String()
	UUID   string
	Name   string
	Group  TypeGroup
	Format ContentFormat
}

const (
	NullUUID = "00000000-0000-0000-0000-000000000000"

	UUIDTexture = "59d5e20b-34db-4d8e-b867-d33cc2556355"
	// split mips `.dds.N` and `.dds.Na`; the sub id tells the level, see SubIdLevel
	UUIDTextureMipmap = "3918728c-d3ca-4d9e-813e-a5ed20c6821e"
	// .cgfheap: the vertex/index data of meshes, not viewable on its own
	UUIDMeshHeap = "285b7bdf-1379-4f09-b153-b335de02206b"
)

var KnownTypes = []KnownType{
	// Lumberyard
	{UUIDTexture, "Texture", GroupTexture, FormatBinary},
	{UUIDTextureMipmap, "Texture Mipmap", GroupHidden, FormatBinary},
	{"bfc6c91f-66ce-4d78-b68a-7f697c9ea2e8", "Texture Atlas", GroupTexture, FormatBinary},
	{"c2869e3b-dda0-4e01-8fe3-6770d788866b", "Static Mesh", GroupGeometry, FormatChunks},
	{"9aae4926-cb6a-4c60-9948-a1a22f51db23", "Static Mesh LOD", GroupGeometry, FormatChunks},
	{"c5d443e1-41ff-4263-8654-9438bc888cb7", "Skinned Mesh", GroupGeometry, FormatChunks},
	{"58e5824f-c27b-46fd-ad48-865ba41b7a51", "Skinned Mesh LOD", GroupGeometry, FormatChunks},
	{"df036c63-9ae6-4ac3-a6ac-8a1d76126c01", "Character Definition", GroupGeometry, FormatXml},
	{"60161b46-21f0-4396-a4f0-f2ccf0664cde", "Skeleton", GroupAnimation, FormatChunks},
	{"4bbb785a-6824-4803-a607-f9323e7beef1", "Skeleton Params", GroupAnimation, FormatXml},
	{"6023cff8-fcba-4528-a8bf-6e0e10b9ab9c", "Simple Animation", GroupAnimation, FormatChunks},
	{"511562be-65a5-4538-a5f1-ac685366243e", "Animation Database", GroupAnimation, FormatBinary},
	{"c1d209c1-f81a-4586-a34e-1615995f9f3f", "Animation Events", GroupAnimation, FormatXml},
	{"50908273-ca36-4668-9828-15dd5092f973", "Mannequin Animation Database", GroupAnimation, FormatXml},
	{"49375937-7f37-41b1-96a5-b099a8657dde", "Mannequin Controller", GroupAnimation, FormatXml},
	{"1fff61ee-044a-4a72-87d0-60870ff02c58", "Mannequin Preview", GroupAnimation, FormatXml},
	{"f46985b5-f7ff-4fcb-8e8c-dc240d701841", "Material", GroupMaterial, FormatXml},
	{"c62c7a87-9c09-4148-a985-12f2c99c0a45", "Slice", GroupSlice, FormatBinary},
	{"78802abf-9595-463a-8d2b-d022f906f9b1", "Dynamic Slice", GroupSlice, FormatBinary},
	{"82557326-4ae3-416c-95d6-c70635ab7588", "Lua Script", GroupScript, FormatBinary},
	{"6eb56b55-1b58-4ee3-a268-27680338ae56", "Particle Library", GroupEffects, FormatXml},
	{"cf44d1f0-f178-4a3d-a9e6-d44721f50c20", "Lens Flare Library", GroupEffects, FormatXml},
	{"0db1f34b-eb30-4318-a20b-cf035f419e74", "Behavior Tree", GroupAI, FormatXml},
	{"2dc3c556-9461-4729-8313-2ba0cb64ef52", "Prefabs Library", GroupOther, FormatXml},
	{"b034f8ab-d881-4a35-a408-184e3fdeb2fe", "Entity Prototype Library", GroupOther, FormatXml},
	{"1d4b56f8-366a-4040-b645-ae87e3a00dab", "Game Tokens Library", GroupOther, FormatXml},
	{"57767d37-0ebe-43be-8f60-ab36d2056ef8", "Font", GroupUI, FormatXml},
	{"e48ddac8-1f1e-4183-aaab-37424bcc254b", "UI Canvas", GroupUI, FormatBinary},
	{"25971c7a-26e2-4d08-a146-2efcc1c36b0c", "Input Bindings", GroupConfig, FormatBinary},
	{"9e366d8c-33bb-4825-9a1f-fa3adbe11d0f", "Physics Materials", GroupPhysics, FormatBinary},
	{"117a80a5-206b-4d85-9445-33b446d94c35", "Config", GroupConfig, FormatIni},
	{"bf4879b9-b893-41d2-80e9-24a7bdcd2b50", "Bink Video", GroupVideo, FormatBinary},
	{"ddfee0b2-9e5a-412c-8c77-ab100e24c1df", "Video", GroupVideo, FormatBinary},
	// New World
	{UUIDMeshHeap, "Mesh Heap", GroupGeometry, FormatBinary},
	{"1457f08b-e06d-4b6f-94d1-6a037bf362e8", "Timeline", GroupOther, FormatBinary},
	{"2cccf598-63fe-424f-ab0d-78fd718323c1", "Datasheet", GroupData, FormatDatasheet},
	{"d52cccdd-9701-45d9-b261-8ea6881a6312", "Roads and Rivers", GroupTerrain, FormatBinary},
	{"075036af-1a17-4ab6-b1ca-bedb21637fe9", "Music Sheet", GroupAudio, FormatBinary},
	{"f15ef74d-1520-4b40-ba45-9fa7e47f32e1", "Virtual Audio DB", GroupAudio, FormatBinary},
	{"9a3cbac2-ec59-4f6f-9fd7-6c6a323b6364", "Cloth", GroupPhysics, FormatBinary},
	{"6ed8009c-e9d9-48d2-9aef-cd6b90b796e5", "Cloth Material", GroupPhysics, FormatBinary},
	{"3f5634a1-8683-4783-8acb-07478cb686fe", "Collision Filters", GroupPhysics, FormatBinary},
	{"f8adbadf-b7b2-4fb8-afb6-6c4004fd9bf7", "Alias Asset", GroupOther, FormatBinary},
	{"bda6adf9-991e-489d-b0f5-796cc24d7afb", "Metadata", GroupOther, FormatBinary},
	{"a7a9aae0-d682-4815-b70c-0f5a7451c89e", "Dynamic UI Canvas", GroupUI, FormatBinary},
	{"0543759c-4cf0-4eba-b0dd-f0f020b480b3", "Sprite Data", GroupUI, FormatBinary},
	{"13a2b46e-023c-4a70-894f-134bdb39d966", "Heightmap", GroupTerrain, FormatBinary},
	{"0f9d3341-6c8d-4dd1-a636-3622878ff8f6", "Surface Map", GroupTerrain, FormatBinary},
	{"9a623978-dfb6-4cc1-a649-1f172637e52a", "Region Material", GroupTerrain, FormatXml},
	{"0c5debf7-4320-42ab-b77b-b7270d04206a", "World Material", GroupTerrain, FormatXml},
	{"3907749b-078f-4aaf-8ad8-04cedff7422a", "Vertex Shape", GroupOther, FormatBinary},
	{"ea2152a3-0ee7-49f5-b684-11a1d47e48a2", "Action List", GroupData, FormatBinary},
	{"fe12f366-67b2-4f3c-a0c3-7a83d06add40", "Grid", GroupData, FormatBinary},
	{"532c8d49-de48-44f3-9450-f47f3e944c10", "Behavior Tree", GroupAI, FormatBinary},
	{"c6d61ef7-c1d5-4dfa-92c3-af5a5231f5ec", "Stimulus Durations", GroupAI, FormatBinary},
	{"4c278554-bc9b-45a4-b10e-65213c536e68", "Curve Config List", GroupData, FormatBinary},
	{"8a106a65-e6e7-42f7-9bdb-60950beebbd6", "Refresh Zone Configs", GroupData, FormatBinary},
	{"9952f1e9-bf9f-4b0d-8627-d973a3d82230", "Config", GroupConfig, FormatIni},
	{"929e6ee5-1539-4dc2-9f86-e526557a0a66", "Bink Video", GroupVideo, FormatBinary},
	{"5a8c903d-69f3-4259-8e31-9cb04867bd6e", "Material Overrides", GroupMaterial, FormatXml},
	{"ec0fc11a-c370-432a-913c-e035d94656d5", "Material Effects", GroupMaterial, FormatXml},
	{"70277a3e-2af5-4309-9bbf-6161afbde792", "Application Descriptor", GroupConfig, FormatXml},
	{"e0f05299-db68-4158-a207-1fd8e1adc280", "Vegetation Image", GroupTerrain, FormatXml},
	// *db: game databases, object streams
	{"ce851bb1-03d6-493f-81f5-b3d8ddc70d3c", "Hairstyle DB", GroupData, FormatBinary},
	{"4997cfb3-8342-4617-8196-3ddc101cda3e", "Skin Tone DB", GroupData, FormatBinary},
	{"31643d5c-ebf9-4680-be4c-e86927fc8807", "Eye Color DB", GroupData, FormatBinary},
	{"ad2f9c39-00ab-4fde-b7ed-488bda006015", "Tattoo DB", GroupData, FormatBinary},
	{"f74cfaa9-f045-4873-b834-5d9563f3a25c", "Face Mark DB", GroupData, FormatBinary},
	{"1e639682-6b81-445c-9be6-ee9b9c4e5723", "Scar DB", GroupData, FormatBinary},
	{"2de9e46e-703f-4708-990f-c45a6d08edb8", "Crest DB", GroupData, FormatBinary},
	{"a12f9bab-1706-4ded-b3c5-70913be02d1f", "Character Creation DB", GroupData, FormatBinary},
	{"da5a104d-82e3-490e-8c13-135a5607bbbc", "Paperdoll DB", GroupData, FormatBinary},
	{"f937c753-ffc0-4f9c-a234-7c71c9a5bdb3", "Equip DB", GroupData, FormatBinary},
	{"72175d3e-9370-4b21-970f-dc2adc11e52b", "Crafting Station DB", GroupData, FormatBinary},
	{"8c1fa8a8-2e58-4791-acda-2c3625318832", "AOFF DB", GroupData, FormatBinary},
	{"1ef311cc-a16e-426d-9763-a40473495330", "GDB", GroupData, FormatBinary},
	{"3e5db037-ae49-43e4-8bcc-67f8c511a091", "GDS", GroupData, FormatBinary},
	{"5c624458-c56d-417d-a7a8-16a98eee22a6", "Event Notification DB", GroupData, FormatBinary},
	{"7b7fa731-d537-40de-b9ab-fc9c3e8a2827", "RA DB", GroupData, FormatBinary},
	{"3b7d0a86-3451-423b-b3b0-8548796b7d1c", "Game Event DB", GroupData, FormatBinary},
	{"9ac82655-bc8f-4165-ae2f-6d6f3d543d9a", "Game Action DB", GroupData, FormatBinary},
	{"7cc2b992-1c5b-4b27-bcb9-790175f09da6", "UI DB", GroupData, FormatBinary},
	{"0f40ecc6-ace9-476a-9a5c-b83be6129a4b", "PBA DB", GroupData, FormatBinary},
	{"b0024f1f-651d-48a5-a56a-9dea80cb487e", "Rank DB", GroupData, FormatBinary},
	{"5bb64cb7-6300-4090-a9cf-dc2a8e61cc30", "Fish DB", GroupData, FormatBinary},
	{"f2436f34-b1a0-4920-953e-4217abec108b", "Fuel DB", GroupData, FormatBinary},
	{"78aa0c25-92b9-4f30-a3f7-c43980d46784", "BS DB", GroupData, FormatBinary},
	{"840c351a-0075-42c0-beb1-5230489b489e", "GA DB", GroupData, FormatBinary},
}

var knownTypeIndex = func() map[string]KnownType {
	index := make(map[string]KnownType, len(KnownTypes))
	for _, t := range KnownTypes {
		index[t.UUID] = t
	}
	return index
}()

// LookupKnownType returns the table entry of a type uuid (lowercase, as in the catalog)
func LookupKnownType(uuid string) (KnownType, bool) {
	t, ok := knownTypeIndex[uuid]
	return t, ok
}

// ExtType types files that have no catalog type: no catalog entry, or the null type (copy jobs)
type ExtType struct {
	Ext    string
	Name   string
	Group  TypeGroup
	Format ContentFormat
}

var ExtTypes = []ExtType{
	{"xml", "XML", GroupOther, FormatXml},
	{"json", "JSON", GroupData, FormatJson},
	{"txt", "Text", GroupOther, FormatText},
	{"cfg", "Config", GroupConfig, FormatIni},
	{"ini", "Config", GroupConfig, FormatIni},
	{"csv", "CSV", GroupData, FormatText},
	{"lua", "Lua Source", GroupScript, FormatLua},
	{"wem", "Wwise Audio", GroupAudio, FormatBinary},
	{"bnk", "Wwise Soundbank", GroupAudio, FormatBinary},
	{"dds", "Texture (untyped)", GroupTexture, FormatBinary},
	{"tif", "TIFF Image", GroupTexture, FormatBinary},
	{"meta", "Meta", GroupOther, FormatBinary},
	{"chunks", "Chunks", GroupTerrain, FormatBinary},
	{"waterqt", "Water Quadtree", GroupTerrain, FormatBinary},
	{"distribution", "Distribution", GroupTerrain, FormatBinary},
	{"vegetation", "Vegetation", GroupTerrain, FormatBinary},
	{"slicedata", "Slice Data", GroupTerrain, FormatBinary},
	{"metadata", "Region Metadata", GroupTerrain, FormatBinary},
	{"caf", "Animation (untyped)", GroupAnimation, FormatChunks},
	{"bspace", "Blend Space", GroupAnimation, FormatXml},
	{"comb", "Combined Blend Space", GroupAnimation, FormatXml},
	{"sprite", "Sprite", GroupUI, FormatXml},
	{"otf", "OpenType Font", GroupUI, FormatBinary},
	{"ttf", "TrueType Font", GroupUI, FormatBinary},
	{"ent", "Entity Class", GroupOther, FormatXml},
	{"entities_xml", "Level Entities", GroupOther, FormatXml},
	{"bai", "AI Navigation", GroupAI, FormatBinary},
	{"fxcb", "Shader Cache (fxcb)", GroupOther, FormatBinary},
	{"cfxb", "Shader Cache (cfxb)", GroupOther, FormatBinary},
	{"cfib", "Shader Cache (cfib)", GroupOther, FormatBinary},
	{"ext", "Shader Extension", GroupOther, FormatText},
	{"pssl", "Shader Source", GroupOther, FormatText},
	{"lst", "List", GroupOther, FormatText},
	{"obj", "Wavefront OBJ", GroupGeometry, FormatText},
}

var extTypeIndex = func() map[string]ExtType {
	index := make(map[string]ExtType, len(ExtTypes))
	for _, t := range ExtTypes {
		index[t.Ext] = t
	}
	return index
}()

// LookupExtType returns the type of an extension (without dot) for files without a catalog type
func LookupExtType(ext string) (ExtType, bool) {
	t, ok := extTypeIndex[ext]
	return t, ok
}

// Sub id bits of products, from InferSubIDFromProductFileName: mip/lod level, `_diff` and alpha
const (
	SubIdLevelMask = 0x000F_0000
	SubIdDiff      = 0x0010_0000
	SubIdAlpha     = 0x0020_0000
)

// SubIdLevel is the mip level of a Texture Mipmap (`.dds.N` -> N) or the lod of a mesh lod product
func SubIdLevel(subId uint32) int {
	return int((subId & SubIdLevelMask) >> 16)
}

func SubIdIsAlpha(subId uint32) bool {
	return subId&SubIdAlpha != 0
}

func SubIdIsDiff(subId uint32) bool {
	return subId&SubIdDiff != 0
}
