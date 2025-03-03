package scan

import (
	"fmt"
	"iter"
	"log/slog"
	"nw-buddy/tools/formats/azcs"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/rtti"
	"nw-buddy/tools/rtti/nwt"
	"nw-buddy/tools/utils/crymath"
	"regexp"
	"strings"
)

func LoadObject(file nwfs.File) (any, error) {
	data, err := file.Read()
	if err != nil {
		return nil, fmt.Errorf("can't read file '%s': %w", file.Path(), err)
	}

	doc, err := azcs.Parse(data)
	if err != nil {
		return nil, fmt.Errorf("can't parse file '%s': %w", file.Path(), err)
	}

	if len(doc.Elements) == 0 {
		return nil, fmt.Errorf("no root element in file '%s'", file.Path())
	}
	if len(doc.Elements) > 1 {
		slog.Debug(fmt.Sprintf("multiple root elements in file '%s'", file.Path()))
	}

	node, err := rtti.Load(doc.Elements[0])
	if err != nil {
		return nil, fmt.Errorf("can't load file '%s': %w", file.Path(), err)
	}
	return node, nil
}

func LoadAzEntity(file nwfs.File) (*nwt.AZ__Entity, error) {
	node, err := LoadObject(file)
	if node == nil || err != nil {
		return nil, err
	}
	if v, ok := node.(nwt.AZ__Entity); ok {
		return &v, nil
	}
	return nil, nil
}

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
