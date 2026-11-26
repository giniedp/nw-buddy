package models

import (
	"fmt"
	"log/slog"
	"nw-buddy/tools/formats/adb"
	"nw-buddy/tools/formats/cdf"
	"nw-buddy/tools/formats/gltf"
	"nw-buddy/tools/formats/gltf/importer"
	"nw-buddy/tools/game"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/logging"
	"nw-buddy/tools/utils/math"
	"strconv"
	"strings"

	"github.com/spf13/cobra"
)

var cmdCollectCharacter = &cobra.Command{
	Use:   "character",
	Short: "",
	Long:  "",
	Run:   runCollectCharacter,
}

var flgSkinTone string

func init() {
	cmdCollectCharacter.Flags().AddFlagSet(Cmd.Flags())
	cmdCollectCharacter.Flags().StringVar(&flgSkinTone, "skin-tone", "", "skin tone of the head and body materials (l1..l5, d1..d5 of the caucasian heads), empty: d2, the tone of the bare skins")
}

func runCollectCharacter(ccmd *cobra.Command, args []string) {
	slog.SetDefault(logging.DefaultFileHandler())
	c := utils.Must(initCollector())
	c.CollectCharacter()
	c.Process()
	slog.SetDefault(logging.DefaultTerminalHandler())
}

// CollectCharacter collects the player models in a skin tone with the clips of their idle and emotes, and the bare
// skins of the armor appearances
func (c *Collector) CollectCharacter() {
	tone := flgSkinTone
	if tone == "" {
		tone = characterSkinTone
	}
	models := []struct{ gender, file string }{
		{"male", game.CDF_MODEL_MALE},
		{"female", game.CDF_MODEL_FEMALE},
	}
	var keep func(name string) bool
	for _, model := range models {
		cdf, err := c.LoadCdf(model.file)
		if err != nil {
			slog.Warn("skip unresolved cdf file", "err", err)
			continue
		}
		// male and female play the same clips
		if keep == nil && c.flags.Animations {
			keep = c.emoteAnimationFilter()
		}
		c.applySkinTone(cdf, model.gender, tone)
		c.CollectCdf(cdf, "", "", c.outputPath(model.file), keep)
	}
	c.collectCharacterSkins()
}

// applySkinTone replaces the head and body materials of a player with the pair of a skin tone, as the character
// creation does (charactercreationdatabase/*.skintonedb, e.g. european skin07 = d2). The character files' own pairs
// can differ: the female binds a body material no skin tone uses.
func (c *Collector) applySkinTone(doc *cdf.Document, gender string, tone string) {
	replace := make(map[string]string)
	for _, it := range doc.AttachmentList.Attachment {
		switch it.AName {
		case "head1":
			replace[strings.ToLower(it.Material)] = fmt.Sprintf(
				"objects/characters/player/%s/naked_caucasian/%s_naked_head_caucasian_%s_matgroup.mtl", gender, gender, tone)
		case "shirt1":
			replace[strings.ToLower(it.Material)] = playerBodyMaterial(gender, tone)
		}
	}
	for from, to := range replace {
		if _, ok := c.Archive.Lookup(to); !ok {
			slog.Warn("skin tone material not found, the character file's material stays", "file", to)
			delete(replace, from)
		}
	}
	for i := range doc.AttachmentList.Attachment {
		attachment := &doc.AttachmentList.Attachment[i]
		if to, ok := replace[strings.ToLower(attachment.Material)]; ok {
			attachment.Material = to
		}
	}
}

// CollectCdf collects the skins and cloth of a character file, all with the material override and the overcoat (empty
// for none). With the animations flag it also collects the clips of
// its animation set that keep accepts (nil: all of them) and lists them in the `animationList` extra.
func (c *Collector) CollectCdf(cdf *cdf.Document, material string, overcoat string, targetFile string, keep func(name string) bool) {
	var animations []adb.AnimationFile
	if c.flags.Animations {
		animations, _ = c.CollectAnimations(cdf, keep)
	}

	group := importer.AssetGroup{
		Extra: map[string]any{},
	}
	if len(animations) > 0 {
		group.Extra["animationList"] = animations
	}
	if sockets := cdfSockets(cdf); len(sockets) > 0 {
		group.Extra[gltf.ExtraKeySockets] = sockets
	}

	for _, attachment := range cdf.SkinAndClothAttachments() {
		if model, mtl := c.ResolveAttachment(attachment, material); model != "" {
			var extra map[string]any
			if attachment.Hidden() {
				// the game hides it by default (e.g. the sleeveless torso of the players)
				extra = map[string]any{gltf.ExtraKeyHidden: true}
			}
			group.Geometries = append(group.Geometries, importer.GeometryAsset{
				Entity: importer.Entity{
					Name:  attachment.AName,
					Extra: extra,
				},
				GeometryFile: model,
				MaterialFile: mtl,
				OvercoatFile: overcoat,
			})
		}
	}
	if len(group.Geometries) > 0 {
		group.TargetFile = targetFile
		c.models.Store(group.TargetFile, group)
	}
}

