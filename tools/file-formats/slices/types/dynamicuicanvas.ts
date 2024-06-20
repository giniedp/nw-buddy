export interface AZ__Entity {
  __type: string
  id: EntityId
  name: string
  isdependencyready: boolean
  isruntimeactive: boolean
  components: Array<SliceComponent | UiCanvasComponent | AzFramework__ScriptComponent | UiTransform2dComponent | UiElementComponent | UiFaderComponent | UiTextComponent | UiLayoutCellComponent | UiImageComponent | UiJavelinCanvasComponent | UiSpawnerComponent | UiLayoutFitterComponent | UiButtonComponent | UiDesaturatorComponent | UiFlipbookAnimationComponent | UiImageSequenceComponent | UiLayoutRowComponent | UiMaskComponent | UiLayoutGridComponent | UiScrollBarComponent | UiDropdownComponent | UiLayoutColumnComponent | UiScrollBoxComponent | UiScrollBarMouseWheelComponent | UiDynamicScrollBoxComponent | UiSliderComponent | UiTextInputComponent | UiRadioButtonComponent | UiDropTargetComponent | UiRadioButtonGroupComponent | UiDraggableComponent | UiCheckboxComponent | SequenceAgentComponent | UiLayoutRowFixedComponent | UiDynamicLayoutComponent | UiLayoutColumnFixedComponent | UiProgressBarComponent | UiExitHoverEventComponent | UiMarkerComponent | SimpleMarkerComponent | UiDamageNumberAnchorComponent | UiImageRepeaterComponent | UnifiedInteractOptionComponent | UnifiedInteractOptionsComponent | UiSelectionComponent | RepairDetailsComponent | ApplyResourceDetailsComponent | UiRequiredResourceDetailsComponent | UiTelemetryComponent | UiMarkupButtonComponent | UiTextInputAutoCompleteComponent | UiDamageNumberComponent | UiReticlesComponent>
}
export function isAZ__Entity(obj: any): obj is AZ__Entity {
  return obj?.['__type'] === 'AZ::Entity'
}

export interface EntityId {
  __type: string
  id: number
}
export function isEntityId(obj: any): obj is EntityId {
  return obj?.['__type'] === 'EntityId'
}

export interface SliceComponent {
  __type: string
  baseclass1: AZ__Component
  entities: Array<AZ__Entity>
  prefabs: []
  isdynamic: boolean
  dependencyreloadmode: number
  dataflagsfornewentities: DataFlagsPerEntity
}
export function isSliceComponent(obj: any): obj is SliceComponent {
  return obj?.['__type'] === 'SliceComponent'
}

export interface AZ__Component {
  __type: string
  id: number
}
export function isAZ__Component(obj: any): obj is AZ__Component {
  return obj?.['__type'] === 'AZ::Component'
}

export interface UiCanvasComponent {
  __type: string
  baseclass1: AZ__Component
  uniqueid: number
  rootelement: EntityId
  lastelement: number
  canvassize: Array<number>
  issnapenabled: boolean
  draworder: number
  ispixelaligned: boolean
  rendertotexture: boolean
  rendertargetname: string
  enabletransformupdateoptimize: boolean
  optimizeforfrequentupdates: boolean
  isposinputsupported: boolean
  isnavigationsupported: boolean
  isalwaysallowinghover: boolean
  ignorescrollhover: boolean
  disableenterhandling: boolean
  firsthoverelement: EntityId
  animsystem: UiAnimationSystem
  animationdata: AnimationData
  tooltipdisplayelement: EntityId
  snapdistance: number
  snaprotationdegrees: number
  horizontalguides: Array<number>
  verticalguides: Array<number>
  guidecolor: Color
  guideslocked: boolean
  textureatlases: Array<AzFramework__SimpleAssetReference_TextureAtlasNamespace__TextureAtlasAsset_>
}
export function isUiCanvasComponent(obj: any): obj is UiCanvasComponent {
  return obj?.['__type'] === 'UiCanvasComponent'
}

export interface UiAnimationSystem {
  __type: string
  sequences: Array<e60fcb60_f631_5f86_a9cb_66ff429f3c0a>
}
export function isUiAnimationSystem(obj: any): obj is UiAnimationSystem {
  return obj?.['__type'] === 'UiAnimationSystem'
}

export interface AnimationData {
  __type: string
  serializestring: string
}
export function isAnimationData(obj: any): obj is AnimationData {
  return obj?.['__type'] === 'AnimationData'
}

export interface Color {
  __type: string
  __value: Array<number>
}
export function isColor(obj: any): obj is Color {
  return obj?.['__type'] === 'Color'
}

export interface AzFramework__ScriptComponent {
  __type: string
  baseclass1: AZ__Component
  baseclass2: NetBindable
  contextid: number
  properties: ScriptPropertyGroup
  name: string
  id: string
  script: Asset
  isrunonserver: boolean
  isrunonclient: boolean
}
export function isAzFramework__ScriptComponent(obj: any): obj is AzFramework__ScriptComponent {
  return obj?.['__type'] === 'AzFramework::ScriptComponent'
}

