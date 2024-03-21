import { readFile } from "fs/promises";
import { BinaryReader } from "./binary-reader";

export async function readShader(filePath: string) {
  const file = await readFile(filePath)
  const reader = new BinaryReader(file.buffer)

  const header = readHeader(reader)
  const tokens: EToken[] = []
  for (let i = 0; i < header.tokens; i++) {
    tokens.push(reader.readUInt())
  }
  const params: Record<number, string> = {}
  while (reader.canRead) {
    const token = readToken(reader)
    if (!token) {
      break
    }
    params[token.token] = token.value
  }

  let indent = 0
  let lline = false
  let line = false
  let space = false
  const code: string[] = []
  function format() {
    indent = Math.max(0, indent)
    if (line) {
      code.push('\n', ' '.repeat(indent * 2))
      line = false
      space = false
    }
    if (space) {
      if (lline) {
        code.push('\n', ' '.repeat(indent * 2))
      } else {
        code.push(' ')
      }
      space = false
      lline = false
    }
  }
  for (const token of tokens) {
    const value = getTokenString(token, params)

    if (value === '#define' || value === '#include') {
      line = true
      format()
      code.push(value, ' ')
      lline = true
      continue
    }
    if (value === '#if' || value === '#ifdef') {
      line = true
      format()
      code.push(value, ' ')
      indent++
      lline = true
      continue
    }
    if (value === '#endif') {
      indent--
      line = true
      format()
      code.push(value)
      line = true
      format()
      continue
    }
    if (value === '#else') {
      indent--
      line = true
      format()
      code.push(value)
      indent++
      line = true
      format()
      continue
    }
    if (value === '#elif') {
      indent--
      line = true
      format()
      code.push(value)
      indent++
      space = true
      lline = true
      continue
    }
    if (value === '"'){
      code.push(value)
      space = false
      continue
    }

    if (value === '{' || value === '<') {
      line = false
      format()
      code.push(value)
      indent++
      line = true
      continue
    }

    if (value === '}' || value === '>') {
      indent--
      line = true
      format()
      code.push(value)
      line = true
      continue
    }

    if (value === ';') {
      code.push(value)
      line = true
      continue
    }

    if (value === '(') {
      code.push(value)
      space = false
      continue
    }

    if (value === ')') {
      code.push(value)
      space = true
      continue
    }
    if (value === ',') {
      code.push(value)
      space = true
      continue
    }
    if (value === '*' || value === '+' || value === '-' || value === '/' || value === '=') {
      code.push(' ', value, ' ')
      space = false
      line = false
      continue
    }

    if (value === '.' || value === '|' || value === '&' || value === '!') {
      code.push(value)
      space = false
      continue
    }

    if (value === '=') {
      line = false
      space = true
      format()
      code.push(value)
      space = true
      continue
    }

    format()
    code.push(value)
    space = true
  }

  return code.join('')
}

function readHeader(r: BinaryReader) {
  const magic = r.readString(4)
  const crc32 = r.readUInt()
  const versionLow = r.readUShort()
  const versionHigh = r.readUShort()
  const offsetStringTable = r.readUInt()
  const offsetParamsLocal = r.readUInt()
  const tokens = r.readUInt()
  const sourceCrc32 = r.readUInt()

  return {
    magic,
    crc32,
    versionLow,
    versionHigh,
    offsetStringTable,
    offsetParamsLocal,
    tokens,
    sourceCrc32
  }
}

function readToken(r: BinaryReader) {
  if (r.remaining < 5) {
    return null
  }
  const token = r.readUInt()
  const value = r.readNullTerminatedString()
  return { token, value }

}

enum EToken
{
    eT_unknown = 0,
    eT_include = 1,
    eT_define  = 2,
    eT_define_2 = 3,
    eT_undefine = 4,

    eT_fetchinst = 5,
    eT_if      = 6,
    eT_ifdef   = 7,
    eT_ifndef  = 8,
    eT_if_2    = 9,
    eT_ifdef_2 = 10,
    eT_ifndef_2 = 11,
    eT_elif    = 12,

    eT_endif   = 13,
    eT_else    = 14,
    eT_or      = 15,
    eT_and     = 16,
    eT_warning = 17,
    eT_register_env = 18,
    eT_ifcvar  = 19,
    eT_ifncvar = 20,
    eT_elifcvar = 21,
    eT_skip     = 22,
    eT_skip_1   = 23,
    eT_skip_2   = 24,

    eT_br_rnd_1 = 25,
    eT_br_rnd_2 = 26,
    eT_br_sq_1  = 27,
    eT_br_sq_2  = 28,
    eT_br_cv_1  = 29,
    eT_br_cv_2  = 30,
    eT_br_tr_1  = 31,
    eT_br_tr_2  = 32,
    eT_comma    = 33,
    eT_dot      = 34,
    eT_colon    = 35,
    eT_semicolumn = 36,
    eT_excl     = 37,  // !
    eT_quote    = 38,
    eT_sing_quote = 39,

    eT_question = 40,
    eT_eq       = 41,
    eT_plus     = 42,
    eT_minus    = 43,
    eT_div      = 44,
    eT_mul      = 45,
    eT_dot_math = 46,
    eT_mul_math = 47,
    eT_sqrt_math = 48,
    eT_exp_math = 49,
    eT_log_math = 50,
    eT_log2_math = 51,
    eT_sin_math = 52,
    eT_cos_math = 53,
    eT_sincos_math = 54,
    eT_floor_math  = 55,
    eT_ceil_math   = 56,
    eT_frac_math   = 57,
    eT_lerp_math   = 58,
    eT_abs_math    = 59,
    eT_clamp_math  = 60,
    eT_min_math    = 61,
    eT_max_math    = 62,
    eT_length_math = 63,

    eT_tex2D,
    eT_tex2Dproj,
    eT_tex3D,
    eT_texCUBE,
    eT_SamplerState,
    eT_SamplerComparisonState,
    eT_sampler_state,
    eT_Texture2D,
    eT_RWTexture2D,
    eT_RWTexture2DArray,
    eT_Texture2DArray,
    eT_Texture2DMS,
    eT_TextureCube,
    eT_TextureCubeArray,
    eT_Texture3D,
    eT_RWTexture3D,

    eT_float,
    eT_float2,
    eT_float3,
    eT_float4,
    eT_float4x4,
    eT_float3x4,
    eT_float2x4,
    eT_float3x3,
    eT_half,
    eT_half2,
    eT_half3,
    eT_half4,
    eT_half4x4,
    eT_half3x4,
    eT_half2x4,
    eT_half3x3,
    eT_bool,
    eT_int,
    eT_int2,
    eT_int4,
    eT_uint,
    eT_uint2,
    eT_uint4,
    eT_sampler1D,
    eT_sampler2D,
    eT_sampler3D,
    eT_samplerCUBE,
    eT_const,

    eT_inout,

