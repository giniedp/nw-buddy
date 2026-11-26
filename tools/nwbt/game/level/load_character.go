package level

import (
	"log/slog"
	"nw-buddy/tools/formats/cdf"
	"nw-buddy/tools/formats/cloth"
	"nw-buddy/tools/game"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/rtti/nwt"
	"strings"
)

// characterFallbackViewDistance is the view distance of a character whose slice has no AOI radius. The game gives an
// AI slice an AOI radius of 100 when it has none.
const characterFallbackViewDistance = 100

// LoadViewerCharacter converts a visible skinned mesh into a character component: the .cdf (or a single .skin) with
// its skin and cloth parts in bind pose, and the Mannequin data of the action list that animates it (nil without
// one), and the weapons its paperdoll holds on the .cdf's sockets. The viewer reads the skeleton from the .cdf
// itself. The game shows an actor within the AOI radius of its slice, so that radius is the view distance of the
// character.
func LoadViewerCharacter(
	assets *game.Assets,
	component nwt.SkinnedMeshComponent,
	aoiRadius float32,
	actionList *nwt.ActionListComponent,
	paperdoll *nwt.PaperdollComponent,
	timelines []ViewerTimelineLayer,
) *ViewerCharacterComponent {
	node := component.Skinned_Mesh_Render_Node
	if !node.Visible {
		return nil
	}
	modelFile, err := assets.LookupFileByAsset(node.Skinned_Mesh)
	if err != nil || modelFile == nil {
		return nil
	}
	result := &ViewerCharacterComponent{
		Type:            CharacterComponentName,
		Model:           modelFile.Path(),
		MaxViewDistance: characterViewDistance(aoiRadius),
		Parts:           make([]ViewerCharacterPart, 0),
		Mannequin:       loadViewerMannequin(assets, actionList),
		Timelines:       timelines,
	}
	if file, err := assets.LookupFileByAsset(node.Material_Override_Asset); err == nil && file != nil {
		result.MaterialOverride = file.Path()
	}
	weapons := assets.HeldWeapons(paperdoll)
	if result.Mannequin != nil {
		result.Mannequin.ItemTags = game.HeldWeaponTags(paperdoll, weapons)
	}

	if !strings.HasSuffix(strings.ToLower(modelFile.Path()), ".cdf") {
		result.Parts = append(result.Parts, ViewerCharacterPart{Mesh: modelFile.Path()})
		return result
	}
	doc, err := cdf.Load(modelFile)
	if err != nil || doc == nil {
		slog.Warn("character not loaded", "file", modelFile.Path(), "error", err)
		return nil
	}
	result.Parts = cdfParts(assets, doc)
	if len(result.Parts) == 0 {
		return nil
	}
	result.Weapons = characterWeapons(assets, doc, weapons)
	return result
}

// cdfParts are the skin and cloth attachments of a .cdf
func cdfParts(assets *game.Assets, doc *cdf.Document) []ViewerCharacterPart {
	result := make([]ViewerCharacterPart, 0)
	for _, attachment := range doc.SkinAndClothAttachments() {
		mesh := nwfs.NormalizePath(attachment.Binding)
		isCloth := strings.HasSuffix(mesh, ".cloth")
		if isCloth {
			// the mesh of a cloth is referenced inside its .cloth file
			mesh = clothGeometry(assets, mesh)
		}
		if mesh == "" {
			continue
		}
		result = append(result, ViewerCharacterPart{
			Name:     attachment.AName,
			Mesh:     mesh,
			Material: attachmentMaterial(attachment),
			Cloth:    isCloth,
			Hidden:   attachment.Hidden(),
		})
	}
	return result
}

// loadViewerMannequin is the Mannequin data of an action list, nil without one
func loadViewerMannequin(assets *game.Assets, actionList *nwt.ActionListComponent) *ViewerMannequin {
	if actionList == nil {
		return nil
	}
	result := &ViewerMannequin{
		Database:             nwfs.NormalizePath(string(actionList.M_animationDatabase.BaseClass1.AssetPath)),
		ControllerDefinition: nwfs.NormalizePath(string(actionList.M_controllerDefinition.BaseClass1.AssetPath)),
		SpawnAction:          string(actionList.M_spawnAction),
		Grid:                 assetPath(assets, actionList.M_actionGridNew),
	}
	if actionList.M_useSlayerScript {
		result.SlayerScript = string(actionList.M_slayerScriptName)
	}
	for _, tag := range actionList.M_defaultTags.Element {
		if tag != "" {
			result.DefaultTags = append(result.DefaultTags, string(tag))
		}
	}
	for _, scope := range actionList.M_scopeData.Element {
		database := nwfs.NormalizePath(string(scope.ScopeADB.BaseClass1.AssetPath))
		if scope.ScopeName == "" || database == "" {
			continue
		}
		result.Scopes = append(result.Scopes, ViewerMannequinScope{
			Context:  string(scope.ScopeName),
			Database: database,
		})
	}
	if result.Database == "" && result.ControllerDefinition == "" {
		return nil
	}
	return result
}