export interface NetBindable {
  __type: string
  m_isnetsyncenabled: boolean
}
export function isNetBindable(obj: any): obj is NetBindable {
  return obj?.['__type'] === 'NetBindable'
}

export interface ScriptPropertyGroup {
  __type: string
  name: string
  properties: Array<AzFramework__ScriptPropertyGenericClass | AzFramework__ScriptPropertyString | AzFramework__ScriptPropertyBoolean | AzFramework__ScriptPropertyNumber | AZ__ScriptPropertyGenericClassArray | AzFramework__ScriptPropertyStringArray>
  groups: Array<ScriptPropertyGroup>
}
export function isScriptPropertyGroup(obj: any): obj is ScriptPropertyGroup {
  return obj?.['__type'] === 'ScriptPropertyGroup'
}

export interface Asset {
  __type: string
  guid: string
  subId: string
  type: string
  hint: string
}
export function isAsset(obj: any): obj is Asset {
  return obj?.['__type'] === 'Asset'
}

export interface UiTransform2dComponent {
  __type: string
  baseclass1: AZ__Component
  anchors: Anchors
  offsets: Offsets
  pivot: Array<number>
  rotation: number
  scale: Array<number>
  scaletodevice: boolean
  computetransformwhenhidden: boolean
}
export function isUiTransform2dComponent(obj: any): obj is UiTransform2dComponent {
  return obj?.['__type'] === 'UiTransform2dComponent'
}

export interface Anchors {
  __type: string
  left: number
  top: number
  right: number
  bottom: number
}
export function isAnchors(obj: any): obj is Anchors {
  return obj?.['__type'] === 'Anchors'
}

export interface Offsets {
  __type: string
  left: number
  top: number
  right: number
  bottom: number
}
export function isOffsets(obj: any): obj is Offsets {
  return obj?.['__type'] === 'Offsets'
}

export interface UiElementComponent {
  __type: string
  baseclass1: AZ__Component
  id: number
  isenabled: boolean
  isvisibleineditor: boolean
  isselectableineditor: boolean
  isselectedineditor: boolean
  isexpandedineditor: boolean
  childentityidorder: Array<ChildEntityIdOrderEntry>
  ischildrenrendersortable: boolean
  renderpriority: number
  multithreadchildren: boolean
}
export function isUiElementComponent(obj: any): obj is UiElementComponent {
  return obj?.['__type'] === 'UiElementComponent'
}

export interface DataFlagsPerEntity {
  __type: string
  entitytodataflags: []
}
export function isDataFlagsPerEntity(obj: any): obj is DataFlagsPerEntity {
  return obj?.['__type'] === 'DataFlagsPerEntity'
}

export interface ChildEntityIdOrderEntry {
  __type: string
  childentityid: EntityId
  sortindex: number
}
export function isChildEntityIdOrderEntry(obj: any): obj is ChildEntityIdOrderEntry {
  return obj?.['__type'] === 'ChildEntityIdOrderEntry'
}

export interface AzFramework__ScriptPropertyGenericClass {
  __type: string
  baseclass1: AzFramework__ScriptProperty
  value: DynamicSerializableField
}
export function isAzFramework__ScriptPropertyGenericClass(obj: any): obj is AzFramework__ScriptPropertyGenericClass {
  return obj?.['__type'] === 'AzFramework::ScriptPropertyGenericClass'
}

export interface AzFramework__ScriptProperty {
  __type: string
  id: number
  name: string
}
export function isAzFramework__ScriptProperty(obj: any): obj is AzFramework__ScriptProperty {
  return obj?.['__type'] === 'AzFramework::ScriptProperty'
}

export interface DynamicSerializableField {
  __type: string
  typeid: string
  m_data: EntityId | Array<number> | Color
}
export function isDynamicSerializableField(obj: any): obj is DynamicSerializableField {
  return obj?.['__type'] === 'DynamicSerializableField'
}

export interface UiFaderComponent {
  __type: string
  baseclass1: AZ__Component
  fade: number
  userendertotexture: boolean
}
export function isUiFaderComponent(obj: any): obj is UiFaderComponent {
  return obj?.['__type'] === 'UiFaderComponent'
}

export interface UiTextComponent {
  __type: string
  baseclass1: AZ__Component
  text: string
  markupenabled: boolean
  imagesenabled: boolean
  color: Color
  alpha: number
  fontfilename: AzFramework__SimpleAssetReference_LyShine__FontAsset_
  fontsize: number
  effectindex: number
  texthalignment: number
  textvalignment: number
  characterspacing: number
  linespacing: number
  overflowmode: number
  wraptextsetting: number
  shrinktofit: number
  minshrinkscale: number
  caseoverride: number
}
export function isUiTextComponent(obj: any): obj is UiTextComponent {
  return obj?.['__type'] === 'UiTextComponent'
}

export interface AzFramework__SimpleAssetReference_LyShine__FontAsset_ {
  __type: string
  baseclass1: SimpleAssetReferenceBase
}
export function isAzFramework__SimpleAssetReference_LyShine__FontAsset_(obj: any): obj is AzFramework__SimpleAssetReference_LyShine__FontAsset_ {
  return obj?.['__type'] === 'AzFramework::SimpleAssetReference<LyShine::FontAsset>'
}