    eT_struct,
    eT_sampler,
    eT_TEXCOORDN,
    eT_TEXCOORD0,
    eT_TEXCOORD1,
    eT_TEXCOORD2,
    eT_TEXCOORD3,
    eT_TEXCOORD4,
    eT_TEXCOORD5,
    eT_TEXCOORD6,
    eT_TEXCOORD7,
    eT_TEXCOORD8,
    eT_TEXCOORD9,
    eT_TEXCOORD10,
    eT_TEXCOORD11,
    eT_TEXCOORD12,
    eT_TEXCOORD13,
    eT_TEXCOORD14,
    eT_TEXCOORD15,
    eT_TEXCOORD16,
    eT_TEXCOORD17,
    eT_TEXCOORD18,
    eT_TEXCOORD19,
    eT_TEXCOORD20,
    eT_TEXCOORD21,
    eT_TEXCOORD22,
    eT_TEXCOORD23,
    eT_TEXCOORD24,
    eT_TEXCOORD25,
    eT_TEXCOORD26,
    eT_TEXCOORD27,
    eT_TEXCOORD28,
    eT_TEXCOORD29,
    eT_TEXCOORD30,
    eT_TEXCOORD31,
    eT_TEXCOORDN_centroid,
    eT_TEXCOORD0_centroid,
    eT_TEXCOORD1_centroid,
    eT_TEXCOORD2_centroid,
    eT_TEXCOORD3_centroid,
    eT_TEXCOORD4_centroid,
    eT_TEXCOORD5_centroid,
    eT_TEXCOORD6_centroid,
    eT_TEXCOORD7_centroid,
    eT_TEXCOORD8_centroid,
    eT_TEXCOORD9_centroid,
    eT_TEXCOORD10_centroid,
    eT_TEXCOORD11_centroid,
    eT_TEXCOORD12_centroid,
    eT_TEXCOORD13_centroid,
    eT_TEXCOORD14_centroid,
    eT_TEXCOORD15_centroid,
    eT_TEXCOORD16_centroid,
    eT_TEXCOORD17_centroid,
    eT_TEXCOORD18_centroid,
    eT_TEXCOORD19_centroid,
    eT_TEXCOORD20_centroid,
    eT_TEXCOORD21_centroid,
    eT_TEXCOORD22_centroid,
    eT_TEXCOORD23_centroid,
    eT_TEXCOORD24_centroid,
    eT_TEXCOORD25_centroid,
    eT_TEXCOORD26_centroid,
    eT_TEXCOORD27_centroid,
    eT_TEXCOORD28_centroid,
    eT_TEXCOORD29_centroid,
    eT_TEXCOORD30_centroid,
    eT_TEXCOORD31_centroid,
    eT_COLOR0,
    eT_static,
    eT_shared,
    eT_groupshared,
    eT_packoffset,
    eT_register,
    eT_return,
    eT_vsregister,
    eT_psregister,
    eT_gsregister,
    eT_dsregister,
    eT_hsregister,
    eT_csregister,

    eT_slot,
    eT_vsslot,
    eT_psslot,
    eT_gsslot,
    eT_dsslot,
    eT_hsslot,
    eT_csslot,


    eT_StructuredBuffer,
    eT_RWStructuredBuffer,
    eT_ByteAddressBuffer,
    eT_RWByteAddressBuffer,
    eT_Buffer,
    eT_RWBuffer,
    eT_RasterizerOrderedBuffer,
    eT_RasterizerOrderedByteAddressBuffer,
    eT_RasterizerOrderedStructuredBuffer,

    eT_color,
    eT_Position,
    eT_Allways,

    eT_STANDARDSGLOBAL,

    eT_technique,
    eT_string,
    eT_UIName,
    eT_UIDescription,
    eT_UIWidget,
    eT_UIWidget0,
    eT_UIWidget1,
    eT_UIWidget2,
    eT_UIWidget3,

    eT_Texture,
    eT_Filter,
    eT_MinFilter,
    eT_MagFilter,
    eT_MipFilter,
    eT_AddressU,
    eT_AddressV,
    eT_AddressW,
    eT_BorderColor,
    eT_sRGBLookup,

    eT_LINEAR,
    eT_POINT,
    eT_NONE,
    eT_ANISOTROPIC,
    eT_MIN_MAG_MIP_POINT,
    eT_MIN_MAG_MIP_LINEAR,
    eT_MIN_MAG_LINEAR_MIP_POINT,
    eT_COMPARISON_MIN_MAG_LINEAR_MIP_POINT,
    eT_MINIMUM_MIN_MAG_MIP_LINEAR,
    eT_MAXIMUM_MIN_MAG_MIP_LINEAR,

    eT_Clamp,
    eT_Border,
    eT_Wrap,
    eT_Mirror,

    eT_Script,
    eT_comment,
    eT_asm,

    eT_RenderOrder,
    eT_ProcessOrder,
    eT_RenderCamera,
    eT_RenderType,
    eT_RenderFilter,
    eT_RenderColorTarget1,
    eT_RenderDepthStencilTarget,
    eT_ClearSetColor,
    eT_ClearSetDepth,
    eT_ClearTarget,
    eT_RenderTarget_IDPool,
    eT_RenderTarget_UpdateType,
    eT_RenderTarget_Width,
    eT_RenderTarget_Height,
    eT_GenerateMips,

    eT_PreProcess,
    eT_PostProcess,
    eT_PreDraw,

    eT_WaterReflection,
    eT_Panorama,

    eT_WaterPlaneReflected,
    eT_PlaneReflected,
    eT_Current,

    eT_CurObject,
    eT_CurScene,
    eT_RecursiveScene,
    eT_CopyScene,

    eT_Refractive,
    eT_ForceRefractionUpdate,
    eT_Heat,

    eT_DepthBuffer,
    eT_DepthBufferTemp,
    eT_DepthBufferOrig,

    eT_$ScreenSize,
    eT_WaterReflect,
    eT_FogColor,

    eT_Color,
    eT_Depth,

    eT_$RT_2D,
    eT_$RT_Cube,

    eT_pass,
    eT_CustomRE,
    eT_Style,

    eT_VertexShader,
    eT_PixelShader,
    eT_GeometryShader,
    eT_HullShader,
    eT_DomainShader,
    eT_ComputeShader,
    eT_ZEnable,
    eT_ZWriteEnable,
    eT_CullMode,
    eT_SrcBlend,
    eT_DestBlend,
    eT_AlphaBlendEnable,
    eT_AlphaFunc,
    eT_AlphaRef,
    eT_ZFunc,
    eT_ColorWriteEnable,
    eT_IgnoreMaterialState,

    eT_None,
    eT_Disable,
    eT_CCW,
    eT_CW,
    eT_Back,
    eT_Front,

    eT_Never,
    eT_Less,
    eT_Equal,
    eT_LEqual,
    eT_LessEqual,
    eT_NotEqual,
    eT_GEqual,
    eT_GreaterEqual,
    eT_Greater,
    eT_Always,

    eT_RED,
    eT_GREEN,
    eT_BLUE,
    eT_ALPHA,

    eT_ONE,
    eT_ZERO,
    eT_SRC_COLOR,
    eT_SrcColor,
    eT_ONE_MINUS_SRC_COLOR,
    eT_InvSrcColor,
    eT_SRC_ALPHA,
    eT_SrcAlpha,
    eT_ONE_MINUS_SRC_ALPHA,
    eT_InvSrcAlpha,
    eT_DST_ALPHA,
    eT_DestAlpha,
    eT_ONE_MINUS_DST_ALPHA,
    eT_InvDestAlpha,
    eT_DST_COLOR,
    eT_DestColor,
    eT_ONE_MINUS_DST_COLOR,
    eT_InvDestColor,
    eT_SRC_ALPHA_SATURATE,

    eT_NULL,

    eT_cbuffer,
    eT_PER_BATCH,
    eT_PER_INSTANCE,
    eT_PER_FRAME,
    eT_PER_MATERIAL,
    eT_PER_SHADOWGEN,

