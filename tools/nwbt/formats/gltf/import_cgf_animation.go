package gltf

import (
	"log/slog"
	"nw-buddy/tools/formats/cgf"
	"nw-buddy/tools/formats/gltf/importer"
	"nw-buddy/tools/utils/math"
	"slices"

	"github.com/qmuntal/gltf"
	"github.com/qmuntal/gltf/modeler"
)

func (c *Document) ImportCgfAnimation(asset importer.Animation, load func(asset importer.Animation) *cgf.File) {
	file := load(asset)
	if file == nil {
		return
	}

	controllers := cgf.SelectChunks[cgf.ChunkController](file)
	params, _ := cgf.SelectChunk[cgf.ChunkMotionParams](file)

	animation := &gltf.Animation{
		Name: asset.Name,
	}

	defer func() {
		if len(animation.Channels) > 0 {
			c.Document.Animations = append(c.Document.Animations, animation)
		} else {
			slog.Warn("animation not imported, no channels in", "file", file.Source)
		}
	}()

	for _, controller := range controllers {
		_, nodeIndex := c.FindNodeByControllerId(controller.ControllerId)
		if nodeIndex == -1 {
			node, _ := c.NewNode()
			node.Extras = ExtrasStore(nil, ExtraKeyControllerID, controller.ControllerId)
			c.AddToScene(c.DefaultScene(), node)
			nodeIndex = c.NodeIndex(node)
		}

		if len(controller.RotationKeys) > 0 {
			rotTimeKeys := slices.Clone(controller.RotationTimeKeys)
			if params.TicksPerFrame != 0 && params.SecsPerTick != 0 {
				for i := range rotTimeKeys {
					rotTimeKeys[i] = rotTimeKeys[i] * params.SecsPerTick / float32(params.TicksPerFrame)
				}
			}
			rotTimeAccessor := modeler.WriteAccessor(c.Document, gltf.TargetNone, rotTimeKeys)

			rotKeys := slices.Clone(controller.RotationKeys)
			for i := range rotKeys {
				rotKeys[i] = math.CryToGltfQuat(rotKeys[i])
			}
			rotAccessor := modeler.WriteAccessor(c.Document, gltf.TargetNone, rotKeys)
			rotSampler := &gltf.AnimationSampler{
				Input:         rotTimeAccessor,
				Output:        rotAccessor,
				Interpolation: gltf.InterpolationLinear,
			}
			rotSamplerIndex := len(animation.Samplers)
			animation.Samplers = append(animation.Samplers, rotSampler)
			animation.Channels = append(animation.Channels, &gltf.AnimationChannel{
				Extras:  ExtrasStore(nil, ExtraKeyControllerID, controller.ControllerId),
				Sampler: rotSamplerIndex,
				Target: gltf.AnimationChannelTarget{
					Path: gltf.TRSRotation,
					Node: gltf.Index(nodeIndex),
				},
			})
		}

		if len(controller.PositionKeys) > 0 {
			posTimeKeys := slices.Clone(controller.PositionTimeKeys)
			if params.TicksPerFrame != 0 && params.SecsPerTick != 0 {
				for i := range posTimeKeys {
					posTimeKeys[i] = posTimeKeys[i] * params.SecsPerTick / float32(params.TicksPerFrame)
				}
			}
			posTimeAccessor := modeler.WriteAccessor(c.Document, gltf.TargetNone, posTimeKeys)

			posKeys := slices.Clone(controller.PositionKeys)
			for i := range posKeys {
				posKeys[i] = math.CryToGltfVec3(posKeys[i])
			}
			posAccessor := modeler.WriteAccessor(c.Document, gltf.TargetNone, posKeys)
			posSampler := &gltf.AnimationSampler{
				Input:         posTimeAccessor,
				Output:        posAccessor,
				Interpolation: gltf.InterpolationLinear,
			}
			posSamplerIndex := len(animation.Samplers)
			animation.Samplers = append(animation.Samplers, posSampler)
			animation.Channels = append(animation.Channels, &gltf.AnimationChannel{
				Extras:  ExtrasStore(nil, ExtraKeyControllerID, controller.ControllerId),
				Sampler: posSamplerIndex,
				Target: gltf.AnimationChannelTarget{
					Path: gltf.TRSTranslation,
					Node: gltf.Index(nodeIndex),
				},
			})
		}
	}
}