export interface SimpleAssetReferenceBase {
  __type: string
  assetpath: string
}
export function isSimpleAssetReferenceBase(obj: any): obj is SimpleAssetReferenceBase {
  return obj?.['__type'] === 'SimpleAssetReferenceBase'
}

export interface UiLayoutCellComponent {
  __type: string
  baseclass1: AZ__Component
  minwidthoverridden: boolean
  minwidth: number
  minheightoverridden: boolean
  minheight: number
  targetwidthoverridden: boolean
  targetwidth: number
  targetheightoverridden: boolean
  targetheight: number
  extrawidthratiooverridden: boolean
  extrawidthratio: number
  extraheightratiooverridden: boolean
  extraheightratio: number
}
export function isUiLayoutCellComponent(obj: any): obj is UiLayoutCellComponent {
  return obj?.['__type'] === 'UiLayoutCellComponent'
}

export interface UiImageComponent {
  __type: string
  baseclass1: AZ__Component
  spritetype: number
  spritetexture: Asset
  index: number
  rendertargetname: string
  isrendertargetsrgb: boolean
  color: Color
  alpha: number
  imagetype: number
  fillcenter: boolean
  stretchsliced: boolean
  blendmode: number
  filltype: number
  fillamount: number
  fillstartangle: number
  fillcornerorigin: number
  filledgeorigin: number
  fillclockwise: boolean
}
export function isUiImageComponent(obj: any): obj is UiImageComponent {
  return obj?.['__type'] === 'UiImageComponent'
}

export interface UiJavelinCanvasComponent {
  __type: string
  baseclass1: AZ__Component
  requiresmouse: boolean
  escapable: boolean
  replaceable: boolean
  actionmapoverrides: Array<string>
  drawlayer: string
}
export function isUiJavelinCanvasComponent(obj: any): obj is UiJavelinCanvasComponent {
  return obj?.['__type'] === 'UiJavelinCanvasComponent'
}

export interface UiSpawnerComponent {
  __type: string
  baseclass1: AZ__Component
  slice: Asset
  spawnonactivate: boolean
}
export function isUiSpawnerComponent(obj: any): obj is UiSpawnerComponent {
  return obj?.['__type'] === 'UiSpawnerComponent'
}

export interface UiLayoutFitterComponent {
  __type: string
  baseclass1: AZ__Component
  horizontalfit: boolean
  verticalfit: boolean
}
export function isUiLayoutFitterComponent(obj: any): obj is UiLayoutFitterComponent {
  return obj?.['__type'] === 'UiLayoutFitterComponent'
}

export interface UiButtonComponent {
  __type: string
  baseclass1: UiInteractableComponent
  actionname: string
  actionnameright: string
  actionnamepressedright: string
  useclickbehavior: boolean
  clicksqtolerance: number
  sethoveronpress: EntityId
}
export function isUiButtonComponent(obj: any): obj is UiButtonComponent {
  return obj?.['__type'] === 'UiButtonComponent'
}

export interface UiInteractableComponent {
  __type: string
  baseclass1: AZ__Component
  ishandlingevents: boolean
  hoverstateactions: Array<UiInteractableStateAlpha | UiInteractableStateSprite | UiInteractableStateColor>
  pressedstateactions: Array<UiInteractableStateColor | UiInteractableStateSprite | UiInteractableStateAlpha>
  disabledstateactions: Array<UiInteractableStateSprite | UiInteractableStateAlpha>
  navigationsettings: UiNavigationSettings
  isautoactivationenabled: boolean
  hoverstartactionname: string
  hoverendactionname: string
  pressedactionname: string
  releasedactionname: string
  '0x24695ca7': boolean
  '0x6cb356e8': boolean
  '0x059b1386': boolean
  '0x896ee5a2': number
  '0x785a3bff': boolean
  '0xdf2b1889': number
}
export function isUiInteractableComponent(obj: any): obj is UiInteractableComponent {
  return obj?.['__type'] === 'UiInteractableComponent'
}

export interface UiNavigationSettings {
  __type: string
  navigationmode: number
  onupentity: EntityId
  ondownentity: EntityId
  onleftentity: EntityId
  onrightentity: EntityId
}
export function isUiNavigationSettings(obj: any): obj is UiNavigationSettings {
  return obj?.['__type'] === 'UiNavigationSettings'
}

export interface AzFramework__ScriptPropertyString {
  __type: string
  baseclass1: AzFramework__ScriptProperty
  value: string
}
export function isAzFramework__ScriptPropertyString(obj: any): obj is AzFramework__ScriptPropertyString {
  return obj?.['__type'] === 'AzFramework::ScriptPropertyString'
}

export interface AzFramework__ScriptPropertyBoolean {
  __type: string
  baseclass1: AzFramework__ScriptProperty
  value: boolean
}
export function isAzFramework__ScriptPropertyBoolean(obj: any): obj is AzFramework__ScriptPropertyBoolean {
  return obj?.['__type'] === 'AzFramework::ScriptPropertyBoolean'
}

export interface AzFramework__ScriptPropertyNumber {
  __type: string
  baseclass1: AzFramework__ScriptProperty
  value: number
}
export function isAzFramework__ScriptPropertyNumber(obj: any): obj is AzFramework__ScriptPropertyNumber {
  return obj?.['__type'] === 'AzFramework::ScriptPropertyNumber'
}