    eT_ShaderType,
    eT_ShaderDrawType,
    eT_PreprType,
    eT_Public,
    eT_NoPreview,
    eT_LocalConstants,
    eT_Cull,
    eT_SupportsAttrInstancing,
    eT_SupportsConstInstancing,
    eT_SupportsDeferredShading,
    eT_SupportsFullDeferredShading,
    eT_Decal,
    eT_DecalNoDepthOffset,
    eT_NoChunkMerging,
    eT_ForceTransPass,
    eT_AfterHDRPostProcess,
    eT_AfterPostProcess,
    eT_ForceZpass,
    eT_ForceWaterPass,
    eT_ForceDrawLast,
    eT_ForceDrawFirst,
    eT_ForceDrawAfterWater,
    eT_DepthFixup,
    eT_SingleLightPass,
    eT_HWTessellation,
    eT_WaterParticle,
    eT_AlphaBlendShadows,
    eT_ZPrePass,

    eT_Light,
    eT_Shadow,
    eT_Fur,
    eT_General,
    eT_Terrain,
    eT_Overlay,
    eT_NoDraw,
    eT_Custom,
    eT_Sky,
    eT_OceanShore,
    eT_Hair,
    eT_Compute,
    eT_ForceGeneralPass,
    eT_SkinPass,
    eT_EyeOverlay,

    eT_Metal,
    eT_Ice,
    eT_Water,
    eT_FX,
    eT_HDR,
    eT_Glass,
    eT_Vegetation,
    eT_Particle,
    eT_GenerateSprites,
    eT_GenerateClouds,
    eT_ScanWater,

    eT_NoLights,
    eT_NoMaterialState,
    eT_PositionInvariant,

    //-------------------------------------------------------------------------
    // Technique Order
    //-------------------------------------------------------------------------
    // Remark:  The following technique has to be first Technique as we are subtracting it to get
    // index of technique's slots.
    // Warning: if technique slots order is changed they should be well reflected in other files
    // such as 'IShader.h' which defines the order of the techniques' slots as per 'EShaderTechniqueID'.
    // This is all matched in the method 'CShaderMan::mfPostLoadFX' during load.
    //-------------------------------------------------------------------------
    eT_TechniqueZ,
    eT_TechniqueShadowGen,
    eT_TechniqueMotionBlur,
    eT_TechniqueCustomRender,
    eT_TechniqueEffectLayer,
    eT_TechniqueDebug,
    eT_TechniqueSoftAlphaTest,
    eT_TechniqueWaterRefl,
    eT_TechniqueWaterCaustic,
    eT_TechniqueZPrepass,
    eT_TechniqueThickness,

    eT_TechniqueMax,
    //-------------------------------------------------------------------------

    eT_KeyFrameParams,
    eT_KeyFrameRandColor,
    eT_KeyFrameRandIntensity,
    eT_KeyFrameRandSpecMult,
    eT_KeyFrameRandPosOffset,
    eT_Speed,

    eT_Beam,
    eT_LensOptics,
    eT_Cloud,
    eT_Ocean,

    eT_Model,
    eT_StartRadius,
    eT_EndRadius,
    eT_StartColor,
    eT_EndColor,
    eT_LightStyle,
    eT_Length,

    eT_RGBStyle,
    eT_Scale,
    eT_Blind,
    eT_SizeBlindScale,
    eT_SizeBlindBias,
    eT_IntensBlindScale,
    eT_IntensBlindBias,
    eT_MinLight,
    eT_DistFactor,
    eT_DistIntensityFactor,
    eT_FadeTime,
    eT_Layer,
    eT_Importance,
    eT_VisAreaScale,

    eT_Poly,
    eT_Identity,
    eT_FromObj,
    eT_FromLight,
    eT_Fixed,

    eT_ParticlesFile,

    eT_Gravity,
    eT_WindDirection,
    eT_WindSpeed,
    eT_WaveHeight,
    eT_DirectionalDependence,
    eT_ChoppyWaveFactor,
    eT_SuppressSmallWavesFactor,

    eT__LT_LIGHTS,
    eT__LT_NUM,
    eT__LT_HASPROJ,
    eT__LT_0_TYPE,
    eT__LT_1_TYPE,
    eT__LT_2_TYPE,
    eT__LT_3_TYPE,
    eT__TT_TEXCOORD_MATRIX,
    eT__TT_TEXCOORD_PROJ,
    eT__TT_TEXCOORD_GEN_OBJECT_LINEAR_DIFFUSE,
    eT__TT_TEXCOORD_GEN_OBJECT_LINEAR_EMITTANCE,
    eT__TT_TEXCOORD_GEN_OBJECT_LINEAR_EMITTANCE_MULT,
    eT__TT_TEXCOORD_GEN_OBJECT_LINEAR_DETAIL,
    eT__TT_TEXCOORD_GEN_OBJECT_LINEAR_CUSTOM,
    eT__VT_TYPE,
    eT__VT_TYPE_MODIF,
    eT__VT_BEND,
    eT__VT_DET_BEND,
    eT__VT_GRASS,
    eT__VT_WIND,
    eT__VT_DEPTH_OFFSET,
    eT__FT_TEXTURE,
    eT__FT_TEXTURE1,
    eT__FT_NORMAL,
    eT__FT_PSIZE,
    eT__FT_DIFFUSE,
    eT__FT_SPECULAR,
    eT__FT_TANGENT_STREAM,
    eT__FT_QTANGENT_STREAM,
    eT__FT_SKIN_STREAM,
    eT__FT_VERTEX_VELOCITY_STREAM,
    eT__FT_SRGBWRITE,
    eT__FT0_COP,
    eT__FT0_AOP,
    eT__FT0_CARG1,
    eT__FT0_CARG2,
    eT__FT0_AARG1,
    eT__FT0_AARG2,

    eT__VS,
    eT__PS,
    eT__GS,
    eT__HS,
    eT__DS,
    eT__CS,

    // -----------------------------------------------------------------------
    // ORIGINAL CODE BEGIN
    // eT__g_SkinQuat,

    // eT_x,
    // eT_y,
    // eT_z,
    // eT_w,
    // eT_r,
    // eT_g,
    // eT_b,
    // eT_a,

    // ORIGINAL CODE END
    // FIX FOR NEW WORLD BEGIN
    eT__g_SkinQuat,
    eT__PADDED, // pushes x,y,z,w one position further

    eT_x,
    eT_y,
    eT_z,
    eT_w,
    // eT_r, // pulls eT_0 4 positions back
    // eT_g,
    // eT_b,
    // eT_a,
    // FIX FOR NEW WORLD END
    // -----------------------------------------------------------------------
    eT_true,
    eT_false,

    eT_0,
    eT_1,
    eT_2,
    eT_3,
    eT_4,
    eT_5,
    eT_6,
    eT_7,
    eT_8,
    eT_9,
    eT_10,
    eT_11,
    eT_12,
    eT_13,
    eT_14,
    eT_15,
    eT_16,
    eT_17,
    eT_18,
    eT_19,
    eT_20,
    eT_21,
    eT_22,
    eT_23,
    eT_24,

    eT_AnisotropyLevel,

    eT_ORBIS,
    eT_DURANGO,
    eT_PCDX11,
    eT_GL4,
    eT_GLES3,
    eT_METAL,
    eT_OSXMETAL,
    eT_IOSMETAL,

    eT_VT_DetailBendingGrass,
    eT_VT_DetailBending,
    eT_VT_WindBending,
    eT_VertexColors,

    eT_s0,
    eT_s1,
    eT_s2,
    eT_s3,
    eT_s4,
    eT_s5,
    eT_s6,
    eT_s7,
    eT_s8,
    eT_s9,
    eT_s10,
    eT_s11,
    eT_s12,
    eT_s13,
    eT_s14,
    eT_s15,

