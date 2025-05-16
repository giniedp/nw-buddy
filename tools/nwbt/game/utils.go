package game

import (
	"context"
	"fmt"
	"iter"
	"nw-buddy/tools/formats/azcs"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/rtti"
	"nw-buddy/tools/rtti/nwt"
	"nw-buddy/tools/utils/math/mat4"
	"nw-buddy/tools/utils/math/transform"
	"regexp"
	"strconv"
	"strings"
)

func LoadObjectStream(file nwfs.File) (any, error) {
	data, err := file.Read()
	if err != nil {
		return nil, fmt.Errorf("can't read file '%s': %w", file.Path(), err)
	}

	if strings.HasPrefix(string(data), "<ObjectStream") {
		doc, err := azcs.ParseXml(data)
		if err != nil {
			return nil, fmt.Errorf("can't parse xml file '%s': %w", file.Path(), err)
		}
		node, err := rtti.LoadXml(doc.Elements[0])
		if err != nil {
			return nil, fmt.Errorf("can't load xml file '%s': %w", file.Path(), err)
		}
		return node, nil
	}

	doc, err := azcs.Parse(data)
	if err != nil {
		return nil, fmt.Errorf("can't parse file '%s': %w", file.Path(), err)
	}
	node, err := rtti.Load(doc.Elements[0])
	if err != nil {
		return nil, fmt.Errorf("can't load file '%s': %w", file.Path(), err)
	}
	return node, nil
}

func LoadAzEntity(file nwfs.File) (*nwt.AZ__Entity, error) {
	node, err := LoadObjectStream(file)
	if node == nil || err != nil {
		return nil, err
	}
	if v, ok := node.(nwt.AZ__Entity); ok {
		return &v, nil
	}
	return nil, nil
}

func FindSliceComponent(entity *nwt.AZ__Entity) *nwt.SliceComponent {
	if entity == nil {
		return nil
	}
	for _, component := range entity.Components.Element {
		if v, ok := component.(nwt.SliceComponent); ok {
			return &v
		}
	}
	return nil
}

func EntitiesOf(slice *nwt.SliceComponent) iter.Seq2[*nwt.AZ__Entity, []any] {
	return func(yield func(*nwt.AZ__Entity, []any) bool) {
		if slice == nil {
			return
		}
		for i := range slice.Entities.Element {
			// HINT: explicitly want to access by index to always get the same entity pointer
			entity := &slice.Entities.Element[i]
			if !yield(entity, entity.Components.Element) {
				break
			}
		}
	}
}

func FindEntityById(slice *nwt.SliceComponent, id nwt.AzUInt64) *nwt.AZ__Entity {
	for entity := range EntitiesOf(slice) {
		if entity.Id.Id == id {
			return entity
		}
	}
	return nil
}

func FindEntityParent(slice *nwt.SliceComponent, entity *nwt.AZ__Entity) *nwt.AZ__Entity {
	for _, component := range entity.Components.Element {
		switch v := component.(type) {
		case nwt.GameTransformComponent:
			return FindEntityById(slice, v.M_parentId.Id)
		case nwt.TransformComponent:
			return FindEntityById(slice, v.Parent.Id)
		}
	}
	return nil
}

func HasEntityChildren(slice *nwt.SliceComponent, entity *nwt.AZ__Entity) bool {
	if entity == nil {
		return false
	}
	for _, it := range slice.Entities.Element {
		parent := FindEntityParent(slice, &it)
		if parent == nil {
			continue
		}
		if parent.Id.Id == entity.Id.Id {
			return true
		}
	}
	return false
}

func FindTransform(entity *nwt.AZ__Entity) transform.Node {
	if entity == nil {
		return nil
	}
	for _, component := range entity.Components.Element {
		switch v := component.(type) {
		case nwt.GameTransformComponent:
			return transform.FromAzTransform(v.M_worldTM)
		case nwt.TransformComponent:
			return transform.FromAzTransform(v.Transform)
		}
	}
	return nil
}