export interface UiDesaturatorComponent {
  __type: string
  baseclass1: AZ__Component
  saturation: number
}
export function isUiDesaturatorComponent(obj: any): obj is UiDesaturatorComponent {
  return obj?.['__type'] === 'UiDesaturatorComponent'
}

export interface UiFlipbookAnimationComponent {
  __type: string
  baseclass1: AZ__Component
  'start frame': number
  'end frame': number
  'loop start frame': number
  'loop type': number
  'framerate unit': number
  framerate: number
  'start delay': number
  'loop delay': number
  'reverse delay': number
  'auto play': boolean
}
export function isUiFlipbookAnimationComponent(obj: any): obj is UiFlipbookAnimationComponent {
  return obj?.['__type'] === 'UiFlipbookAnimationComponent'
}

export interface UiImageSequenceComponent {
  __type: string
  baseclass1: AZ__Component
  imagetype: number
  imagelist: Array<Asset>
  imagesequencedirectory: string
  index: number
  color: Color
  alpha: number
  blendmode: number
}
export function isUiImageSequenceComponent(obj: any): obj is UiImageSequenceComponent {
  return obj?.['__type'] === 'UiImageSequenceComponent'
}

export interface UiLayoutRowComponent {
  __type: string
  baseclass1: AZ__Component
  padding: Padding
  spacing: number
  order: number
  childhalignment: number
  childvalignment: number
  ignoredefaultlayoutcells: boolean
}
export function isUiLayoutRowComponent(obj: any): obj is UiLayoutRowComponent {
  return obj?.['__type'] === 'UiLayoutRowComponent'
}

export interface Padding {
  __type: string
  left: number
  top: number
  right: number
  bottom: number
}
export function isPadding(obj: any): obj is Padding {
  return obj?.['__type'] === 'Padding'
}

export interface AZ__ScriptPropertyGenericClassArray {
  __type: string
  baseclass1: AzFramework__ScriptProperty
  values: Array<DynamicSerializableField>
  elementtype: string
}
export function isAZ__ScriptPropertyGenericClassArray(obj: any): obj is AZ__ScriptPropertyGenericClassArray {
  return obj?.['__type'] === 'AZ::ScriptPropertyGenericClassArray'
}

export interface UiMaskComponent {
  __type: string
  baseclass1: AZ__Component
  enablemasking: boolean
  maskinteraction: boolean
  childmaskelement: EntityId
  userendertotexture: boolean
  drawbehind: boolean
  drawinfront: boolean
  usealphatest: boolean
}
export function isUiMaskComponent(obj: any): obj is UiMaskComponent {
  return obj?.['__type'] === 'UiMaskComponent'
}

export interface UiLayoutGridComponent {
  __type: string
  baseclass1: AZ__Component
  padding: Padding
  spacing: Array<number>
  cellsize: Array<number>
  horizontalorder: number
  verticalorder: number
  startingwith: number
  childhalignment: number
  childvalignment: number
  layoutvisibleonly: boolean
}
export function isUiLayoutGridComponent(obj: any): obj is UiLayoutGridComponent {
  return obj?.['__type'] === 'UiLayoutGridComponent'
}

export interface UiScrollBarComponent {
  __type: string
  baseclass1: UiInteractableComponent
  handleentity: EntityId
  orientation: number
  value: number
  handlesize: number
  minhandlepixelsize: number
  valuechangingactionname: string
  valuechangedactionname: string
}
export function isUiScrollBarComponent(obj: any): obj is UiScrollBarComponent {
  return obj?.['__type'] === 'UiScrollBarComponent'
}

export interface UiDropdownComponent {
  __type: string
  baseclass1: UiInteractableComponent
  content: EntityId
  expandedparent: EntityId
  textelement: EntityId
  iconelement: EntityId
  expandonhover: boolean
  waittime: number
  collapseonoutsideclick: boolean
  expandedstateactions: []
  expandedactionname: string
  collapsedactionname: string
  optionselectedactionname: string
}
export function isUiDropdownComponent(obj: any): obj is UiDropdownComponent {
  return obj?.['__type'] === 'UiDropdownComponent'
}

export interface UiLayoutColumnComponent {
  __type: string
  baseclass1: AZ__Component
  padding: Padding
  spacing: number
  order: number
  childhalignment: number
  childvalignment: number
  ignoredefaultlayoutcells: boolean
}
export function isUiLayoutColumnComponent(obj: any): obj is UiLayoutColumnComponent {
  return obj?.['__type'] === 'UiLayoutColumnComponent'
}

export interface UiScrollBoxComponent {
  __type: string
  baseclass1: UiInteractableComponent
  contententity: EntityId
  scrolloffset: Array<number>
  constrainscrolling: boolean
  enableeasing: boolean
  allowdragging: boolean
  snapmode: number
  snapgrid: Array<number>
  allowhorizsrolling: boolean
  hscrollbarentity: EntityId
  hscrollbarvisibility: number
  allowvertscrolling: boolean
  vscrollbarentity: EntityId
  vscrollbarvisibility: number
  scrolloffsetchangingactionname: string
  scrolloffsetchangedactionname: string
}
export function isUiScrollBoxComponent(obj: any): obj is UiScrollBoxComponent {
  return obj?.['__type'] === 'UiScrollBoxComponent'
}

