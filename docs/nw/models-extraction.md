# Procedure

- Collect all [Material, Model] pairs
- Collect all Textures from all materials
- Preprocess all textures

For each [Material, Model] pair do

- Convert model to Collada (`cgf-converter.exe`)
- Convert model to gltf (`COLLADA2GLTF.exe`)
- Postprocess the GLTF model
  - fix some issues with bones
  - precompute normals
  - bake material colors (may be done in shader)

# Collect models

```ts
/**
 * from javelindata_itemdefinitions_master_*.json
 */
interface ItemDefinitionMaster {
  ItemID: string
  /** references ItemAppearanceDefinition  */
  ArmorAppearanceM: string
  /** references ItemAppearanceDefinition  */
  ArmorAppearanceF: string
  /** references WeaponAppearanceDefinition */
  WeaponAppearanceOverride: string
}

/**
 * from javelindata_itemdefinitions_weaponappearances.json
 */
interface WeaponAppearanceOverride {
  WeaponAppearanceID: string
  /** references ItemAppearanceDefinition  */
  Appearance: string
  /** references ItemAppearanceDefinition  */
  FemaleAppearance: string
  /**
   * If ends with .cdf
   *   path to model and material files are within that .cdf file. see CDF File structure
   *
   * If ends with .cgf
   *   this is the model file
   *   path to material should be inside that file. see CGF File structure
   */
  MeshOverride: string
}

/**
 * from javelindata_itemappearancedefinitions.json
 */
interface ItemAppearanceDefinition {
  ItemID: string
  /**
   * Path to model file
   */
  Skin1: string
  /**
   * Path to material file for that model
   */
  Material1: string
}
```

# Collect Material Textures

Example of a material file

```xml
<Material MtlFlags="524544" vertModifType="0">
 <SubMaterials>
  <Material Name="male_leatherT1_00_calves" MtlFlags="524416" Shader="Illum" GenMask="2001800840000003" StringGenMask="%ALLOW_SILHOUETTE_POM%ALLOW_SPECULAR_ANTIALIASING%FX_DISSOLVE%NORMAL_MAP%OVERLAY_MASK%SPECULAR_MAP%SUBSURFACE_SCATTERING" SurfaceType="mat_default" Diffuse="0.48514995,0.48514995,0.48514995,1" Specular="1,1,1,1" Opacity="1" Shininess="255" vertModifType="0" LayerAct="1">
   <Textures>
    <Texture Map="Smoothness" File="objects/characters/player/male/leathert1/textures/male_leathert1_calves_ddna.dds"/>
    <Texture Map="Specular" File="objects/characters/player/male/leathert1/textures/male_leathert1_calves_spec.dds"/>
    <Texture Map="Custom" File="objects/characters/player/male/leathert1/textures/male_leathert1_calves_mask.dds"/>
    <Texture Map="Bumpmap" File="objects/characters/player/male/leathert1/textures/male_leathert1_calves_ddna.dds" Filter="0" IsTileU="0" IsTileV="0" TexType="0"/>
    <Texture Map="Diffuse" File="objects/characters/player/male/leathert1/textures/male_leathert1_calves_diff.dds"/>
   </Textures>
   <PublicParams Mask_A_Gloss="0" Mask_G_Color="0,0,0,0" Mask_R="0" Mask_R_Color="0,0,0,0" EmittanceMapGamma="1" Mask_B="0" Mask_B_Color="0,0,0,0" Mask_R_Override="0.25" Mask_G="0" Mask_B_Override="0" Mask_G_Override="0" Mask_A_SpecColor="0,0,0,0" Mask_A_GlossShift="0" SSSIndex="0" Mask_A_SpecColor_Override="0" IndirectColor="0.25,0.25,0.25,0.25"/>
  </Material>
 </SubMaterials>
</Material>
```

We are mainly interested in the Texture files (`Texture@File`) and their semantics (`Texture@Map`)

