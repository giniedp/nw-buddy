export interface Timeline {
  __type: string
  layers: Array<TimelineLayer>
  editormetadata: EditorMetadata
}
export function isTimeline(obj: any): obj is Timeline {
  return obj?.['__type'] === 'Timeline'
}

export interface EditorMetadata {
  __type: string
  horizontalzoomscale: number
  timeoffset: number
  selected: boolean
  isexpanded: boolean
  entityid: EntityId
  groupname: string
  locked: boolean
}
export function isEditorMetadata(obj: any): obj is EditorMetadata {
  return obj?.['__type'] === 'EditorMetadata'
}

export interface TimelineLayer {
  __type: string
  id: string
  name: string
  namecrc: Crc32
  clips: Array<Transform | TriggerEntity | ActivateEntity | DeactivateEntity | ShowMesh | MaterialOverride | AnimationClip | SoundEffect | CommandClip | HideMesh | ParticleEffect | UnTriggerEntity | InputCancelClip | CameraProperties | CameraShake | TimelineStart | PostEffectGroup | TimelinePause | $$019ef5eb_cae9_4163_8dbf_5ac00ad00046 | d159813f_9b6b_430d_b7e0_89b20322501c>
  ignore: boolean
  editormetdata: EditorMetadata
}
export function isTimelineLayer(obj: any): obj is TimelineLayer {
  return obj?.['__type'] === 'TimelineLayer'
}

export interface Crc32 {
  __type: string
  value: number
}
export function isCrc32(obj: any): obj is Crc32 {
  return obj?.['__type'] === 'Crc32'
}

export interface Transform {
  __type: string
  baseclass1: TimelineClip
  transformmode: number
  '0xfebbfda9': number
  rewindonfinish: boolean
  snaptoterrain: boolean
  translationcurve: Curve
  rotationcurve: Curve
  scalecurve: Curve
  '0xc5137d79': number
  '0x3a1a8472': number
}
export function isTransform(obj: any): obj is Transform {
  return obj?.['__type'] === 'Transform'
}

export interface TimelineClip {
  __type: string
  starttime: number
  endtime: number
  editormetdata: EditorMetadata
  '0x7a895442': string
}
export function isTimelineClip(obj: any): obj is TimelineClip {
  return obj?.['__type'] === 'TimelineClip'
}

export interface Curve {
  __type: string
  axes: Array<CurveAxis>
  editormetdata: Curve__EditorMetadata
}
export function isCurve(obj: any): obj is Curve {
  return obj?.['__type'] === 'Curve'
}

export interface CurveAxis {
  __type: string
  name: string
  keyframes: Array<Keyframe>
  editormetdata: CurveAxis__EditorMetadata
}
export function isCurveAxis(obj: any): obj is CurveAxis {
  return obj?.['__type'] === 'CurveAxis'
}

export interface CurveAxis__EditorMetadata {
  __type: string
  isvisible: boolean
  islocked: boolean
}
export function isCurveAxis__EditorMetadata(obj: any): obj is CurveAxis__EditorMetadata {
  return obj?.['__type'] === 'CurveAxis::EditorMetadata'
}

export interface Keyframe {
  __type: string
  incomingtype: number
  time: number
  value: number | string
  incominghandlex: number
  incominghandley: number
  outgoinghandlex: number
  outgoinghandley: number
  editormetadata: Keyframe__EditorMetadata
}
export function isKeyframe(obj: any): obj is Keyframe {
  return obj?.['__type'] === 'Keyframe'
}

export interface Keyframe__EditorMetadata {
  __type: string
  selected: boolean
  bezieredittype: number
}
export function isKeyframe__EditorMetadata(obj: any): obj is Keyframe__EditorMetadata {
  return obj?.['__type'] === 'Keyframe::EditorMetadata'
}

export interface Curve__EditorMetadata {
  __type: string
  editrangemin: number
  editrange: number
  showineditor: boolean
  isvisible: boolean
  propertyname: string
  humanname: string
}
export function isCurve__EditorMetadata(obj: any): obj is Curve__EditorMetadata {
  return obj?.['__type'] === 'Curve::EditorMetadata'
}

export interface EntityId {
  __type: string
  id: number
}
export function isEntityId(obj: any): obj is EntityId {
  return obj?.['__type'] === 'EntityId'
}