export interface UiScrollBarMouseWheelComponent {
  __type: string
  baseclass1: AZ__Component
  wheelstepvalue: number
  scrollbarentity: EntityId
}
export function isUiScrollBarMouseWheelComponent(obj: any): obj is UiScrollBarMouseWheelComponent {
  return obj?.['__type'] === 'UiScrollBarMouseWheelComponent'
}

export interface UiDynamicScrollBoxComponent {
  __type: string
  baseclass1: AZ__Component
  autorefreshonpostactivate: boolean
  prototypeelement: EntityId
  variableelementsize: boolean
  autocalcelementsize: boolean
  estimatedelementsize: number
  defaultnumelements: number
  hassections: boolean
  headerprototypeelement: EntityId
  stickyheaders: boolean
  variableheadersize: boolean
  autocalcheadersize: boolean
  estimatedheadersize: number
  defaultnumsections: number
}
export function isUiDynamicScrollBoxComponent(obj: any): obj is UiDynamicScrollBoxComponent {
  return obj?.['__type'] === 'UiDynamicScrollBoxComponent'
}

export interface UiSliderComponent {
  __type: string
  baseclass1: UiInteractableComponent
  trackentity: EntityId
  fillentity: EntityId
  manipulatorentity: EntityId
  value: number
  minvalue: number
  maxvalue: number
  stepvalue: number
  valuechangingactionname: string
  valuechangedactionname: string
}
export function isUiSliderComponent(obj: any): obj is UiSliderComponent {
  return obj?.['__type'] === 'UiSliderComponent'
}

export interface UiTextInputComponent {
  __type: string
  baseclass1: UiInteractableComponent
  text: EntityId
  placeholdertext: EntityId
  textselectioncolor: Color
  textcursorcolor: Color
  maxstringlength: number
  cursorblinkinterval: number
  ispasswordfield: boolean
  replacementcharacter: number
  clipinputtext: boolean
  changeaction: string
  starteditaction: string
  doubleclickinterval: number
  endeditaction: string
  enteraction: string
}
export function isUiTextInputComponent(obj: any): obj is UiTextInputComponent {
  return obj?.['__type'] === 'UiTextInputComponent'
}

export interface UiInteractableStateAlpha {
  __type: string
  targetentity: EntityId
  alpha: number
}
export function isUiInteractableStateAlpha(obj: any): obj is UiInteractableStateAlpha {
  return obj?.['__type'] === 'UiInteractableStateAlpha'
}

export interface UiRadioButtonComponent {
  __type: string
  baseclass1: UiInteractableComponent
  optionalcheckedentity: EntityId
  optionaluncheckedentity: EntityId
  group: EntityId
  ischecked: boolean
  changedactionname: string
  turnonactionname: string
  turnoffactionname: string
}
export function isUiRadioButtonComponent(obj: any): obj is UiRadioButtonComponent {
  return obj?.['__type'] === 'UiRadioButtonComponent'
}

export interface UiDropTargetComponent {
  __type: string
  baseclass1: AZ__Component
  dropvalidstateactions: Array<UiInteractableStateColor>
  dropinvalidstateactions: Array<UiInteractableStateColor>
  navigationsettings: UiNavigationSettings
  ondropactionname: string
}
export function isUiDropTargetComponent(obj: any): obj is UiDropTargetComponent {
  return obj?.['__type'] === 'UiDropTargetComponent'
}

export interface UiRadioButtonGroupComponent {
  __type: string
  baseclass1: AZ__Component
  allowrestoreunchecked: boolean
  changedactionname: string
}
export function isUiRadioButtonGroupComponent(obj: any): obj is UiRadioButtonGroupComponent {
  return obj?.['__type'] === 'UiRadioButtonGroupComponent'
}

export interface UiDraggableComponent {
  __type: string
  baseclass1: UiInteractableComponent
  dragnormalstateactions: []
  dragvalidstateactions: []
  draginvalidstateactions: []
}
export function isUiDraggableComponent(obj: any): obj is UiDraggableComponent {
  return obj?.['__type'] === 'UiDraggableComponent'
}

export interface UiInteractableStateColor {
  __type: string
  targetentity: EntityId
  color: Color
}
export function isUiInteractableStateColor(obj: any): obj is UiInteractableStateColor {
  return obj?.['__type'] === 'UiInteractableStateColor'
}

export interface UiCheckboxComponent {
  __type: string
  baseclass1: UiInteractableComponent
  optionalcheckedentity: EntityId
  optionaluncheckedentity: EntityId
  ischecked: boolean
  changedactionname: string
  turnonactionname: string
  turnoffactionname: string
}
export function isUiCheckboxComponent(obj: any): obj is UiCheckboxComponent {
  return obj?.['__type'] === 'UiCheckboxComponent'
}