    eT_t0,
    eT_t1,
    eT_t2,
    eT_t3,
    eT_t4,
    eT_t5,
    eT_t6,
    eT_t7,
    eT_t8,
    eT_t9,
    eT_t10,
    eT_t11,
    eT_t12,
    eT_t13,
    eT_t14,
    eT_t15,

    eT_Global,

    eT_GLES3_0,

    eT_Load,
    eT_Sample,
    eT_Gather,
    eT_GatherRed,
    eT_GatherGreen,
    eT_GatherBlue,
    eT_GatherAlpha,

    eT_max,
    eT_user_first = eT_max + 1
};

const keyTokens: Record<any, string | number> = {}

function fxTokenKey(key: string | number, token: EToken) {
  keyTokens[token] = key
}
function FX_REGISTER_TOKEN(id: string | number){
  fxTokenKey(id, EToken[`eT_${id}`] )
}
fxTokenKey('#include', EToken.eT_include)
fxTokenKey('#define', EToken.eT_define)
fxTokenKey('#undefine', EToken.eT_undefine)
fxTokenKey('#define', EToken.eT_define_2)
fxTokenKey('#fetchinst', EToken.eT_fetchinst)
fxTokenKey('#if', EToken.eT_if)
fxTokenKey('#ifdef', EToken.eT_ifdef)
fxTokenKey('#ifndef', EToken.eT_ifndef)
fxTokenKey('#if', EToken.eT_if_2)
fxTokenKey('#ifdef', EToken.eT_ifdef_2)
fxTokenKey('#ifndef', EToken.eT_ifndef_2)
fxTokenKey('#endif', EToken.eT_endif)
fxTokenKey('#else', EToken.eT_else)
fxTokenKey('#elif', EToken.eT_elif)
fxTokenKey('#warning', EToken.eT_warning)
fxTokenKey('#register_env', EToken.eT_register_env)
fxTokenKey('#ifcvar', EToken.eT_ifcvar)
fxTokenKey('#ifncvar', EToken.eT_ifncvar)
fxTokenKey('#elifcvar', EToken.eT_elifcvar)
fxTokenKey('#skip', EToken.eT_skip)
fxTokenKey('#skip_(', EToken.eT_skip_1)
fxTokenKey('#skip_)', EToken.eT_skip_2)

fxTokenKey('|', EToken.eT_or)
fxTokenKey('&', EToken.eT_and)

fxTokenKey('(', EToken.eT_br_rnd_1)
fxTokenKey(')', EToken.eT_br_rnd_2)
fxTokenKey('[', EToken.eT_br_sq_1)
fxTokenKey(']', EToken.eT_br_sq_2)
fxTokenKey('{', EToken.eT_br_cv_1)
fxTokenKey('}', EToken.eT_br_cv_2)
fxTokenKey('<', EToken.eT_br_tr_1)
fxTokenKey('>', EToken.eT_br_tr_2)
fxTokenKey(',', EToken.eT_comma)
fxTokenKey('.', EToken.eT_dot)
fxTokenKey(':', EToken.eT_colon)
fxTokenKey(';', EToken.eT_semicolumn)
fxTokenKey('!', EToken.eT_excl)
fxTokenKey('"', EToken.eT_quote)
fxTokenKey("'", EToken.eT_sing_quote)

fxTokenKey('s0', EToken.eT_s0)
fxTokenKey('s1', EToken.eT_s1)
fxTokenKey('s2', EToken.eT_s2)
fxTokenKey('s3', EToken.eT_s3)
fxTokenKey('s4', EToken.eT_s4)
fxTokenKey('s5', EToken.eT_s5)
fxTokenKey('s6', EToken.eT_s6)
fxTokenKey('s7', EToken.eT_s7)
fxTokenKey('s8', EToken.eT_s8)
fxTokenKey('s9', EToken.eT_s9)
fxTokenKey('s10', EToken.eT_s10)
fxTokenKey('s11', EToken.eT_s11)
fxTokenKey('s12', EToken.eT_s12)
fxTokenKey('s13', EToken.eT_s13)
fxTokenKey('s14', EToken.eT_s14)
fxTokenKey('s15', EToken.eT_s15)

fxTokenKey('t0', EToken.eT_t0)
fxTokenKey('t1', EToken.eT_t1)
fxTokenKey('t2', EToken.eT_t2)
fxTokenKey('t3', EToken.eT_t3)
fxTokenKey('t4', EToken.eT_t4)
fxTokenKey('t5', EToken.eT_t5)
fxTokenKey('t6', EToken.eT_t6)
fxTokenKey('t7', EToken.eT_t7)
fxTokenKey('t8', EToken.eT_t8)
fxTokenKey('t9', EToken.eT_t9)
fxTokenKey('t10', EToken.eT_t10)
fxTokenKey('t11', EToken.eT_t11)
fxTokenKey('t12', EToken.eT_t12)
fxTokenKey('t13', EToken.eT_t13)
fxTokenKey('t14', EToken.eT_t14)
fxTokenKey('t15', EToken.eT_t15)

fxTokenKey('//', EToken.eT_comment)

fxTokenKey('?', EToken.eT_question)
fxTokenKey('=', EToken.eT_eq)
fxTokenKey('+', EToken.eT_plus)
fxTokenKey('-', EToken.eT_minus)
fxTokenKey('/', EToken.eT_div)
fxTokenKey('*', EToken.eT_mul)
fxTokenKey('dot', EToken.eT_dot_math)
fxTokenKey('mul', EToken.eT_mul_math)
fxTokenKey('sqrt', EToken.eT_sqrt_math)
fxTokenKey('exp', EToken.eT_exp_math)
fxTokenKey('log', EToken.eT_log_math)
fxTokenKey('log2', EToken.eT_log2_math)
fxTokenKey('sin', EToken.eT_sin_math)
fxTokenKey('cos', EToken.eT_cos_math)
fxTokenKey('sincos', EToken.eT_sincos_math)
fxTokenKey('floor', EToken.eT_floor_math)
fxTokenKey('floor', EToken.eT_ceil_math)
fxTokenKey('frac', EToken.eT_frac_math)
fxTokenKey('lerp', EToken.eT_lerp_math)
fxTokenKey('abs', EToken.eT_abs_math)
fxTokenKey('clamp', EToken.eT_clamp_math)
fxTokenKey('min', EToken.eT_min_math)
fxTokenKey('max', EToken.eT_max_math)
fxTokenKey('length', EToken.eT_length_math)

