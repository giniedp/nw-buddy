import { COMMON_WGSL } from './common.wgsl'

/**
 * The ground grid of the previews and levels: anti aliased lines of a constant screen width on a flat quad, after
 * Ben Golus' "The Best Darn Grid Shader (Yet)" (PristineGrid, https://bgolus.medium.com/the-best-darn-grid-shader-yet-727f9278b9d8).
 * Minor lines every meter, major lines every ten, the X and Y axes in red and green. The instance color tints the
 * lines (alpha = opacity), the quad fades out with the distance to the camera.
 */
export default /* wgsl */ `

struct InstanceBlock {
  transform: mat4x4f,
  color:     vec4f,
};

// @private
@group(0) @binding(0) var<uniform> global: GlobalBlock;
// @private
@group(0) @binding(1) var<uniform> view: ViewBlock;

@group(0) @binding(2) var<uniform> object: ObjectBlock;
@group(0) @binding(3) var<storage, read> instances: array<InstanceBlock>;

// cell sizes in meters
const MINOR_CELL = 1.0;
const MAJOR_CELL = 10.0;
// line widths in pixels: a gizmo, the lines keep their width at every distance
const MINOR_PIXELS = 1.0;
const MAJOR_PIXELS = 1.5;
const AXIS_PIXELS = 2.0;
// opacity of each kind of line
const MINOR_ALPHA = 0.45;
const MAJOR_ALPHA = 0.8;
const AXIS_ALPHA = 1.0;
// a level of lines fades out while its lines grow from this fraction of a cell to the next: far away the cells get
// smaller than a few pixels and the lines would fill them
const DENSITY_FADE = vec2f(0.15, 0.4);
const AXIS_X_COLOR = vec3f(0.85, 0.2, 0.2);
const AXIS_Y_COLOR = vec3f(0.35, 0.8, 0.3);
// the grid fades out between these distances to the camera, scaled by the camera height above the grid
const FADE_NEAR = 60.0;
const FADE_FAR = 200.0;
// and fades in between these distances in front of the camera: the near plane never cuts it off visibly, e.g. when the
// camera passes through the grid
const CLOSE_FADE = vec2f(0.25, 1.5);

struct VertexInput {
  @builtin(instance_index) id: u32,
  @location(0) position: vec3<f32>,
};

struct FragmentInput {
  @builtin(position) position: vec4<f32>,
  @location(0)       color:    vec4<f32>,
  // grid coordinates in meters, relative to the camera snapped to a major cell: keeps the precision far from the origin
  @location(1)       grid:     vec2<f32>,
  @location(2)       worldPos: vec3<f32>,
};

@vertex
fn vs_main(input: VertexInput) -> FragmentInput {
  let instance = instances[input.id];

  var output: FragmentInput;
  let localPos = instance.transform    * vec4f(input.position, 1.0);
  let worldPos = object.modelMatrix    * localPos;
  let viewPos  = view.viewMatrix       * worldPos;
  output.position = view.projectionMatrix * viewPos;
  output.color    = instance.color;
  output.worldPos = worldPos.xyz;
  output.grid     = worldPos.xy - floor(view.cameraPosition.xy / MAJOR_CELL) * MAJOR_CELL;
  return output;
}

// PristineGrid: coverage of the grid lines at uv (in cells) with line widths in cells, anti aliased with the screen
// space derivatives. Lines thinner than a pixel keep their brightness by their coverage, far away the grid becomes the
// average of lines and gaps instead of moire.
fn pristineGrid(uv: vec2f, lineWidth: vec2f) -> f32 {
  let width = saturate(lineWidth);
  let uvDDXY = vec4f(dpdx(uv), dpdy(uv));
  let uvDeriv = vec2f(length(uvDDXY.xz), length(uvDDXY.yw));
  let invertLine = width > vec2f(0.5);
  let targetWidth = select(width, 1.0 - width, invertLine);
  let drawWidth = clamp(targetWidth, uvDeriv, vec2f(0.5));
  let lineAA = max(uvDeriv, vec2f(0.000001)) * 1.5;
  var gridUV = abs(fract(uv) * 2.0 - 1.0);
  gridUV = select(1.0 - gridUV, gridUV, invertLine);
  var grid2 = smoothstep(drawWidth + lineAA, drawWidth - lineAA, gridUV);
  grid2 *= saturate(targetWidth / drawWidth);
  grid2 = mix(grid2, targetWidth, saturate(uvDeriv * 2.0 - 1.0));
  grid2 = select(grid2, 1.0 - grid2, invertLine);
  return mix(grid2.x, 1.0, grid2.y);
}

// a level of grid lines with a width in pixels: pristineGrid with the width in cells = the pixel footprint of a cell
// (the screen space derivatives) times the pixels. Each family of lines (x = n, y = n) fades out on its own where its
// lines would fill the cells: at a grazing view the lines across the view direction get dense long before the lines
// along it.
fn gridLevel(uv: vec2f, pixels: f32) -> f32 {
  let uvDDXY = vec4f(dpdx(uv), dpdy(uv));
  let uvDeriv = vec2f(length(uvDDXY.xz), length(uvDDXY.yw));
  let targetWidth = min(uvDeriv * pixels, vec2f(0.5));
  let drawWidth = clamp(targetWidth, uvDeriv, vec2f(0.5));
  let lineAA = max(uvDeriv, vec2f(0.000001)) * 1.5;
  let gridUV = 1.0 - abs(fract(uv) * 2.0 - 1.0);
  var grid2 = smoothstep(drawWidth + lineAA, drawWidth - lineAA, gridUV);
  grid2 *= saturate(targetWidth / drawWidth);
  grid2 = mix(grid2, targetWidth, saturate(uvDeriv * 2.0 - 1.0));
  grid2 *= 1.0 - smoothstep(vec2f(DENSITY_FADE.x), vec2f(DENSITY_FADE.y), targetWidth);
  return mix(grid2.x, 1.0, grid2.y);
}

// coverage of a single line at coord = 0, a width in pixels, anti aliased like pristineGrid
fn axisLine(coord: f32, pixels: f32) -> f32 {
  let deriv = max(length(vec2f(dpdx(coord), dpdy(coord))), 0.000001);
  // pristineGrid's half width in its space is the full width in cells: the same here in the units of coord
  let halfWidth = deriv * pixels * 0.5;
  let lineAA = deriv * 0.75;
  return smoothstep(halfWidth + lineAA, halfWidth - lineAA, abs(coord));
}

@fragment
fn fs_main(input: FragmentInput) -> FragmentOutput {
  let minor = gridLevel(input.grid / MINOR_CELL, MINOR_PIXELS) * MINOR_ALPHA;
  let major = gridLevel(input.grid / MAJOR_CELL, MAJOR_PIXELS) * MAJOR_ALPHA;
  let axisX = axisLine(input.worldPos.y, AXIS_PIXELS) * AXIS_ALPHA;
  let axisY = axisLine(input.worldPos.x, AXIS_PIXELS) * AXIS_ALPHA;

  // the lines lie on top of each other: the strongest wins, the axes over the grid
  let lines = max(minor, major);
  var color = input.color.rgb;
  var alpha = lines;
  color = mix(color, AXIS_X_COLOR, axisX);
  alpha = max(alpha, axisX);
  color = mix(color, AXIS_Y_COLOR, axisY * (1.0 - axisX * 0.5));
  alpha = max(alpha, axisY);

  // fade out with the distance, further when the camera is higher above the grid
  let height = abs(view.cameraPosition.z - input.worldPos.z);
  let distance = length(input.worldPos.xy - view.cameraPosition.xy);
  let scale = max(1.0, height / 10.0);
  let close = smoothstep(CLOSE_FADE.x, CLOSE_FADE.y, length(input.worldPos - view.cameraPosition));
  let fade = (1.0 - smoothstep(FADE_NEAR * scale, FADE_FAR * scale, distance)) * close;

  var out: FragmentOutput;
  out.color = vec4f(color, alpha * fade * input.color.a);
  out.depth = linearizeDepthReversedZ(input.position.z, view.near, view.far);
  return out;
}
${COMMON_WGSL}
`