export interface AzFramework__SimpleAssetReference_TextureAtlasNamespace__TextureAtlasAsset_ {
  __type: string
  baseclass1: SimpleAssetReferenceBase
}
export function isAzFramework__SimpleAssetReference_TextureAtlasNamespace__TextureAtlasAsset_(obj: any): obj is AzFramework__SimpleAssetReference_TextureAtlasNamespace__TextureAtlasAsset_ {
  return obj?.['__type'] === 'AzFramework::SimpleAssetReference<TextureAtlasNamespace::TextureAtlasAsset>'
}

export interface SequenceAgentComponent {
  __type: string
  baseclass1: AZ__Component
  sequencecomponententityids: []
}
export function isSequenceAgentComponent(obj: any): obj is SequenceAgentComponent {
  return obj?.['__type'] === 'SequenceAgentComponent'
}

export interface UiInteractableStateSprite {
  __type: string
  targetentity: EntityId
  sprite: Asset
  index: number
}
export function isUiInteractableStateSprite(obj: any): obj is UiInteractableStateSprite {
  return obj?.['__type'] === 'UiInteractableStateSprite'
}

export interface UiLayoutRowFixedComponent {
  __type: string
  baseclass1: AZ__Component
  spacing: number
  order: number
  childhalignment: number
  childvalignment: number
  layoutvisibleonly: boolean
}
export function isUiLayoutRowFixedComponent(obj: any): obj is UiLayoutRowFixedComponent {
  return obj?.['__type'] === 'UiLayoutRowFixedComponent'
}

export interface UiDynamicLayoutComponent {
  __type: string
  baseclass1: AZ__Component
  numchildelements: number
}
export function isUiDynamicLayoutComponent(obj: any): obj is UiDynamicLayoutComponent {
  return obj?.['__type'] === 'UiDynamicLayoutComponent'
}

export interface UiLayoutColumnFixedComponent {
  __type: string
  baseclass1: AZ__Component
  spacing: number
  order: number
  childhalignment: number
  childvalignment: number
  layoutvisibleonly: boolean
}
export function isUiLayoutColumnFixedComponent(obj: any): obj is UiLayoutColumnFixedComponent {
  return obj?.['__type'] === 'UiLayoutColumnFixedComponent'
}

export interface e60fcb60_f631_5f86_a9cb_66ff429f3c0a {
  __type: string
  element: CUiAnimSequence
}
export function ise60fcb60_f631_5f86_a9cb_66ff429f3c0a(obj: any): obj is e60fcb60_f631_5f86_a9cb_66ff429f3c0a {
  return obj?.['__type'] === 'e60fcb60-f631-5f86-a9cb-66ff429f3c0a'
}

export interface CUiAnimSequence {
  __type: string
  name: string
  flags: number
  timerange: Range
  id: number
  nodes: Array<fc373751_3e99_5791_b583_0635bdc4a193>
}
export function isCUiAnimSequence(obj: any): obj is CUiAnimSequence {
  return obj?.['__type'] === 'CUiAnimSequence'
}

export interface Range {
  __type: string
  start: number
  end: number
}
export function isRange(obj: any): obj is Range {
  return obj?.['__type'] === 'Range'
}

export interface UiProgressBarComponent {
  __type: string
  baseclass1: AZ__Component
  progress: number
  vertical: boolean
  progressbarentity: EntityId
}
export function isUiProgressBarComponent(obj: any): obj is UiProgressBarComponent {
  return obj?.['__type'] === 'UiProgressBarComponent'
}

export interface AzFramework__ScriptPropertyStringArray {
  __type: string
  baseclass1: AzFramework__ScriptProperty
  values: Array<string>
}
export function isAzFramework__ScriptPropertyStringArray(obj: any): obj is AzFramework__ScriptPropertyStringArray {
  return obj?.['__type'] === 'AzFramework::ScriptPropertyStringArray'
}

export interface UiExitHoverEventComponent {
  __type: string
  baseclass1: AZ__Component
  eventname: string
  delay: number
}
export function isUiExitHoverEventComponent(obj: any): obj is UiExitHoverEventComponent {
  return obj?.['__type'] === 'UiExitHoverEventComponent'
}

export interface UiMarkerComponent {
  __type: string
  baseclass1: AZ__Component
  accessabilitybiggerscale: number
  offscreenarrowentity: EntityId
}
export function isUiMarkerComponent(obj: any): obj is UiMarkerComponent {
  return obj?.['__type'] === 'UiMarkerComponent'
}

export interface SimpleMarkerComponent {
  __type: string
  baseclass1: AZ__Component
  foregroundimage: EntityId
  waricon: string
  '0x51a217cf': Array<Color>
  '0x1f419df3': Array<string>
  '0xc1b6adb4': Array<string>
  groupmateicon: string
  guildmateicon: string
  neutralicon: string
  deathsdoorgroupmateicon: string
  deathsdoorguildmateicon: string
  deathsdoorwaricon: string
  deathsdoorneutralicon: string
  warfriendlyicon: string
  deathsdoorwarfriendlyicon: string
}
export function isSimpleMarkerComponent(obj: any): obj is SimpleMarkerComponent {
  return obj?.['__type'] === 'SimpleMarkerComponent'
}