fxTokenKey('%_LT_LIGHTS', EToken.eT__LT_LIGHTS)
fxTokenKey('%_LT_NUM', EToken.eT__LT_NUM)
fxTokenKey('%_LT_HASPROJ', EToken.eT__LT_HASPROJ)
fxTokenKey('%_LT_0_TYPE', EToken.eT__LT_0_TYPE)
fxTokenKey('%_LT_1_TYPE', EToken.eT__LT_1_TYPE)
fxTokenKey('%_LT_2_TYPE', EToken.eT__LT_2_TYPE)
fxTokenKey('%_LT_3_TYPE', EToken.eT__LT_3_TYPE)
fxTokenKey('%_TT_TEXCOORD_MATRIX', EToken.eT__TT_TEXCOORD_MATRIX)
fxTokenKey('%_TT_TEXCOORD_GEN_OBJECT_LINEAR_DIFFUSE', EToken.eT__TT_TEXCOORD_GEN_OBJECT_LINEAR_DIFFUSE)
fxTokenKey('%_TT_TEXCOORD_GEN_OBJECT_LINEAR_EMITTANCE', EToken.eT__TT_TEXCOORD_GEN_OBJECT_LINEAR_EMITTANCE)
fxTokenKey('%_TT_TEXCOORD_GEN_OBJECT_LINEAR_EMITTANCE_MULT', EToken.eT__TT_TEXCOORD_GEN_OBJECT_LINEAR_EMITTANCE_MULT)
fxTokenKey('%_TT_TEXCOORD_GEN_OBJECT_LINEAR_DETAIL', EToken.eT__TT_TEXCOORD_GEN_OBJECT_LINEAR_DETAIL)
fxTokenKey('%_TT_TEXCOORD_GEN_OBJECT_LINEAR_CUSTOM', EToken.eT__TT_TEXCOORD_GEN_OBJECT_LINEAR_CUSTOM)
fxTokenKey('%_TT_TEXCOORD_PROJ', EToken.eT__TT_TEXCOORD_PROJ)
fxTokenKey('%_VT_TYPE', EToken.eT__VT_TYPE)
fxTokenKey('%_VT_TYPE_MODIF', EToken.eT__VT_TYPE_MODIF)
fxTokenKey('%_VT_BEND', EToken.eT__VT_BEND)
fxTokenKey('%_VT_DET_BEND', EToken.eT__VT_DET_BEND)
fxTokenKey('%_VT_GRASS', EToken.eT__VT_GRASS)
fxTokenKey('%_VT_WIND', EToken.eT__VT_WIND)
fxTokenKey('%_VT_DEPTH_OFFSET', EToken.eT__VT_DEPTH_OFFSET)
fxTokenKey('%_FT_TEXTURE', EToken.eT__FT_TEXTURE)
fxTokenKey('%_FT_TEXTURE1', EToken.eT__FT_TEXTURE1)
fxTokenKey('%_FT_NORMAL', EToken.eT__FT_NORMAL)
fxTokenKey('%_FT_PSIZE', EToken.eT__FT_PSIZE)
fxTokenKey('%_FT_DIFFUSE', EToken.eT__FT_DIFFUSE)
fxTokenKey('%_FT_SPECULAR', EToken.eT__FT_SPECULAR)
fxTokenKey('%_FT_TANGENT_STREAM', EToken.eT__FT_TANGENT_STREAM)
fxTokenKey('%_FT_QTANGENT_STREAM', EToken.eT__FT_QTANGENT_STREAM)
fxTokenKey('%_FT_SKIN_STREAM', EToken.eT__FT_SKIN_STREAM)
fxTokenKey('%_FT_VERTEX_VELOCITY_STREAM', EToken.eT__FT_VERTEX_VELOCITY_STREAM)
fxTokenKey('%_FT_SRGBWRITE', EToken.eT__FT_SRGBWRITE)
fxTokenKey('%_FT0_COP', EToken.eT__FT0_COP)
fxTokenKey('%_FT0_AOP', EToken.eT__FT0_AOP)
fxTokenKey('%_FT0_CARG1', EToken.eT__FT0_CARG1)
fxTokenKey('%_FT0_CARG2', EToken.eT__FT0_CARG2)
fxTokenKey('%_FT0_AARG1', EToken.eT__FT0_AARG1)
fxTokenKey('%_FT0_AARG2', EToken.eT__FT0_AARG2)

fxTokenKey('%_VS', EToken.eT__VS)
fxTokenKey('%_PS', EToken.eT__PS)
fxTokenKey('%_GS', EToken.eT__GS)
fxTokenKey('%_HS', EToken.eT__HS)
fxTokenKey('%_DS', EToken.eT__DS)
fxTokenKey('%_CS', EToken.eT__CS)


//FX_REGISTER_TOKEN("_g_SkinQuat")

FX_REGISTER_TOKEN("tex2D")
FX_REGISTER_TOKEN("tex2Dproj")
FX_REGISTER_TOKEN("tex3D")
FX_REGISTER_TOKEN("texCUBE")
FX_REGISTER_TOKEN("sampler1D")
FX_REGISTER_TOKEN("sampler2D")
FX_REGISTER_TOKEN("sampler3D")
FX_REGISTER_TOKEN("samplerCUBE")
FX_REGISTER_TOKEN("SamplerState")
FX_REGISTER_TOKEN("SamplerComparisonState")
FX_REGISTER_TOKEN("sampler_state")
FX_REGISTER_TOKEN("Texture2D")
FX_REGISTER_TOKEN("Texture2DArray")
FX_REGISTER_TOKEN("Texture2DMS")
FX_REGISTER_TOKEN("RWTexture2D")
FX_REGISTER_TOKEN("RWTexture2DArray")
FX_REGISTER_TOKEN("TextureCube")
FX_REGISTER_TOKEN("TextureCubeArray")
FX_REGISTER_TOKEN("Texture3D")
FX_REGISTER_TOKEN("RWTexture3D")

FX_REGISTER_TOKEN("float")
FX_REGISTER_TOKEN("float2")
FX_REGISTER_TOKEN("float3")
FX_REGISTER_TOKEN("float4")
FX_REGISTER_TOKEN("float4x4")
FX_REGISTER_TOKEN("float3x4")
FX_REGISTER_TOKEN("float2x4")
FX_REGISTER_TOKEN("float3x3")
FX_REGISTER_TOKEN("half")
FX_REGISTER_TOKEN("half2")
FX_REGISTER_TOKEN("half3")
FX_REGISTER_TOKEN("half4")
FX_REGISTER_TOKEN("half4x4")
FX_REGISTER_TOKEN("half3x4")
FX_REGISTER_TOKEN("half2x4")
FX_REGISTER_TOKEN("half3x3")
FX_REGISTER_TOKEN("bool")
FX_REGISTER_TOKEN("int")
FX_REGISTER_TOKEN("int2")
FX_REGISTER_TOKEN("int4")
FX_REGISTER_TOKEN("uint")
FX_REGISTER_TOKEN("uint2")
FX_REGISTER_TOKEN("uint4")

FX_REGISTER_TOKEN("inout")
FX_REGISTER_TOKEN("asm")

