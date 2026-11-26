package gltf

import (
	"log/slog"
	"nw-buddy/tools/formats/cgf"
	"nw-buddy/tools/formats/gltf/importer"
	"slices"

	"github.com/qmuntal/gltf"
	"github.com/qmuntal/gltf/modeler"
)

func (doc *Document) ImportAssetAnimations(asset importer.AnimationAsset) {
	file := doc.Options.LoadAnimation(asset)
	if file == nil {
		return
	}

	base := doc.Options.Base
	controllers := cgf.SelectChunks[cgf.ChunkController](file)
	params, _ := cgf.SelectChunk[cgf.ChunkMotionParams](file)

	animation := &gltf.Animation{
		Name:   asset.Name,
		Extras: ExtrasStore(nil, ExtraKeyClip, clipExtras(params)),
	}

	defer func() {
		if len(animation.Channels) > 0 {
			doc.Document.Animations = append(doc.Document.Animations, animation)
		} else {
			slog.Warn("animation not imported, no channels in", "file", file.Source)
		}
	}()

	for _, controller := range controllers {
		_, nodeIndex := doc.FindNodeByControllerId(controller.ControllerId)
		if nodeIndex == -1 {
			node, _ := doc.NewNode()
			node.Extras = ExtrasStore(nil, ExtraKeyControllerID, controller.ControllerId)
			doc.AddToScene(doc.DefaultScene(), node)
			nodeIndex = doc.NodeIndex(node)
		}

		if len(controller.RotationKeys) > 0 {
			rotTimeKeys := framesToSeconds(controller.RotationTimeKeys, params)
			rotTimeAccessor := modeler.WriteAccessor(doc.Document, gltf.TargetNone, rotTimeKeys)

			rotKeys := slices.Clone(controller.RotationKeys)
			for i := range rotKeys {
				rotKeys[i] = base.Quat(rotKeys[i])
			}
			rotAccessor := modeler.WriteAccessor(doc.Document, gltf.TargetNone, rotKeys)
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
			posTimeKeys := framesToSeconds(controller.PositionTimeKeys, params)
			posTimeAccessor := modeler.WriteAccessor(doc.Document, gltf.TargetNone, posTimeKeys)

			posKeys := slices.Clone(controller.PositionKeys)
			for i := range posKeys {
				posKeys[i] = base.Vec3(posKeys[i])
			}
			posAccessor := modeler.WriteAccessor(doc.Document, gltf.TargetNone, posKeys)
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

// ClipExtras describes the played range of a clip, stored in the extras of a glTF animation under ExtraKeyClip.
// The key frames are exported as they are: additive clips keep their reference frame (frame 0) before StartTime.
type ClipExtras struct {
	// first played time in seconds, additive clips start one frame after their reference frame
	StartTime float32 `json:"startTime"`
	// last played time in seconds
	EndTime float32 `json:"endTime"`
	// key frames per second
	SampleRate float32 `json:"sampleRate"`
	// the clip is additive: rotations compose onto the default pose, translations add to it
	Additive bool `json:"additive,omitempty"`
	// the clip was authored as a cycle
	Cycle bool `json:"cycle,omitempty"`
}

func clipExtras(params cgf.ChunkMotionParams) ClipExtras {
	rate := params.SampleRate()
	return ClipExtras{
		StartTime:  float32(params.StartFrame()-params.Start) / rate,
		EndTime:    float32(params.EndFrame()-params.Start) / rate,
		SampleRate: rate,
		Additive:   params.IsAdditive(),
		Cycle:      params.IsCycle(),
	}
}

// framesToSeconds converts controller key times (frames) to seconds relative to the clip's start frame,
// as Lumberyard samples a CAF at rate * (start + t * (end - start))
func framesToSeconds(frames []float32, params cgf.ChunkMotionParams) []float32 {
	rate := params.SampleRate()
	start := float32(params.Start)
	result := slices.Clone(frames)
	for i := range result {
		result[i] = (result[i] - start) / rate
	}
	return result
}
