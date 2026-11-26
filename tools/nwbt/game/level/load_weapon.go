package level

import (
	"log/slog"
	"nw-buddy/tools/formats/cdf"
	"nw-buddy/tools/game"
	"nw-buddy/tools/rtti/nwt"
	"strconv"
	"strings"
)

// characterWeapons are the drawn weapons on the sockets of the holder's .cdf. The socket is the equip type's attachment
// of the hand, else the holder's first bone attachment.
func characterWeapons(assets *game.Assets, holder *cdf.Document, weapons []game.HeldWeapon) []ViewerCharacterWeapon {
	bones := holder.AttachmentsByType("CA_BONE")
	if len(bones) == 0 {
		return nil
	}
	result := make([]ViewerCharacterWeapon, 0)
	for _, it := range weapons {
		if !strings.HasSuffix(it.Mesh, ".cdf") {
			continue
		}
		file, ok := assets.Archive.Lookup(it.Mesh)
		if !ok {
			continue
		}
		doc, err := cdf.Load(file)
		if err != nil || doc == nil {
			slog.Warn("weapon not loaded", "file", it.Mesh, "error", err)
			continue
		}
		parts := cdfParts(assets, doc)
		if len(parts) == 0 {
			continue
		}
		name, position, rotation := equipTypeSocket(assets.EquipType(it.EquipType), it.OffHand)
		socket := bones[0]
		for _, bone := range bones {
			if strings.EqualFold(bone.AName, name) {
				socket = bone
				break
			}
		}
		if socket.BoneName == "" {
			continue
		}
		p := parseFloats(socket.RelPosition, 3, 0)
		q := parseFloats(socket.RelRotation, 4, 1)
		result = append(result, ViewerCharacterWeapon{
			Item:           it.Item,
			OffHand:        it.OffHand,
			Model:          it.Mesh,
			Parts:          parts,
			Joint:          socket.BoneName,
			SocketPosition: [3]float32{p[0], p[1], p[2]},
			// the cdf writes w first
			SocketRotation: [4]float32{q[1], q[2], q[3], q[0]},
			OffsetPosition: [3]float32{float32(position[0]), float32(position[1]), float32(position[2])},
			OffsetRotation: [3]float32{float32(rotation[0]), float32(rotation[1]), float32(rotation[2])},
		})
	}
	return result
}

// equipTypeSocket is the drawn attachment of a hand and its offset (meters, degrees), the other hand's when the
// equip type has none for it
func equipTypeSocket(it nwt.EquipTypeData, offHand bool) (string, nwt.AzVec3, nwt.AzVec3) {
	main := func() (string, nwt.AzVec3, nwt.AzVec3) {
		return string(it.Attachment), it.Attachment_Offset_Position, it.Attachment_Offset_Rotation__Degrees_
	}
	off := func() (string, nwt.AzVec3, nwt.AzVec3) {
		return string(it.Off_Hand_Attachment), it.Off_Hand_Attachment_Offset_Position,
			it.Off_Hand_Attachment_Offset_Rotation__Degrees_
	}
	if offHand {
		if it.Off_Hand_Attachment != "" {
			return off()
		}
		return main()
	}
	if it.Attachment != "" {
		return main()
	}
	return off()
}

// parseFloats reads a comma separated list, missing or invalid values are 0 (the first is fallback when empty)
func parseFloats(value string, count int, fallback float32) []float32 {
	result := make([]float32, count)
	if strings.TrimSpace(value) == "" {
		result[0] = fallback
		return result
	}
	parts := strings.Split(value, ",")
	for i := 0; i < count && i < len(parts); i++ {
		v, _ := strconv.ParseFloat(strings.TrimSpace(parts[i]), 32)
		result[i] = float32(v)
	}
	return result
}