export interface UiDamageNumberAnchorComponent {
  __type: string
  baseclass1: AZ__Component
}
export function isUiDamageNumberAnchorComponent(obj: any): obj is UiDamageNumberAnchorComponent {
  return obj?.['__type'] === 'UiDamageNumberAnchorComponent'
}

export interface UiImageRepeaterComponent {
  __type: string
  baseclass1: AZ__Component
  spritepath: AzFramework__SimpleAssetReference_LmbrCentral__TextureAsset_
  blendmode: number
  color: Color
  numrepeats: number
  padding: number
  padbefore: boolean
  imagewidth: number
  imageheight: number
}
export function isUiImageRepeaterComponent(obj: any): obj is UiImageRepeaterComponent {
  return obj?.['__type'] === 'UiImageRepeaterComponent'
}

export interface AzFramework__SimpleAssetReference_LmbrCentral__TextureAsset_ {
  __type: string
  baseclass1: SimpleAssetReferenceBase
}
export function isAzFramework__SimpleAssetReference_LmbrCentral__TextureAsset_(obj: any): obj is AzFramework__SimpleAssetReference_LmbrCentral__TextureAsset_ {
  return obj?.['__type'] === 'AzFramework::SimpleAssetReference<LmbrCentral::TextureAsset>'
}

export interface UnifiedInteractOptionComponent {
  __type: string
  baseclass1: AZ__Component
  'name text entity': EntityId
  'icon press button entity': EntityId
  'icon hold button entity': EntityId
  'icon press secondary button entity': EntityId
  'icon hold secondary button entity': EntityId
  'hold progress bar entity': EntityId
  'bg entity': EntityId
  'additional info root entity': EntityId
  'button entity id': EntityId
  'hint text entity id': EntityId
  'hover text entity id': EntityId
}
export function isUnifiedInteractOptionComponent(obj: any): obj is UnifiedInteractOptionComponent {
  return obj?.['__type'] === 'UnifiedInteractOptionComponent'
}

export interface UnifiedInteractOptionsComponent {
  __type: string
  baseclass1: AZ__Component
  'icon bg entity': EntityId
  'icon invalid interact entity': EntityId
  'icon can interact interact entity': EntityId
  'icon interact option entity': EntityId
  'num options to display': number
}
export function isUnifiedInteractOptionsComponent(obj: any): obj is UnifiedInteractOptionsComponent {
  return obj?.['__type'] === 'UnifiedInteractOptionsComponent'
}

export interface UiSelectionComponent {
  __type: string
  baseclass1: AZ__Component
  'ui selection root entity id': EntityId
  'is clickable menu options': boolean
}
export function isUiSelectionComponent(obj: any): obj is UiSelectionComponent {
  return obj?.['__type'] === 'UiSelectionComponent'
}

export interface RepairDetailsComponent {
  __type: string
  baseclass1: AZ__Component
  'need parts label entity': EntityId
  'ingredient container entity': EntityId
}
export function isRepairDetailsComponent(obj: any): obj is RepairDetailsComponent {
  return obj?.['__type'] === 'RepairDetailsComponent'
}

export interface ApplyResourceDetailsComponent {
  __type: string
  baseclass1: AZ__Component
  'required resources': Array<EntityId>
  'background image': EntityId
  layout: EntityId
  cache: EntityId
}
export function isApplyResourceDetailsComponent(obj: any): obj is ApplyResourceDetailsComponent {
  return obj?.['__type'] === 'ApplyResourceDetailsComponent'
}

export interface UiRequiredResourceDetailsComponent {
  __type: string
  baseclass1: AZ__Component
  'item name text entity': EntityId
  'inventory amount text entity': EntityId
  'amount to add text entity': EntityId
  'amount added text entity': EntityId
  'current progress bar entity': EntityId
  'future progress bar entity': EntityId
  'icon item entity': EntityId
  'icon arrow entity': EntityId
}
export function isUiRequiredResourceDetailsComponent(obj: any): obj is UiRequiredResourceDetailsComponent {
  return obj?.['__type'] === 'UiRequiredResourceDetailsComponent'
}

export interface UiTelemetryComponent {
  __type: string
  baseclass1: AZ__Component
  telemetryeventname: string
  eventtypetranslationlist: Array<UiTelemetryEventTypePair>
}
export function isUiTelemetryComponent(obj: any): obj is UiTelemetryComponent {
  return obj?.['__type'] === 'UiTelemetryComponent'
}

export interface UiTelemetryEventTypePair {
  __type: string
  interactableevent: string
  eventtype: string
}
export function isUiTelemetryEventTypePair(obj: any): obj is UiTelemetryEventTypePair {
  return obj?.['__type'] === 'UiTelemetryEventTypePair'
}

export interface fc373751_3e99_5791_b583_0635bdc4a193 {
  __type: string
  element: CUiAnimAzEntityNode
}
export function isfc373751_3e99_5791_b583_0635bdc4a193(obj: any): obj is fc373751_3e99_5791_b583_0635bdc4a193 {
  return obj?.['__type'] === 'fc373751-3e99-5791-b583-0635bdc4a193'
}

export interface CUiAnimAzEntityNode {
  __type: string
  baseclass1: CUiAnimNode
  entity: EntityId
}
export function isCUiAnimAzEntityNode(obj: any): obj is CUiAnimAzEntityNode {
  return obj?.['__type'] === 'CUiAnimAzEntityNode'
}