FX_REGISTER_TOKEN("struct")
FX_REGISTER_TOKEN("sampler")
FX_REGISTER_TOKEN("const")
FX_REGISTER_TOKEN("static")
FX_REGISTER_TOKEN("groupshared")
FX_REGISTER_TOKEN("TEXCOORDN")
FX_REGISTER_TOKEN("TEXCOORD0")
FX_REGISTER_TOKEN("TEXCOORD1")
FX_REGISTER_TOKEN("TEXCOORD2")
FX_REGISTER_TOKEN("TEXCOORD3")
FX_REGISTER_TOKEN("TEXCOORD4")
FX_REGISTER_TOKEN("TEXCOORD5")
FX_REGISTER_TOKEN("TEXCOORD6")
FX_REGISTER_TOKEN("TEXCOORD7")
FX_REGISTER_TOKEN("TEXCOORD8")
FX_REGISTER_TOKEN("TEXCOORD9")
FX_REGISTER_TOKEN("TEXCOORD10")
FX_REGISTER_TOKEN("TEXCOORD11")
FX_REGISTER_TOKEN("TEXCOORD12")
FX_REGISTER_TOKEN("TEXCOORD13")
FX_REGISTER_TOKEN("TEXCOORD14")
FX_REGISTER_TOKEN("TEXCOORD15")
FX_REGISTER_TOKEN("TEXCOORD16")
FX_REGISTER_TOKEN("TEXCOORD17")
FX_REGISTER_TOKEN("TEXCOORD18")
FX_REGISTER_TOKEN("TEXCOORD19")
FX_REGISTER_TOKEN("TEXCOORD20")
FX_REGISTER_TOKEN("TEXCOORD21")
FX_REGISTER_TOKEN("TEXCOORD22")
FX_REGISTER_TOKEN("TEXCOORD23")
FX_REGISTER_TOKEN("TEXCOORD24")
FX_REGISTER_TOKEN("TEXCOORD25")
FX_REGISTER_TOKEN("TEXCOORD26")
FX_REGISTER_TOKEN("TEXCOORD27")
FX_REGISTER_TOKEN("TEXCOORD28")
FX_REGISTER_TOKEN("TEXCOORD29")
FX_REGISTER_TOKEN("TEXCOORD30")
FX_REGISTER_TOKEN("TEXCOORD31")
FX_REGISTER_TOKEN("TEXCOORDN_centroid")
FX_REGISTER_TOKEN("TEXCOORD0_centroid")
FX_REGISTER_TOKEN("TEXCOORD1_centroid")
FX_REGISTER_TOKEN("TEXCOORD2_centroid")
FX_REGISTER_TOKEN("TEXCOORD3_centroid")
FX_REGISTER_TOKEN("TEXCOORD4_centroid")
FX_REGISTER_TOKEN("TEXCOORD5_centroid")
FX_REGISTER_TOKEN("TEXCOORD6_centroid")
FX_REGISTER_TOKEN("TEXCOORD7_centroid")
FX_REGISTER_TOKEN("TEXCOORD8_centroid")
FX_REGISTER_TOKEN("TEXCOORD9_centroid")
FX_REGISTER_TOKEN("TEXCOORD10_centroid")
FX_REGISTER_TOKEN("TEXCOORD11_centroid")
FX_REGISTER_TOKEN("TEXCOORD12_centroid")
FX_REGISTER_TOKEN("TEXCOORD13_centroid")
FX_REGISTER_TOKEN("TEXCOORD14_centroid")
FX_REGISTER_TOKEN("TEXCOORD15_centroid")
FX_REGISTER_TOKEN("TEXCOORD16_centroid")
FX_REGISTER_TOKEN("TEXCOORD17_centroid")
FX_REGISTER_TOKEN("TEXCOORD18_centroid")
FX_REGISTER_TOKEN("TEXCOORD19_centroid")
FX_REGISTER_TOKEN("TEXCOORD20_centroid")
FX_REGISTER_TOKEN("TEXCOORD21_centroid")
FX_REGISTER_TOKEN("TEXCOORD22_centroid")
FX_REGISTER_TOKEN("TEXCOORD23_centroid")
FX_REGISTER_TOKEN("TEXCOORD24_centroid")
FX_REGISTER_TOKEN("TEXCOORD25_centroid")
FX_REGISTER_TOKEN("TEXCOORD26_centroid")
FX_REGISTER_TOKEN("TEXCOORD27_centroid")
FX_REGISTER_TOKEN("TEXCOORD28_centroid")
FX_REGISTER_TOKEN("TEXCOORD29_centroid")
FX_REGISTER_TOKEN("TEXCOORD30_centroid")
FX_REGISTER_TOKEN("TEXCOORD31_centroid")
FX_REGISTER_TOKEN("COLOR0")

FX_REGISTER_TOKEN("packoffset")
FX_REGISTER_TOKEN("register")
FX_REGISTER_TOKEN("return ")
FX_REGISTER_TOKEN("vsregister")
FX_REGISTER_TOKEN("psregister")
FX_REGISTER_TOKEN("gsregister")
FX_REGISTER_TOKEN("dsregister")
FX_REGISTER_TOKEN("hsregister")
FX_REGISTER_TOKEN("csregister")
FX_REGISTER_TOKEN("slot")
FX_REGISTER_TOKEN("vsslot")
FX_REGISTER_TOKEN("psslot")
FX_REGISTER_TOKEN("gsslot")
FX_REGISTER_TOKEN("dsslot")
FX_REGISTER_TOKEN("hsslot")
FX_REGISTER_TOKEN("csslot")
FX_REGISTER_TOKEN("color")

FX_REGISTER_TOKEN("Buffer")
FX_REGISTER_TOKEN("RWBuffer")
FX_REGISTER_TOKEN("StructuredBuffer")
FX_REGISTER_TOKEN("RWStructuredBuffer")
FX_REGISTER_TOKEN("ByteAddressBuffer")
FX_REGISTER_TOKEN("RWByteAddressBuffer")
FX_REGISTER_TOKEN("RasterizerOrderedBuffer")
FX_REGISTER_TOKEN("RasterizerOrderedByteAddressBuffer")
FX_REGISTER_TOKEN("RasterizerOrderedStructuredBuffer")

FX_REGISTER_TOKEN("Position")
FX_REGISTER_TOKEN("Allways")

FX_REGISTER_TOKEN("STANDARDSGLOBAL")

FX_REGISTER_TOKEN("technique")
FX_REGISTER_TOKEN("string")
FX_REGISTER_TOKEN("UIName")
FX_REGISTER_TOKEN("UIDescription")
FX_REGISTER_TOKEN("UIWidget")
FX_REGISTER_TOKEN("UIWidget0")
FX_REGISTER_TOKEN("UIWidget1")
FX_REGISTER_TOKEN("UIWidget2")
FX_REGISTER_TOKEN("UIWidget3")

FX_REGISTER_TOKEN("Texture")
FX_REGISTER_TOKEN("Filter")
FX_REGISTER_TOKEN("MinFilter")
FX_REGISTER_TOKEN("MagFilter")
FX_REGISTER_TOKEN("MipFilter")
FX_REGISTER_TOKEN("AddressU")
FX_REGISTER_TOKEN("AddressV")
FX_REGISTER_TOKEN("AddressW")
FX_REGISTER_TOKEN("BorderColor")
FX_REGISTER_TOKEN("AnisotropyLevel")
FX_REGISTER_TOKEN("sRGBLookup")
FX_REGISTER_TOKEN("Global")

FX_REGISTER_TOKEN("LINEAR")
FX_REGISTER_TOKEN("POINT")
FX_REGISTER_TOKEN("NONE")
FX_REGISTER_TOKEN("ANISOTROPIC")
FX_REGISTER_TOKEN("MIN_MAG_MIP_POINT")
FX_REGISTER_TOKEN("MIN_MAG_MIP_LINEAR")
FX_REGISTER_TOKEN("MIN_MAG_LINEAR_MIP_POINT")
FX_REGISTER_TOKEN("COMPARISON_MIN_MAG_LINEAR_MIP_POINT")
FX_REGISTER_TOKEN("MINIMUM_MIN_MAG_MIP_LINEAR")
FX_REGISTER_TOKEN("MAXIMUM_MIN_MAG_MIP_LINEAR")

FX_REGISTER_TOKEN("Clamp")
FX_REGISTER_TOKEN("Border")
FX_REGISTER_TOKEN("Wrap")
FX_REGISTER_TOKEN("Mirror")

FX_REGISTER_TOKEN("Script")

FX_REGISTER_TOKEN("RenderOrder")
FX_REGISTER_TOKEN("ProcessOrder")
FX_REGISTER_TOKEN("RenderCamera")
FX_REGISTER_TOKEN("RenderType")
FX_REGISTER_TOKEN("RenderFilter")
FX_REGISTER_TOKEN("RenderColorTarget1")
FX_REGISTER_TOKEN("RenderDepthStencilTarget")
FX_REGISTER_TOKEN("ClearSetColor")
FX_REGISTER_TOKEN("ClearSetDepth")
FX_REGISTER_TOKEN("ClearTarget")
FX_REGISTER_TOKEN("RenderTarget_IDPool")
FX_REGISTER_TOKEN("RenderTarget_UpdateType")
FX_REGISTER_TOKEN("RenderTarget_Width")
FX_REGISTER_TOKEN("RenderTarget_Height")
FX_REGISTER_TOKEN("GenerateMips")