# Preprocess Textures

Texture file paths sometimes have `.tif` ending, but actual files have `.dds` ending

Some files are have a separate alpha channel, ignore them (for now)

```
*.dds.1a
*.dds.2a
```

Some dds images are split into multiple files and have the ending

```
*.dds    contains DDS header
*.dds.1  contains smallest mipmap
*.dds.2  contains next larger mipmap
```

If you are interested in PNG, you only need the header file and the largest mipmap

```js
const first = await fs.promises.readFile(headerFile)
const second = await fs.promises.readFile(mipFile)
// hack into DDS header. Set only one mipmap and cutoff header
first[0x1c] = 0 // set mip count
const header = first.slice(0, 0x94)
return Buffer.concat([header, second])
```

then use `texconv.exe` to convert to png. If that fails, convert again but with `rgba` format

Normal maps (`Bumpmap` or files with `_ddna`) need to be converted with following flags
- `-inverty`
- `-reconstructz`
- `-f rgba`

# Convert to Collada

use https://github.com/Markemp/Cryengine-Converter to convert the models to collada format.

We already have pairs of Model/Material. But the tool does not have a material option and sometimes fails to detect the material file.
For that i have a pending patch that i wanted to submit as pull request but have not yet done so. Can provide the binary though.

when model is converted, the `.dae` file includes all materials and paths to all its textures.
Absolute texture paths look like this

```xml
<init_from>/C:/path/to/texture</init_from>
```

the leading `/` is actually specified as a valid URI but `collada2gltf` converter does not recognize those. replace all absolute paths with relative

```ts
return text.replace(/<init_from>\/([^<]*\.png)<\/init_from>/gm, (match, texturePath) => {
  const relativePath = path.relative(path.dirname(cgfFile), texturePath)
  return `<init_from>${relativePath}<\/init_from>`
})
```

# Convert to GLTF

https://github.com/KhronosGroup/COLLADA2GLTF

nothing special here, just pipe through

# Postprocess GLTF Model

Originally I did this step by loading the GLTF model into a Babylon.js scene and exporting it again with some custom export code.

- http://babylonjs.com/
- https://doc.babylonjs.com/setup/support/serverSide

Works but is a bit slow. Maybe better use this project instead

- https://gltf-transform.donmccurdy.com/

Remove the bones from the model, since we are not working with animation (the `COLLADA2GLTF` converter somehow messes up the bones anyway...).

Also remove the vertex color. Not sure what they are used for, but some standard shaders may use them incorrectly. So we get rid of them.

Precompute vertex normals. Some models have vertex normals, but they are all `0,0,0`. Not sure if this is a side effect of previous conversions.

Decide if you want to embed textures as base64 encoded files in gltf.json or reference them.
Embedding is easier to work with later, although the model files will be larger.


## Bake materials

This step depends on the rendering system that will render the model later. A lot could be done in the shader, but it would require a custom shader implementation.

So to make the model work in any 3D rendering plugin with its default shaders, we actually need to tint some textures based on parameters like color mask textures and color mask values from the appearance definitions (many items in the game have the same model, but just different coloring variations).

TODO:

# CDF File structure

Character definition file is an XML that looks like this

```xml
<CharacterDefinition>
 <Model File="objects/characters/player/male/player_male.chr"/>
 <AttachmentList>
  <Attachment Type="CA_SKIN" AName="male_leatherT1_calves" SerialNumber="60CA85B21A50" Binding="objects/characters/player/male/leatherT1/male_leatherT1_calves.skin" Material="objects/characters/player/male/leatherT1/male_leatherT1_calves_matgroup.mtl" Flags="0"/>
 </AttachmentList>
</CharacterDefinition>
```

The attachments of type `CA_SKIN` point to the skin file via `Binding` attribute and its material via `Material` attribute

# CGF File structure

Binary file. contains geometry and material file name. TODO:
