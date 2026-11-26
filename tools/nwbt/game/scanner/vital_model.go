package scanner

import (
	"fmt"
	"nw-buddy/tools/game"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/rtti/nwt"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/math/mat4"
	"path"
	"regexp"
	"slices"
	"strconv"
	"strings"
)

const (
	vitalModelsDir    = "vitals"
	vitalTablesPrefix = "sharedassets/springboardentitites/datatables/"
	sliceExt          = ".dynamicslice"
	// ends the search in a slice whose entities are each other's parents
	maxEntityDepth = 64
)

// ScannedVitalModel is how a slice shows its vital: the model with its animation database, tags and weapons
type ScannedVitalModel struct {
	// the slice without extension
	Id string `json:"id"`
	// the model file below the models root without extension. Models of the same cdf, mtl and overcoat share it.
	Model string `json:"model"`
	// empty when the meshes below the vitals entity are the model
	Cdf string `json:"cdf"`
	Mtl string `json:"mtl"`
	// the material the game draws the meshes with a second time
	Overcoat string `json:"overcoat"`
	Adb      string `json:"adb"`
	// the default tags of the action list
	Tags []string `json:"tags"`
	// the tags of the drawn weapons
	WeaponTags  []string             `json:"weaponTags"`
	Weapons     []ScannedVitalWeapon `json:"weapons"`
	SpawnAction string               `json:"spawnAction"`
	// damage table
	Table    string   `json:"table"`
	VitalIds []string `json:"vitalIds"`
}

// ScannedVitalWeapon is a weapon in the hand of a spawned vital
type ScannedVitalWeapon struct {
	Item    string `json:"item"`
	OffHand bool   `json:"offHand"`
	// .cdf, empty for claws and fists
	Mesh string `json:"mesh"`
	// id of a ScannedEquipType
	EquipType string `json:"equipType"`
}

// VitalModel is the model of a vitals entity
type VitalModel struct {
	ScannedVitalModel
	// the parts of a model without cdf as text, equal for copies of a slice
	content string
}

// VitalPart is a mesh below a vitals entity
type VitalPart struct {
	Name     string
	Model    string
	Mtl      string
	Overcoat string
	Skinned  bool
	// relative to the vitals entity
	Transform mat4.Data
}

// vitalModel returns the model of a vitals entity, nil without one. It only depends on the slice, it is read once per
// entity.
func (ctx *Scanner) vitalModel(node *game.SliceNode) *VitalModel {
	key := fmt.Sprintf("%s#%d", node.File.Path(), node.Entity.Id.Id)
	if cached, ok := ctx.vitalModels.Load(key); ok {
		return cached.(*VitalModel)
	}
	result := ctx.loadVitalModel(node)
	ctx.vitalModels.Store(key, result)
	return result
}

func (ctx *Scanner) loadVitalModel(node *game.SliceNode) *VitalModel {
	result := &VitalModel{}
	result.Id = vitalModelId(node)
	result.Tags = make([]string, 0)
	result.WeaponTags = make([]string, 0)
	result.Weapons = make([]ScannedVitalWeapon, 0)
	for _, component := range node.Components {
		switch v := component.(type) {
		case nwt.ActionListComponent:
			result.Adb = strings.ToLower(string(v.M_animationDatabase.BaseClass1.AssetPath))
			result.SpawnAction = string(v.M_spawnAction)
			result.Table = vitalTableName(v)
			for _, tag := range v.M_defaultTags.Element {
				result.Tags = utils.AppendUniqNoZero(result.Tags, string(tag))
			}
			slices.Sort(result.Tags)
		case nwt.SkinnedMeshComponent:
			mesh := v.Skinned_Mesh_Render_Node
			if mesh.Visible {
				ctx.useVitalMesh(result, mesh.Skinned_Mesh, mesh.Material_Override_Asset, mesh.Material_Overcoat_Asset)
			}
		case nwt.MeshComponent:
			mesh := v.Static_Mesh_Render_Node
			if mesh.Visible {
				ctx.useVitalMesh(result, mesh.Static_Mesh, mesh.Material_Override_Asset, mesh.Material_Overcoat_Asset)
			}
		}
	}

	if result.Cdf == "" {
		// the materials of a mesh that is not found belong to no model
		result.Mtl = ""
		result.Overcoat = ""
		// parts have no skeleton the database could play on
		result.Adb = ""
		result.content = partsContent(VitalParts(ctx.Assets, node.Slice, node.Entity))
		if result.content == "" {
			return nil
		}
		result.Model = path.Join(vitalModelsDir, result.Id)
		return result
	}

	result.Model = vitalModelFile(result.Cdf, result.Mtl, result.Overcoat)
	paperdoll := game.SlicePaperdoll(node.Slice)
	weapons := ctx.HeldWeapons(paperdoll)
	for _, weapon := range weapons {
		result.Weapons = append(result.Weapons, ScannedVitalWeapon{
			Item:      weapon.Item,
			OffHand:   weapon.OffHand,
			Mesh:      weapon.Mesh,
			EquipType: weapon.EquipType,
		})
	}
	result.WeaponTags = append(result.WeaponTags, game.HeldWeaponTags(paperdoll, weapons)...)
	return result
}

