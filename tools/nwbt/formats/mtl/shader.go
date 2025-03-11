package mtl

import "strings"

const (
	shaderGeometryFog        = "geometryfog"
	shaderGeometryBeam       = "geometrybeam"
	shaderGeometryBeamSimple = "geometrybeamsimple"
	shaderMeshParticle       = "meshparticle"
	shaderNoDraw             = "nodraw"
)

func (e *Material) CanBeSkipped() bool {
	return e.IsNoDraw() || e.IsFog() || e.IsBeam() || e.IsParticle()
}

func (e *Material) IsNoDraw() bool {
	return strings.EqualFold(e.Shader, shaderNoDraw)
}

func (e *Material) IsBeam() bool {
	return strings.EqualFold(e.Shader, shaderGeometryBeam) || strings.EqualFold(e.Shader, shaderGeometryBeamSimple)
}

func (e *Material) IsFog() bool {
	return strings.EqualFold(e.Shader, shaderGeometryFog)
}

func (e *Material) IsParticle() bool {
	return strings.EqualFold(e.Shader, shaderMeshParticle)
}