FX_REGISTER_TOKEN("PreProcess")
FX_REGISTER_TOKEN("PostProcess")
FX_REGISTER_TOKEN("PreDraw")

FX_REGISTER_TOKEN("WaterReflection")
FX_REGISTER_TOKEN("Panorama")

FX_REGISTER_TOKEN("WaterPlaneReflected")
FX_REGISTER_TOKEN("PlaneReflected")
FX_REGISTER_TOKEN("Current")

FX_REGISTER_TOKEN("CurObject")
FX_REGISTER_TOKEN("CurScene")
FX_REGISTER_TOKEN("RecursiveScene")
FX_REGISTER_TOKEN("CopyScene")

FX_REGISTER_TOKEN("Refractive")
FX_REGISTER_TOKEN("ForceRefractionUpdate")
FX_REGISTER_TOKEN("Heat")

FX_REGISTER_TOKEN("DepthBuffer")
FX_REGISTER_TOKEN("DepthBufferTemp")
FX_REGISTER_TOKEN("DepthBufferOrig")

FX_REGISTER_TOKEN("$ScreenSize")
FX_REGISTER_TOKEN("WaterReflect")
FX_REGISTER_TOKEN("FogColor")

FX_REGISTER_TOKEN("Color")
FX_REGISTER_TOKEN("Depth")

FX_REGISTER_TOKEN("$RT_2D")
FX_REGISTER_TOKEN("$RT_Cube")

FX_REGISTER_TOKEN("pass")
FX_REGISTER_TOKEN("CustomRE")
FX_REGISTER_TOKEN("Style")

FX_REGISTER_TOKEN("VertexShader")
FX_REGISTER_TOKEN("PixelShader")
FX_REGISTER_TOKEN("GeometryShader")
FX_REGISTER_TOKEN("DomainShader")
FX_REGISTER_TOKEN("HullShader")
FX_REGISTER_TOKEN("ComputeShader")
FX_REGISTER_TOKEN("ZEnable")
FX_REGISTER_TOKEN("ZWriteEnable")
FX_REGISTER_TOKEN("CullMode")
FX_REGISTER_TOKEN("SrcBlend")
FX_REGISTER_TOKEN("DestBlend")
FX_REGISTER_TOKEN("AlphaBlendEnable")
FX_REGISTER_TOKEN("AlphaFunc")
FX_REGISTER_TOKEN("AlphaRef")
FX_REGISTER_TOKEN("ZFunc")
FX_REGISTER_TOKEN("ColorWriteEnable")
FX_REGISTER_TOKEN("IgnoreMaterialState")

FX_REGISTER_TOKEN("None")
FX_REGISTER_TOKEN("Disable")
FX_REGISTER_TOKEN("CCW")
FX_REGISTER_TOKEN("CW")
FX_REGISTER_TOKEN("Back")
FX_REGISTER_TOKEN("Front")

FX_REGISTER_TOKEN("Never")
FX_REGISTER_TOKEN("Less")
FX_REGISTER_TOKEN("Equal")
FX_REGISTER_TOKEN("LEqual")
FX_REGISTER_TOKEN("LessEqual")
FX_REGISTER_TOKEN("NotEqual")
FX_REGISTER_TOKEN("GEqual")
FX_REGISTER_TOKEN("GreaterEqual")
FX_REGISTER_TOKEN("Greater")
FX_REGISTER_TOKEN("Always")

FX_REGISTER_TOKEN("RED")
FX_REGISTER_TOKEN("GREEN")
FX_REGISTER_TOKEN("BLUE")
FX_REGISTER_TOKEN("ALPHA")

FX_REGISTER_TOKEN("ONE")
FX_REGISTER_TOKEN("ZERO")
FX_REGISTER_TOKEN("SRC_COLOR")
FX_REGISTER_TOKEN("SrcColor")
FX_REGISTER_TOKEN("ONE_MINUS_SRC_COLOR")
FX_REGISTER_TOKEN("InvSrcColor")
FX_REGISTER_TOKEN("SRC_ALPHA")
FX_REGISTER_TOKEN("SrcAlpha")
FX_REGISTER_TOKEN("ONE_MINUS_SRC_ALPHA")
FX_REGISTER_TOKEN("InvSrcAlpha")
FX_REGISTER_TOKEN("DST_ALPHA")
FX_REGISTER_TOKEN("DestAlpha")
FX_REGISTER_TOKEN("ONE_MINUS_DST_ALPHA")
FX_REGISTER_TOKEN("InvDestAlpha")
FX_REGISTER_TOKEN("DST_COLOR")
FX_REGISTER_TOKEN("DestColor")
FX_REGISTER_TOKEN("ONE_MINUS_DST_COLOR")
FX_REGISTER_TOKEN("InvDestColor")
FX_REGISTER_TOKEN("SRC_ALPHA_SATURATE")

FX_REGISTER_TOKEN("NULL")

FX_REGISTER_TOKEN("cbuffer")
FX_REGISTER_TOKEN("PER_BATCH")
FX_REGISTER_TOKEN("PER_INSTANCE")
FX_REGISTER_TOKEN("PER_FRAME")
FX_REGISTER_TOKEN("PER_MATERIAL")
FX_REGISTER_TOKEN("PER_SHADOWGEN")

FX_REGISTER_TOKEN("ShaderType")
FX_REGISTER_TOKEN("ShaderDrawType")
FX_REGISTER_TOKEN("PreprType")
FX_REGISTER_TOKEN("Public")
FX_REGISTER_TOKEN("NoPreview")
FX_REGISTER_TOKEN("LocalConstants")
FX_REGISTER_TOKEN("Cull")
FX_REGISTER_TOKEN("SupportsAttrInstancing")
FX_REGISTER_TOKEN("SupportsConstInstancing")
FX_REGISTER_TOKEN("SupportsDeferredShading")
FX_REGISTER_TOKEN("SupportsFullDeferredShading")
FX_REGISTER_TOKEN("Decal")
FX_REGISTER_TOKEN("DecalNoDepthOffset")
FX_REGISTER_TOKEN("NoChunkMerging")
FX_REGISTER_TOKEN("ForceTransPass")
FX_REGISTER_TOKEN("AfterHDRPostProcess")
FX_REGISTER_TOKEN("AfterPostProcess")
FX_REGISTER_TOKEN("ForceZpass")
FX_REGISTER_TOKEN("ForceWaterPass")
FX_REGISTER_TOKEN("ForceDrawLast")
FX_REGISTER_TOKEN("ForceDrawFirst")
FX_REGISTER_TOKEN("ForceDrawAfterWater")
FX_REGISTER_TOKEN("DepthFixup")
FX_REGISTER_TOKEN("SingleLightPass")
FX_REGISTER_TOKEN("HWTessellation")
FX_REGISTER_TOKEN("VertexColors")
FX_REGISTER_TOKEN("WaterParticle")
FX_REGISTER_TOKEN("AlphaBlendShadows")
FX_REGISTER_TOKEN("ZPrePass")

FX_REGISTER_TOKEN("VT_DetailBendingGrass")
FX_REGISTER_TOKEN("VT_DetailBending")
FX_REGISTER_TOKEN("VT_WindBending")