// assetPath is the file of an asset reference, its hint when the catalog does not know it
func assetPath(assets *game.Assets, asset nwt.AzAsset) string {
	if file, err := assets.LookupFileByAsset(asset); err == nil && file != nil {
		return file.Path()
	}
	return nwfs.NormalizePath(asset.Hint)
}

// invalidEntityId is the value of an empty AZ::EntityId
const invalidEntityId = nwt.AzUInt64(^uint64(0))

// sliceActionLists are the action lists of a slice by the entity that shows their character (m_skinnedMeshEntity),
// the action list's own entity when the reference is empty
func sliceActionLists(slice *nwt.SliceComponent) map[nwt.AzUInt64]*nwt.ActionListComponent {
	result := make(map[nwt.AzUInt64]*nwt.ActionListComponent)
	for _, entity := range slice.Entities.Element {
		for _, component := range entity.Components.Element {
			actionList, ok := component.(nwt.ActionListComponent)
			if !ok {
				continue
			}
			target := actionList.M_skinnedMeshEntity.EntityId.Id
			if target == 0 || target == invalidEntityId {
				target = entity.Id.Id
			}
			result[target] = &actionList
		}
	}
	return result
}

// sliceTimelineLayers are the timeline layers the TimelineComponents of a slice assign to entities, by entity
func sliceTimelineLayers(assets *game.Assets, slice *nwt.SliceComponent) map[nwt.AzUInt64][]ViewerTimelineLayer {
	result := make(map[nwt.AzUInt64][]ViewerTimelineLayer)
	for _, entity := range slice.Entities.Element {
		for _, component := range entity.Components.Element {
			timelines, ok := component.(nwt.TimelineComponent)
			if !ok {
				continue
			}
			for _, entry := range timelines.M_timelines.Element {
				timeline := assetPath(assets, entry.TimelineAsset)
				if timeline == "" {
					continue
				}
				for _, assignment := range entry.LayerEntityAssignments.Element {
					target := assignment.EntityId.Id
					if target == 0 || target == invalidEntityId {
						continue
					}
					result[target] = append(result[target], ViewerTimelineLayer{
						Timeline:      timeline,
						Layer:         string(assignment.LayerName),
						LayerId:       string(assignment.LayerId),
						RunOnActivate: bool(entry.RunOnActivate),
						Loop:          bool(entry.Loop),
					})
				}
			}
		}
	}
	return result
}

// characterViewDistance is the view distance of a character: the AOI radius of its slice, or the fallback without one
func characterViewDistance(aoiRadius float32) float32 {
	if aoiRadius <= 0 {
		return characterFallbackViewDistance
	}
	return aoiRadius
}

func clothGeometry(assets *game.Assets, clothFile string) string {
	file, ok := assets.Archive.Lookup(clothFile)
	if !ok {
		return ""
	}
	ref, err := cloth.TryResolveGeometryReference(file)
	if err != nil {
		return ""
	}
	return nwfs.NormalizePath(ref)
}

func attachmentMaterial(attachment cdf.Attachment) string {
	material := nwfs.NormalizePath(attachment.Material)
	if material != "" && !strings.HasSuffix(material, ".mtl") {
		material += ".mtl"
	}
	return material
}

// sliceAoiRadius is the AOI radius of a slice (AoiComponent.m_aoiRadius), 0 without an AoiComponent
func sliceAoiRadius(slice *nwt.SliceComponent) float32 {
	for _, components := range game.EntitiesOf(slice) {
		for _, component := range components {
			if aoi, ok := component.(nwt.AoiComponent); ok {
				return float32(aoi.M_aoiRadius)
			}
		}
	}
	return 0
}