// CharacterSocket is a bone attachment of a character file: a place for other models (weapons, props) relative to a
// joint
type CharacterSocket struct {
	Name     string     `json:"name"`
	Joint    string     `json:"joint"`
	Position [3]float64 `json:"position"`
	// x, y, z, w (the cdf writes w first)
	Rotation [4]float64 `json:"rotation"`
}

func cdfSockets(doc *cdf.Document) []CharacterSocket {
	result := make([]CharacterSocket, 0)
	for _, it := range doc.AttachmentsByType("CA_BONE") {
		if it.BoneName == "" {
			continue
		}
		position := parseFloats(it.RelPosition, 3, 0)
		rotation := parseFloats(it.RelRotation, 4, 1)
		result = append(result, CharacterSocket{
			Name:     it.AName,
			Joint:    it.BoneName,
			Position: [3]float64{position[0], position[1], position[2]},
			Rotation: [4]float64{rotation[1], rotation[2], rotation[3], rotation[0]},
		})
	}
	return result
}

// convertSockets converts the relative transforms of sockets to the axes of an export
func convertSockets(sockets []CharacterSocket, base math.Base) []CharacterSocket {
	if base == nil {
		return sockets
	}
	result := make([]CharacterSocket, len(sockets))
	for i, it := range sockets {
		p := base.Vec3(math.Vec3{float32(it.Position[0]), float32(it.Position[1]), float32(it.Position[2])})
		q := base.Quat(math.Quat{
			float32(it.Rotation[0]), float32(it.Rotation[1]), float32(it.Rotation[2]), float32(it.Rotation[3]),
		})
		result[i] = CharacterSocket{
			Name:     it.Name,
			Joint:    it.Joint,
			Position: [3]float64{float64(p[0]), float64(p[1]), float64(p[2])},
			Rotation: [4]float64{float64(q[0]), float64(q[1]), float64(q[2]), float64(q[3])},
		}
	}
	return result
}

// parseFloats reads a comma separated list, missing or invalid values are 0 (the first is fallback when empty)
func parseFloats(value string, count int, fallback float64) []float64 {
	result := make([]float64, count)
	parts := strings.Split(value, ",")
	if strings.TrimSpace(value) == "" {
		result[0] = fallback
		return result
	}
	for i := 0; i < count && i < len(parts); i++ {
		result[i], _ = strconv.ParseFloat(strings.TrimSpace(parts[i]), 64)
	}
	return result
}

// CollectAnimations collects the clips (.caf) of the character's animation set that keep accepts (nil: all of them)
func (c *Collector) CollectAnimations(cdf *cdf.Document, keep func(name string) bool) ([]adb.AnimationFile, error) {
	animations, err := cdf.LoadAnimationFiles(c.Archive)
	if err != nil {
		return nil, err
	}
	result := make([]adb.AnimationFile, 0)
	for _, animation := range animations {
		if keep != nil && !keep(animation.Name) {
			continue
		}
		switch animation.Type {
		case adb.Caf:
			result = append(result, adb.AnimationFile{
				Name: animation.Name,
				File: c.assetPath(animation.File),
				Type: adb.Caf,
			})
			targetFile := c.outputPath(animation.File)
			if !c.shouldProcess(targetFile) {
				continue
			}
			c.models.Store(targetFile, importer.AssetGroup{
				TargetFile: targetFile,
				Animations: []importer.AnimationAsset{
					{
						File: animation.File,
						Name: animation.Name,
					},
				},
			})
		}
	}
	return result, nil
}