export interface TriggerEntity {
  __type: string
  baseclass1: TimelineClip
  applytoallchildren: boolean
}
export function isTriggerEntity(obj: any): obj is TriggerEntity {
  return obj?.['__type'] === 'TriggerEntity'
}

export interface ActivateEntity {
  __type: string
  baseclass1: TimelineClip
  applytoallchildren: boolean
}
export function isActivateEntity(obj: any): obj is ActivateEntity {
  return obj?.['__type'] === 'ActivateEntity'
}

export interface DeactivateEntity {
  __type: string
  baseclass1: TimelineClip
  applytoallchildren: boolean
}
export function isDeactivateEntity(obj: any): obj is DeactivateEntity {
  return obj?.['__type'] === 'DeactivateEntity'
}

export interface ShowMesh {
  __type: string
  baseclass1: TimelineClip
  applytochildren: boolean
}
export function isShowMesh(obj: any): obj is ShowMesh {
  return obj?.['__type'] === 'ShowMesh'
}

export interface MaterialOverride {
  __type: string
  baseclass1: TimelineClip
  overridename: string
  removeonend: boolean
  applytochildren: boolean
  applytoovercoat: boolean
  usenewoverridesystem: boolean
  m_materialparamscurves: $$344f38ea_4d1d_5d55_83c1_5f6060c0a09d
  m_runtimematerialshaderparamcurves: $$344f38ea_4d1d_5d55_83c1_5f6060c0a09d
  m_runtimemateriallightingparamscurves: $$344f38ea_4d1d_5d55_83c1_5f6060c0a09d
  m_runtimematerialshadercurvenames: d65e4f21_2dc2_5ff9_b67e_8a79eb8a0082
  m_runtimemateriallightingcurvename: d65e4f21_2dc2_5ff9_b67e_8a79eb8a0082
}
export function isMaterialOverride(obj: any): obj is MaterialOverride {
  return obj?.['__type'] === 'MaterialOverride'
}

export interface $$344f38ea_4d1d_5d55_83c1_5f6060c0a09d {
  __type: string
  element: bd7e940e_6d84_5185_87c3_99d6c8db63e0
}
export function is$$344f38ea_4d1d_5d55_83c1_5f6060c0a09d(obj: any): obj is $$344f38ea_4d1d_5d55_83c1_5f6060c0a09d {
  return obj?.['__type'] === '344f38ea-4d1d-5d55-83c1-5f6060c0a09d'
}

export interface d65e4f21_2dc2_5ff9_b67e_8a79eb8a0082 {
  __type: string
  element: Array<string>
}
export function isd65e4f21_2dc2_5ff9_b67e_8a79eb8a0082(obj: any): obj is d65e4f21_2dc2_5ff9_b67e_8a79eb8a0082 {
  return obj?.['__type'] === 'd65e4f21-2dc2-5ff9-b67e-8a79eb8a0082'
}

export interface AnimationClip {
  __type: string
  baseclass1: TimelineClip
  animationalias: string
  loop: boolean
  stoponend: boolean
  playbackspeed: number
  animationstarttime: number
  blendintime: number
  blendouttime: number
  layer: number
  weight: number
  runonserver: boolean
  hidemeshuntilanimated: boolean
}
export function isAnimationClip(obj: any): obj is AnimationClip {
  return obj?.['__type'] === 'AnimationClip'
}

export interface SoundEffect {
  __type: string
  baseclass1: TimelineClip
  audiotriggeronbegin: string
  stopbegintriggeronend: boolean
  audiotriggeronend: string
  obstructiontype: number
  attachmentjoint: string
}
export function isSoundEffect(obj: any): obj is SoundEffect {
  return obj?.['__type'] === 'SoundEffect'
}

export interface CommandClip {
  __type: string
  baseclass1: TimelineClip
  executestringcommand_clientcvar: string
  executestringcommand: string
}
export function isCommandClip(obj: any): obj is CommandClip {
  return obj?.['__type'] === 'CommandClip'
}

export interface HideMesh {
  __type: string
  baseclass1: TimelineClip
  applytochildren: boolean
}
export function isHideMesh(obj: any): obj is HideMesh {
  return obj?.['__type'] === 'HideMesh'
}

export interface ParticleEffect {
  __type: string
  baseclass1: TimelineClip
  effectname: string
  positionoffset: Array<number>
  angularoffset: Array<number>
  ignorerotation: boolean
  emitterfollows: boolean
  stopemittingonfinish: boolean
  killemitteronfinish: boolean
  pulseperiod: number
  scale: number
}
export function isParticleEffect(obj: any): obj is ParticleEffect {
  return obj?.['__type'] === 'ParticleEffect'
}