// vitalModelFile is the model file of a cdf: `<cdf>`, with a material override `~<mtl>`, with an overcoat `~~<overcoat>`
func vitalModelFile(cdf string, mtl string, overcoat string) string {
	result := path.Join(vitalModelsDir, cdf)
	if mtl != "" {
		result += "~" + utils.ReplaceExt(path.Base(mtl), "")
	}
	if overcoat != "" {
		result += "~~" + utils.ReplaceExt(path.Base(overcoat), "")
	}
	return result
}

// vitalModelId is the slice of a vitals entity without extension. The second and further vitals entities of a slice
// have their number as suffix.
func vitalModelId(node *game.SliceNode) string {
	result := strings.TrimSuffix(strings.ToLower(node.File.Path()), sliceExt)
	number := slices.IndexFunc(vitalEntities(node.Slice), func(it *nwt.AZ__Entity) bool {
		return it.Id.Id == node.Entity.Id.Id
	})
	if number > 0 {
		result += fmt.Sprintf("-%d", number+1)
	}
	return result
}

func vitalEntities(slice *nwt.SliceComponent) []*nwt.AZ__Entity {
	result := make([]*nwt.AZ__Entity, 0)
	for entity, components := range game.EntitiesOf(slice) {
		for _, component := range components {
			if _, ok := component.(nwt.VitalsComponent); ok {
				result = append(result, entity)
				break
			}
		}
	}
	return result
}

var vitalModelNumber = regexp.MustCompile(`^(.+)-(\d+)$`)

// FindVitalModelEntity returns the slice of a ScannedVitalModel and its vitals entity
func FindVitalModelEntity(assets *game.Assets, id string) (nwfs.File, *nwt.SliceComponent, *nwt.AZ__Entity, error) {
	number := 1
	file, ok := assets.Archive.Lookup(id + sliceExt)
	if match := vitalModelNumber.FindStringSubmatch(id); !ok && match != nil {
		number, _ = strconv.Atoi(match[2])
		file, ok = assets.Archive.Lookup(match[1] + sliceExt)
	}
	if !ok {
		return nil, nil, nil, fmt.Errorf("slice not found: %s", id)
	}
	slice, err := assets.LoadSliceComponent(file)
	if err != nil {
		return nil, nil, nil, err
	}
	if slice == nil {
		return nil, nil, nil, fmt.Errorf("no slice: %s", id)
	}
	entities := vitalEntities(slice)
	if number < 1 || number > len(entities) {
		return nil, nil, nil, fmt.Errorf("vitals entity not found: %s", id)
	}
	return file, slice, entities[number-1], nil
}

