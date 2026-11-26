package models

import (
	"fmt"
	"log/slog"
	"nw-buddy/tools/formats/gltf/importer"
	"nw-buddy/tools/game/scanner"
	"strings"
)

// The character editor's models besides the players (CollectCharacter): the clips of the player's idle and emotes and
// the bare skins of the armor appearances

const (
	characterSkinTone  = "d2"
	armorDataSchema    = "ArmorAppearanceDefinitions"
	nakedCaucasianPath = "/naked_caucasian/"
)

// playerBodyMaterial is the shared body material of a gender in a skin tone, the bare skins bind it as the player does
func playerBodyMaterial(gender string, tone string) string {
	return fmt.Sprintf("objects/characters/player/%s/naked_shared/%s_naked_body_shared_%s_matgroup.mtl", gender, gender, tone)
}

// emoteAnimationFilter accepts the animations the player's idle and emotes play, none when the emotes do not load
func (c *Collector) emoteAnimationFilter() func(name string) bool {
	names := make(map[string]bool)
	emotes, err := scanner.ScanEmotes(c.Assets)
	if err != nil {
		slog.Warn("emotes not scanned, no clips", "err", err)
	}
	for _, emote := range emotes {
		for _, clip := range emote.Clips {
			names[clip.Name] = true
		}
	}
	return func(name string) bool {
		return names[strings.ToLower(name)]
	}
}

// collectCharacterSkins collects the bare skins of the armor appearances (Skin2, e.g. the arms of a sleeveless chest)
// at their game paths. The player's bare body skins bind the gender's shared body material in the editor's skin tone,
// as the player character does; the others their own material.
func (c *Collector) collectCharacterSkins() {
	skins := make(map[string]bool)
	for table := range c.EachDatasheet() {
		if table.Schema != armorDataSchema {
			continue
		}
		for _, row := range table.RowsAsJSON() {
			if skin := strings.ToLower(row.GetString("Skin2")); skin != "" {
				skins[skin] = true
			}
		}
	}
	for skin := range skins {
		material := ""
		for _, gender := range []string{"male", "female"} {
			if strings.Contains(skin, "/player/"+gender+nakedCaucasianPath) {
				material = playerBodyMaterial(gender, characterSkinTone)
			}
		}
		targetFile := c.outputPath(skin)
		if !c.shouldProcess(targetFile) {
			continue
		}
		model, mtl := c.ResolveCgfAndMtl(skin, material)
		if model == "" {
			slog.Warn("bare skin not resolved", "file", skin)
			continue
		}
		c.models.Store(targetFile, importer.AssetGroup{
			TargetFile: targetFile,
			Geometries: []importer.GeometryAsset{{GeometryFile: model, MaterialFile: mtl}},
		})
	}
}
