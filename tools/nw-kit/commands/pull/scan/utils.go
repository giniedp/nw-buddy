package scan

import (
	"iter"
	"nw-buddy/tools/nw-kit/rtti/nwt"
	"nw-buddy/tools/nw-kit/utils/crymath"
	"regexp"
	"strings"
)

func FindSliceComponent(it *nwt.AZ__Entity) *nwt.SliceComponent {
	if it == nil {
		return nil
	}
	for _, component := range it.Components.Element {
		if v, ok := component.(nwt.SliceComponent); ok {
			return &v
		}
	}
	return nil
}

func EntitiesOf(it *nwt.SliceComponent) iter.Seq2[*nwt.AZ__Entity, []any] {
	return func(yield func(*nwt.AZ__Entity, []any) bool) {
		if it == nil {
			return
		}
		for i := range it.Entities.Element {
			// HINT: explicitly want to access by index to always get the same entity pointer
			entity := &it.Entities.Element[i]
			if !yield(entity, entity.Components.Element) {
				break
			}
		}
	}
}

func FindEntityById(it *nwt.SliceComponent, id nwt.AzUInt64) *nwt.AZ__Entity {
	for entity := range EntitiesOf(it) {
		if entity.Id.Id == id {
			return entity
		}
	}
	return nil
}

func FindTransform(it *nwt.AZ__Entity) crymath.Transform {
	if it == nil {
		return nil
	}
	isZero := func(t nwt.AzTransform) bool {
		for _, f := range t.Data {
			if f != 0 {
				return false
			}
		}
		return true
	}

	for _, component := range it.Components.Element {
		switch v := component.(type) {
		case nwt.GameTransformComponent:
			if !isZero(v.M_worldTM) {
				return crymath.TransformFromAzTransform(v.M_worldTM)
			}
			if !isZero(v.M_localTM) {
				return crymath.TransformFromAzTransform(v.M_localTM)
			}
		case nwt.TransformComponent:
			if !isZero(v.Transform) {
				return crymath.TransformFromAzTransform(v.Transform)
			}
		}
	}
	return nil
}

func FindEncounterType(comp *nwt.SliceComponent) string {
	for entity := range EntitiesOf(comp) {
		name := string(entity.Name)
		if name == "" {
			continue
		}
		if strings.Contains(name, "RandomEncounter") {
			return "random"
		}
		if strings.Contains(name, "Enc_Darkness") {
			return "darkness"
		}
		if strings.Contains(name, "LootGoblin") {
			return "goblin"
		}
	}
	return ""
}

func ParseMapIdFromPath(filePath string) string {
	match := regexp.MustCompile(`coatlicue/(.+)/regions/`).FindStringSubmatch(filePath)
	if len(match) > 1 {
		return match[1]
	}
	return ""
}