// useVitalMesh takes the first model, material and overcoat the meshes of the entity have
func (ctx *Scanner) useVitalMesh(model *VitalModel, mesh nwt.AzAsset, material nwt.AzAsset, overcoat nwt.AzAsset) {
	if model.Cdf == "" {
		if file, err := ctx.LookupFileByAsset(mesh); err == nil && file != nil {
			model.Cdf = strings.ToLower(file.Path())
		}
	}
	if model.Mtl == "" {
		if file, err := ctx.LookupFileByAsset(material); err == nil && file != nil {
			model.Mtl = strings.ToLower(file.Path())
		}
	}
	if model.Overcoat == "" {
		if file, err := ctx.LookupFileByAsset(overcoat); err == nil && file != nil {
			model.Overcoat = strings.ToLower(file.Path())
		}
	}
}

func vitalTableName(actionList nwt.ActionListComponent) string {
	return strings.TrimPrefix(strings.ToLower(string(actionList.M_damageTable.Asset.BaseClass1.AssetPath)), vitalTablesPrefix)
}

// VitalParts returns the visible meshes of the entities below a vitals entity
func VitalParts(assets *game.Assets, slice *nwt.SliceComponent, vital *nwt.AZ__Entity) []VitalPart {
	result := make([]VitalPart, 0)
	origin := mat4.Invert(game.FindEntityTransformMat4(vital))
	for entity, components := range game.EntitiesOf(slice) {
		if !IsEntityBelow(slice, entity, vital) {
			continue
		}
		transform := mat4.Multiply(origin, game.FindEntityTransformMat4(entity))
		add := func(mesh nwt.AzAsset, material nwt.AzAsset, overcoat nwt.AzAsset, skinned bool, transform mat4.Data) {
			file, err := assets.LookupFileByAsset(mesh)
			if err != nil || file == nil {
				return
			}
			part := VitalPart{Name: string(entity.Name), Model: file.Path(), Skinned: skinned, Transform: transform}
			if file, err := assets.LookupFileByAsset(material); err == nil && file != nil {
				part.Mtl = file.Path()
			}
			if file, err := assets.LookupFileByAsset(overcoat); err == nil && file != nil {
				part.Overcoat = file.Path()
			}
			result = append(result, part)
		}
		for _, component := range components {
			switch v := component.(type) {
			case nwt.SkinnedMeshComponent:
				mesh := v.Skinned_Mesh_Render_Node
				if mesh.Visible {
					add(mesh.Skinned_Mesh, mesh.Material_Override_Asset, mesh.Material_Overcoat_Asset, true, transform)
				}
			case nwt.MeshComponent:
				mesh := v.Static_Mesh_Render_Node
				if !game.ShouldIgnoreMeshNode(mesh) {
					add(mesh.Static_Mesh, mesh.Material_Override_Asset, mesh.Material_Overcoat_Asset, false, transform)
				}
			case nwt.InstancedMeshComponent:
				mesh := v.Instanced_Mesh_Render_Node.BaseClass1
				if game.ShouldIgnoreMeshNode(mesh) {
					continue
				}
				for _, instance := range v.Instanced_Mesh_Render_Node.Instance_Transforms.Element {
					world := mat4.Multiply(transform, mat4.FromAzTransform(instance))
					add(mesh.Static_Mesh, mesh.Material_Override_Asset, mesh.Material_Overcoat_Asset, false, world)
				}
			}
		}
	}
	return result
}

// IsEntityBelow reports whether an entity is a transform child of another, directly or further down
func IsEntityBelow(slice *nwt.SliceComponent, entity *nwt.AZ__Entity, ancestor *nwt.AZ__Entity) bool {
	it := entity
	for range maxEntityDepth {
		it = game.FindEntityParent(slice, it)
		if it == nil {
			return false
		}
		if it.Id.Id == ancestor.Id.Id {
			return true
		}
	}
	return false
}

func partsContent(parts []VitalPart) string {
	lines := make([]string, 0, len(parts))
	for _, part := range parts {
		transform := strings.ReplaceAll(fmt.Sprintf("%.1f", part.Transform), "-0.0", "0.0")
		lines = append(lines, strings.ToLower(fmt.Sprintf("%s|%s|%s|%s", part.Model, part.Mtl, part.Overcoat, transform)))
	}
	slices.Sort(lines)
	return strings.Join(lines, "\n")
}
