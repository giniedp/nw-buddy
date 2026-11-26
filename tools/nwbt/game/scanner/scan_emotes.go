package scanner

import (
	"fmt"
	"nw-buddy/tools/formats/adb"
	"nw-buddy/tools/game"
	"nw-buddy/tools/utils/maps"
	"strings"
)

const (
	playerAdbFile    = "animations/mannequin/adb/player/player.adb"
	idleFragmentName = "Idle"
	emoteDataSchema  = "EmoteData"
)

// ScannedEmote is the player's idle (id `Idle`) or an emote (id `UniqueTagID` of EmoteData) as a clip sequence
type ScannedEmote struct {
	ID    string             `json:"id"`
	Clips []ScannedEmoteClip `json:"clips"`
}

// ScannedEmoteClip is a clip file (.caf) of a sequence
type ScannedEmoteClip struct {
	// animation name in the player's animation set (lower case)
	Name string `json:"-"`
	File string `json:"file"`
	Loop bool   `json:"loop"`
}

// ScanEmotes builds the clip sequences of the player's idle and emotes from the player's database and the EmoteData
// tables. A sequence is the first animation layer of the fragment's default variant (no tags, else the first): one
// clip, or a start clip and a looping one. Animations without a clip file (blend spaces) are left out.
func ScanEmotes(assets *game.Assets) ([]ScannedEmote, error) {
	database, err := assets.LoadAdb(playerAdbFile)
	if err != nil {
		return nil, fmt.Errorf("player database not loaded: %w", err)
	}
	// male and female play the same clips
	player, err := assets.LoadCdf(game.CDF_MODEL_MALE)
	if err != nil {
		return nil, fmt.Errorf("player character not loaded: %w", err)
	}
	files, err := player.LoadAnimationFiles(assets.Archive)
	if err != nil {
		return nil, fmt.Errorf("player animations not loaded: %w", err)
	}
	clipFiles := make(map[string]string)
	for _, file := range files {
		if file.Type == adb.Caf {
			clipFiles[strings.ToLower(file.Name)] = strings.ToLower(file.File)
		}
	}

	result := maps.NewDict[ScannedEmote]()
	add := func(id string, fragment string) {
		if clips := fragmentClips(database, fragment, clipFiles); id != "" && len(clips) > 0 {
			result.Store(id, ScannedEmote{ID: id, Clips: clips})
		}
	}
	add(idleFragmentName, idleFragmentName)
	for table := range assets.DatasheetsOfSchema(emoteDataSchema) {
		for _, row := range table.RowsAsJSON() {
			add(row.GetString("UniqueTagID"), row.GetString("FragmentName"))
		}
	}
	return result.SortedValues(), nil
}

func fragmentClips(database *adb.Document, fragment string, clipFiles map[string]string) []ScannedEmoteClip {
	variants := database.FragmentList.ByName(fragment)
	if len(variants) == 0 {
		return nil
	}
	variant := variants[0]
	for _, it := range variants {
		if it.Tags == "" {
			variant = it
			break
		}
	}
	if len(variant.AnimLayer) == 0 {
		return nil
	}
	result := make([]ScannedEmoteClip, 0)
	for _, animation := range variant.AnimLayer[0].Animation {
		name := strings.ToLower(animation.Name)
		if file, ok := clipFiles[name]; ok {
			result = append(result, ScannedEmoteClip{Name: name, File: file, Loop: animation.HasFlag("Loop")})
		}
	}
	return result
}