FX_REGISTER_TOKEN("Light")
FX_REGISTER_TOKEN("Shadow")
FX_REGISTER_TOKEN("Fur")
FX_REGISTER_TOKEN("General")
FX_REGISTER_TOKEN("Terrain")
FX_REGISTER_TOKEN("Overlay")
FX_REGISTER_TOKEN("NoDraw")
FX_REGISTER_TOKEN("Custom")
FX_REGISTER_TOKEN("Sky")
FX_REGISTER_TOKEN("OceanShore")
FX_REGISTER_TOKEN("Hair")
FX_REGISTER_TOKEN("Compute")
FX_REGISTER_TOKEN("SkinPass")
FX_REGISTER_TOKEN("ForceGeneralPass")
FX_REGISTER_TOKEN("EyeOverlay")

FX_REGISTER_TOKEN("Metal")
FX_REGISTER_TOKEN("Ice")
FX_REGISTER_TOKEN("Water")
FX_REGISTER_TOKEN("FX")
FX_REGISTER_TOKEN("HDR")
FX_REGISTER_TOKEN("Glass")
FX_REGISTER_TOKEN("Vegetation")
FX_REGISTER_TOKEN("Particle")
FX_REGISTER_TOKEN("GenerateSprites")
FX_REGISTER_TOKEN("GenerateClouds")
FX_REGISTER_TOKEN("ScanWater")

FX_REGISTER_TOKEN("NoLights")
FX_REGISTER_TOKEN("NoMaterialState")
FX_REGISTER_TOKEN("PositionInvariant")
FX_REGISTER_TOKEN("TechniqueZ")
FX_REGISTER_TOKEN("TechniqueZPrepass")
FX_REGISTER_TOKEN("TechniqueShadowGen")
FX_REGISTER_TOKEN("TechniqueMotionBlur")
FX_REGISTER_TOKEN("TechniqueCustomRender")
FX_REGISTER_TOKEN("TechniqueEffectLayer")
FX_REGISTER_TOKEN("TechniqueDebug")
FX_REGISTER_TOKEN("TechniqueSoftAlphaTest")
FX_REGISTER_TOKEN("TechniqueWaterRefl")
FX_REGISTER_TOKEN("TechniqueWaterCaustic")
FX_REGISTER_TOKEN("TechniqueThickness")

FX_REGISTER_TOKEN("KeyFrameParams")
FX_REGISTER_TOKEN("KeyFrameRandColor")
FX_REGISTER_TOKEN("KeyFrameRandIntensity")
FX_REGISTER_TOKEN("KeyFrameRandSpecMult")
FX_REGISTER_TOKEN("KeyFrameRandPosOffset")
FX_REGISTER_TOKEN("Speed")

FX_REGISTER_TOKEN("Beam")
FX_REGISTER_TOKEN("LensOptics")
FX_REGISTER_TOKEN("Cloud")
FX_REGISTER_TOKEN("Ocean")

FX_REGISTER_TOKEN("Model")
FX_REGISTER_TOKEN("StartRadius")
FX_REGISTER_TOKEN("EndRadius")
FX_REGISTER_TOKEN("StartColor")
FX_REGISTER_TOKEN("EndColor")
FX_REGISTER_TOKEN("LightStyle")
FX_REGISTER_TOKEN("Length")

FX_REGISTER_TOKEN("RGBStyle")
FX_REGISTER_TOKEN("Scale")
FX_REGISTER_TOKEN("Blind")
FX_REGISTER_TOKEN("SizeBlindScale")
FX_REGISTER_TOKEN("SizeBlindBias")
FX_REGISTER_TOKEN("IntensBlindScale")
FX_REGISTER_TOKEN("IntensBlindBias")
FX_REGISTER_TOKEN("MinLight")
FX_REGISTER_TOKEN("DistFactor")
FX_REGISTER_TOKEN("DistIntensityFactor")
FX_REGISTER_TOKEN("FadeTime")
FX_REGISTER_TOKEN("Layer")
FX_REGISTER_TOKEN("Importance")
FX_REGISTER_TOKEN("VisAreaScale")

FX_REGISTER_TOKEN("Poly")
FX_REGISTER_TOKEN("Identity")
FX_REGISTER_TOKEN("FromObj")
FX_REGISTER_TOKEN("FromLight")
FX_REGISTER_TOKEN("Fixed")

FX_REGISTER_TOKEN("ParticlesFile")

FX_REGISTER_TOKEN("Gravity")
FX_REGISTER_TOKEN("WindDirection")
FX_REGISTER_TOKEN("WindSpeed")
FX_REGISTER_TOKEN("WaveHeight")
FX_REGISTER_TOKEN("DirectionalDependence")
FX_REGISTER_TOKEN("ChoppyWaveFactor")
FX_REGISTER_TOKEN("SuppressSmallWavesFactor")

FX_REGISTER_TOKEN("x")
FX_REGISTER_TOKEN("y")
FX_REGISTER_TOKEN("z")
FX_REGISTER_TOKEN("w")
FX_REGISTER_TOKEN("r")
FX_REGISTER_TOKEN("g")
FX_REGISTER_TOKEN("b")
FX_REGISTER_TOKEN("a")

// FX_REGISTER_TOKEN("true")
// FX_REGISTER_TOKEN("false")

FX_REGISTER_TOKEN("0")
FX_REGISTER_TOKEN("1")
FX_REGISTER_TOKEN("2")
FX_REGISTER_TOKEN("3")
FX_REGISTER_TOKEN("4")
FX_REGISTER_TOKEN("5")
FX_REGISTER_TOKEN("6")
FX_REGISTER_TOKEN("7")
FX_REGISTER_TOKEN("8")
FX_REGISTER_TOKEN("9")
FX_REGISTER_TOKEN("10")
FX_REGISTER_TOKEN("11")
FX_REGISTER_TOKEN("12")
FX_REGISTER_TOKEN("13")
FX_REGISTER_TOKEN("14")
FX_REGISTER_TOKEN("15")
FX_REGISTER_TOKEN("16")
FX_REGISTER_TOKEN("17")
FX_REGISTER_TOKEN("18")
FX_REGISTER_TOKEN("19")
FX_REGISTER_TOKEN("20")
FX_REGISTER_TOKEN("21")
FX_REGISTER_TOKEN("22")
FX_REGISTER_TOKEN("23")
FX_REGISTER_TOKEN("24")

FX_REGISTER_TOKEN("ORBIS")
FX_REGISTER_TOKEN("DURANGO")
FX_REGISTER_TOKEN("PCDX11")
FX_REGISTER_TOKEN("GL4")
FX_REGISTER_TOKEN("GLES3")
FX_REGISTER_TOKEN("METAL")
FX_REGISTER_TOKEN("OSXMETAL")
FX_REGISTER_TOKEN("IOSMETAL")

FX_REGISTER_TOKEN("STANDARDSGLOBAL")

FX_REGISTER_TOKEN("GLES3_0")

FX_REGISTER_TOKEN("Load")
FX_REGISTER_TOKEN("Sample")
FX_REGISTER_TOKEN("Gather")
FX_REGISTER_TOKEN("GatherRed")
FX_REGISTER_TOKEN("GatherGreen")
FX_REGISTER_TOKEN("GatherBlue")
FX_REGISTER_TOKEN("GatherAlpha")

function getTokenString(token: number, params: Record<number, string>) {
  if (token < EToken.eT_max) {
    return String(keyTokens[token])
  }
  if (token in params) {
    return params[token]
  }
  return `UNKNOWN_TOKEN_${token}`
}