func FindTransformMat4(entity *nwt.AZ__Entity) mat4.Data {
	if entity == nil {
		return mat4.Identity()
	}
	for _, component := range entity.Components.Element {
		switch v := component.(type) {
		case nwt.GameTransformComponent:
			return mat4.FromAzTransform(v.M_worldTM)
		case nwt.TransformComponent:
			return mat4.FromAzTransform(v.Transform)
		}
	}
	return mat4.Identity()
}

func FindTransformMat4WithParentId(entity *nwt.AZ__Entity) (mat4.Data, nwt.AzUInt64) {
	if entity == nil {
		return mat4.Identity(), 0
	}
	for _, component := range entity.Components.Element {
		switch v := component.(type) {
		case nwt.GameTransformComponent:
			return mat4.FromAzTransform(v.M_worldTM), v.M_parentId.Id
		case nwt.TransformComponent:
			return mat4.FromAzTransform(v.Transform), v.Parent.Id
		}
	}
	return mat4.Identity(), 0
}

func FindTransformFromRootMat4(entity *nwt.AZ__Entity) mat4.Data {
	tm := FindTransformMat4(entity)
	parent := FindEntityParent(nil, entity)
	if parent != nil {
		tm = mat4.Multiply(FindTransformFromRootMat4(parent), tm)
	}
	return tm
}

func FindAncestorWithPositionInTheWorld(slice *nwt.SliceComponent, entity *nwt.AZ__Entity) *nwt.AZ__Entity {
	if entity == nil {
		return nil
	}
	for _, component := range entity.Components.Element {
		if _, ok := component.(nwt.PositionInTheWorldComponent); ok {
			return entity
		}
	}
	return FindAncestorWithPositionInTheWorld(slice, FindEntityParent(slice, entity))
}

func FindEncounterType(slice *nwt.SliceComponent) string {
	for entity := range EntitiesOf(slice) {
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

var regionRegex = regexp.MustCompile(`r_\+(\d{2})_\+(\d{2})`)

func ParseRegionLocation(regionName string) *[2]int {
	// r_+00_+00
	match := regionRegex.FindStringSubmatch(regionName)
	if len(match) != 3 {
		return nil
	}
	x, _ := strconv.Atoi(match[1])
	y, _ := strconv.Atoi(match[2])
	return &[2]int{x, y}
}

type EntityTreeNode struct {
	Parent     *EntityTreeNode
	Entity     *nwt.AZ__Entity
	Transform  mat4.Data // as it was found in the file
	Transform2 mat4.Data // computed hierarchy transform
	Children   []*EntityTreeNode
	Context    context.Context
}

func EntityTree(slice *nwt.SliceComponent) []*EntityTreeNode {
	roots := make([]*EntityTreeNode, 0)
	lookup := make(map[nwt.AzUInt64]*EntityTreeNode)
	for entity := range EntitiesOf(slice) {
		entityId := entity.Id.Id
		if _, ok := lookup[entity.Id.Id]; !ok {
			lookup[entityId] = &EntityTreeNode{
				Transform: mat4.Identity(),
				Children:  make([]*EntityTreeNode, 0),
				Context:   context.Background(),
			}
		}

		transform, parentId := FindTransformMat4WithParentId(entity)
		if _, ok := lookup[parentId]; !ok {
			lookup[parentId] = &EntityTreeNode{
				Transform: mat4.Identity(),
				Children:  make([]*EntityTreeNode, 0),
				Context:   context.Background(),
			}
		}

		lookup[entityId].Entity = entity
		lookup[entityId].Transform = transform
		lookup[parentId].Children = append(lookup[parentId].Children, lookup[entityId])
		if parent := FindEntityParent(slice, entity); parent == nil {
			roots = append(roots, lookup[entityId])
		} else {
			lookup[entityId].Parent = lookup[parent.Id.Id]
		}
	}

	WalkEntityTree(roots, func(node *EntityTreeNode) {
		if node.Parent != nil {
			node.Transform2 = mat4.Multiply(node.Parent.Transform2, node.Transform)
		} else {
			node.Transform2 = node.Transform
		}
	})
	return roots
}

func WalkEntityTree(tree []*EntityTreeNode, visit func(node *EntityTreeNode)) {
	for _, node := range tree {
		visit(node)
		WalkEntityTree(node.Children, visit)
	}
}