export interface CUiAnimNode {
  __type: string
  id: number
  parent: number
  name: string
  flags: number
  tracks: Array<b1fe9a95_c664_5dd7_a687_25a033e669da>
}
export function isCUiAnimNode(obj: any): obj is CUiAnimNode {
  return obj?.['__type'] === 'CUiAnimNode'
}

export interface b1fe9a95_c664_5dd7_a687_25a033e669da {
  __type: string
  element: TUiAnimSplineTrack_Vec2__
}
export function isb1fe9a95_c664_5dd7_a687_25a033e669da(obj: any): obj is b1fe9a95_c664_5dd7_a687_25a033e669da {
  return obj?.['__type'] === 'b1fe9a95-c664-5dd7-a687-25a033e669da'
}

export interface TUiAnimSplineTrack_Vec2__ {
  __type: string
  flags: number
  defaultvalue: Vec2
  paramtype: CUiAnimParamType
  paramdata: UiAnimParamData
  spline: UiSpline__TrackSplineInterpolator_Vec2_
}
export function isTUiAnimSplineTrack_Vec2__(obj: any): obj is TUiAnimSplineTrack_Vec2__ {
  return obj?.['__type'] === 'TUiAnimSplineTrack<Vec2 >'
}

export interface Vec2 {
  __type: string
  x: number
  y: number
}
export function isVec2(obj: any): obj is Vec2 {
  return obj?.['__type'] === 'Vec2'
}

export interface CUiAnimParamType {
  __type: string
  type: number
}
export function isCUiAnimParamType(obj: any): obj is CUiAnimParamType {
  return obj?.['__type'] === 'CUiAnimParamType'
}

export interface UiAnimParamData {
  __type: string
  componentid: number
  typeid: string
  name: string
}
export function isUiAnimParamData(obj: any): obj is UiAnimParamData {
  return obj?.['__type'] === 'UiAnimParamData'
}

export interface UiSpline__TrackSplineInterpolator_Vec2_ {
  __type: string
  baseclass1: BezierSplineVec2
}
export function isUiSpline__TrackSplineInterpolator_Vec2_(obj: any): obj is UiSpline__TrackSplineInterpolator_Vec2_ {
  return obj?.['__type'] === 'UiSpline::TrackSplineInterpolator<Vec2>'
}

export interface BezierSplineVec2 {
  __type: string
  baseclass1: TSplineBezierBasisVec2
}
export function isBezierSplineVec2(obj: any): obj is BezierSplineVec2 {
  return obj?.['__type'] === 'BezierSplineVec2'
}

export interface TSplineBezierBasisVec2 {
  __type: string
  keys: Array<UiSpline__SplineKeyEx_Vec2_>
}
export function isTSplineBezierBasisVec2(obj: any): obj is TSplineBezierBasisVec2 {
  return obj?.['__type'] === 'TSplineBezierBasisVec2'
}

export interface UiSpline__SplineKeyEx_Vec2_ {
  __type: string
  baseclass1: UiSpline__SplineKey_Vec2_
}
export function isUiSpline__SplineKeyEx_Vec2_(obj: any): obj is UiSpline__SplineKeyEx_Vec2_ {
  return obj?.['__type'] === 'UiSpline::SplineKeyEx<Vec2>'
}

export interface UiSpline__SplineKey_Vec2_ {
  __type: string
  time: number
  flags: number
  value: Vec2
  ds: Vec2
  dd: Vec2
}
export function isUiSpline__SplineKey_Vec2_(obj: any): obj is UiSpline__SplineKey_Vec2_ {
  return obj?.['__type'] === 'UiSpline::SplineKey<Vec2>'
}

export interface UiMarkupButtonComponent {
  __type: string
  baseclass1: UiInteractableComponent
  linkcolor: Color
  linkhovercolor: Color
  alwayscheckhover: boolean
}
export function isUiMarkupButtonComponent(obj: any): obj is UiMarkupButtonComponent {
  return obj?.['__type'] === 'UiMarkupButtonComponent'
}

export interface UiTextInputAutoCompleteComponent {
  __type: string
  baseclass1: AZ__Component
}
export function isUiTextInputAutoCompleteComponent(obj: any): obj is UiTextInputAutoCompleteComponent {
  return obj?.['__type'] === 'UiTextInputAutoCompleteComponent'
}

export interface UiDamageNumberComponent {
  __type: string
  baseclass1: AZ__Component
  maxnumber: number
  maxxpelements: number
  'clone entity': EntityId
  'clone entity new': EntityId
  'xp clone entity': EntityId
  m_entityidstatuseffect: EntityId
  m_generictextentityid: EntityId
}
export function isUiDamageNumberComponent(obj: any): obj is UiDamageNumberComponent {
  return obj?.['__type'] === 'UiDamageNumberComponent'
}

export interface UiReticlesComponent {
  __type: string
  baseclass1: AZ__Component
}
export function isUiReticlesComponent(obj: any): obj is UiReticlesComponent {
  return obj?.['__type'] === 'UiReticlesComponent'
}
