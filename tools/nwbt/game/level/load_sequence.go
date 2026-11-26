package level

import (
	"nw-buddy/tools/rtti/nwt"
	"strings"
)

// SequenceLightValues are the light values a track view sequence leaves behind at its end, nil where it has no track
type SequenceLightValues struct {
	// Sequence is the name of the last sequence that set a value
	Sequence          string
	DiffuseMultiplier *float32
	Visible           *bool
}

// Apply sets the values on a light configuration
func (v SequenceLightValues) Apply(config *nwt.LightConfiguration) {
	if v.DiffuseMultiplier != nil {
		config.DiffuseMultiplier = nwt.AzFloat32(*v.DiffuseMultiplier)
	}
	if v.Visible != nil {
		config.Visible = nwt.AzBool(*v.Visible)
	}
}

// IsSequence reports whether the sequence of a component has one of the names, case insensitive
func IsSequence(component nwt.SequenceComponent, names []string) bool {
	name := string(component.Sequence.Element.Name)
	for _, it := range names {
		if strings.EqualFold(it, name) {
			return true
		}
	}
	return false
}

// ReadSequenceLightValues adds the end values of the light tracks of a sequence to values, by entity id: the last key
// of the `DiffuseMultiplier` and `Visible` tracks of the component nodes below an entity node. Tracks without keys
// do not animate and are skipped. Later calls override earlier ones.
func ReadSequenceLightValues(sequence nwt.CAnimSequence, values map[uint64]SequenceLightValues) {
	entities := map[int32]uint64{}
	var components []nwt.CAnimComponentNode
	for _, ptr := range sequence.Nodes.Element {
		switch node := ptr.Element.(type) {
		case nwt.CAnimAzEntityNode:
			entities[int32(node.BaseClass1.ID)] = uint64(node.Entity.Id)
		case nwt.CAnimComponentNode:
			components = append(components, node)
		}
	}
	for _, component := range components {
		entity, ok := entities[int32(component.BaseClass1.Parent)]
		if !ok {
			continue
		}
		state := values[entity]
		for _, ptr := range component.BaseClass1.Tracks.Element {
			switch track := ptr.Element.(type) {
			case nwt.TAnimSplineTrack_Vec2__:
				if track.ParamType.Name != "DiffuseMultiplier" {
					continue
				}
				// spline keys store (time, value)
				keys := track.Spline.BaseClass1.BaseClass1.Keys.Element
				if len(keys) == 0 {
					continue
				}
				last := keys[0].BaseClass1
				for _, key := range keys {
					if key.BaseClass1.Time >= last.Time {
						last = key.BaseClass1
					}
				}
				value := float32(last.Value.Y)
				state.DiffuseMultiplier = &value
				state.Sequence = string(sequence.Name)
			case nwt.CBoolTrack:
				if track.BaseClass1.ParamType.Name != "Visible" {
					continue
				}
				keys := track.BaseClass1.Keys.Element
				if len(keys) == 0 {
					continue
				}
				last := keys[0]
				for _, key := range keys {
					if key.BaseClass1.Time >= last.BaseClass1.Time {
						last = key
					}
				}
				value := bool(last.Value)
				state.Visible = &value
				state.Sequence = string(sequence.Name)
			}
		}
		values[entity] = state
	}
}