export interface UnTriggerEntity {
  __type: string
  baseclass1: TimelineClip
  applytoallchildren: boolean
}
export function isUnTriggerEntity(obj: any): obj is UnTriggerEntity {
  return obj?.['__type'] === 'UnTriggerEntity'
}

export interface InputCancelClip {
  __type: string
  baseclass1: TimelineClip
}
export function isInputCancelClip(obj: any): obj is InputCancelClip {
  return obj?.['__type'] === 'InputCancelClip'
}

export interface CameraProperties {
  __type: string
  baseclass1: TimelineClip
  fieldofviewcurve: Curve
  fieldofviewstumheightcurve: Curve
  frustumwidthcurve: Curve
  nearclipcurve: Curve
  farclipcurve: Curve
  depthoffieldenable: Curve
  depthoffieldfocusdistancecurve: Curve
  depthoffieldfocusrangecurve: Curve
  depthoffieldbluramountcurve: Curve
  colorcorrectioncyancurve: Curve
  colorcorrectionmagentacurve: Curve
  colorcorrectionyellowcurve: Curve
  colorcorrectionluminencecurve: Curve
  colorcorrectionbrightnesscurve: Curve
  colorcorrectioncontrastcurve: Curve
  colorcorrectionsaturationcurve: Curve
  colorcorrectionhuecurve: Curve
}
export function isCameraProperties(obj: any): obj is CameraProperties {
  return obj?.['__type'] === 'CameraProperties'
}

export interface bd7e940e_6d84_5185_87c3_99d6c8db63e0 {
  __type: string
  element: Curve
}
export function isbd7e940e_6d84_5185_87c3_99d6c8db63e0(obj: any): obj is bd7e940e_6d84_5185_87c3_99d6c8db63e0 {
  return obj?.['__type'] === 'bd7e940e-6d84-5185-87c3-99d6c8db63e0'
}

export interface CameraShake {
  __type: string
  baseclass1: TimelineClip
  shakename: string
  shakeepicenterrange: number
  shakerange: number
}
export function isCameraShake(obj: any): obj is CameraShake {
  return obj?.['__type'] === 'CameraShake'
}

export interface TimelineStart {
  __type: string
  baseclass1: TimelineClip
  timelinename: string
  playfrombeginning: boolean
}
export function isTimelineStart(obj: any): obj is TimelineStart {
  return obj?.['__type'] === 'TimelineStart'
}

export interface PostEffectGroup {
  __type: string
  baseclass1: TimelineClip
  groupname: string
}
export function isPostEffectGroup(obj: any): obj is PostEffectGroup {
  return obj?.['__type'] === 'PostEffectGroup'
}

export interface TimelinePause {
  __type: string
  baseclass1: TimelineClip
  timelinename: string
  pause: boolean
}
export function isTimelinePause(obj: any): obj is TimelinePause {
  return obj?.['__type'] === 'TimelinePause'
}

export interface $$019ef5eb_cae9_4163_8dbf_5ac00ad00046 {
  __type: string
  baseclass1: TimelineClip
  eventname: string
  '0x572b7347': string
  attachmentjoint: string
  '0xe65bf9a0': boolean
  '0x86d04f1c': number
  '0x18c6117e': string
  '0x81cf40c4': string
  '0xf6c87052': string
}
export function is$$019ef5eb_cae9_4163_8dbf_5ac00ad00046(obj: any): obj is $$019ef5eb_cae9_4163_8dbf_5ac00ad00046 {
  return obj?.['__type'] === '019ef5eb-cae9-4163-8dbf-5ac00ad00046'
}

export interface d159813f_9b6b_430d_b7e0_89b20322501c {
  __type: string
  baseclass1: TimelineClip
  enabled: Curve
  diffusemultiplier: Curve
  '0x983683ea': Curve
  '0x3ca0f5c0': Curve
  '0xe818cde1': Curve
  '0x11c13f14': Curve
  '0xf76ceaa7': Curve
  '0x586544b9': Curve
}
export function isd159813f_9b6b_430d_b7e0_89b20322501c(obj: any): obj is d159813f_9b6b_430d_b7e0_89b20322501c {
  return obj?.['__type'] === 'd159813f-9b6b-430d-b7e0-89b20322501c'
}
