import { ShaderChunk, ShaderLib } from 'three'
import begin_vertext from '../shader-chunks/begin_vertex.glsl'
import clipmap_vertex from '../shader-chunks/clipmap_vertex.glsl'
import lights_physical_fragment from '../shader-chunks/lights_physical_fragment.glsl'
import uv_pars_vertex from '../shader-chunks/uv_pars_vertex.glsl'
import uv_pars_fragment from '../shader-chunks/uv_pars_fragment.glsl'
import uv_vertex from '../shader-chunks/uv_vertex.glsl'
import project_vertex from '../shader-chunks/project_vertex.glsl'
import defaultnormal_vertex from '../shader-chunks/defaultnormal_vertex.glsl'
import normal_fragment_maps from '../shader-chunks/normal_fragment_maps.glsl'

import * as meshBasic from './meshphysical.glsl'
import * as meshPhysical from './meshphysical.glsl'

export function extendShaderLib() {
  ShaderChunk.begin_vertex = begin_vertext
  ShaderChunk.lights_physical_fragment = lights_physical_fragment
  ShaderChunk.meshphysical_vert = meshPhysical.vertex
  ShaderChunk.meshphysical_frag = meshBasic.fragment
  ShaderChunk.uv_pars_vertex = uv_pars_vertex
  ShaderChunk.uv_pars_fragment = uv_pars_fragment
  ShaderChunk.uv_vertex = uv_vertex
  ShaderChunk.project_vertex = project_vertex
  ShaderChunk.defaultnormal_vertex = defaultnormal_vertex
  ShaderChunk.normal_fragment_maps = normal_fragment_maps

  ShaderChunk['clipmap_vertex'] = clipmap_vertex

  ShaderLib.standard.vertexShader = ShaderChunk.meshphysical_vert
  ShaderLib.standard.fragmentShader = ShaderChunk.meshphysical_frag

  ShaderLib.physical.vertexShader = ShaderChunk.meshphysical_vert
  ShaderLib.physical.fragmentShader = ShaderChunk.meshphysical_frag

  ShaderLib.basic.vertexShader = ShaderChunk.meshbasic_vert
  ShaderLib.basic.fragmentShader = ShaderChunk.meshbasic_frag
}

extendShaderLib()
