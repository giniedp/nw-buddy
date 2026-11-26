package serve

import (
	"fmt"
	"log/slog"
	gomath "math"
	"net/http"
	"nw-buddy/tools/formats/cdf"
	"nw-buddy/tools/formats/gltf/importer"
	"nw-buddy/tools/game"
	"nw-buddy/tools/game/slicemodel"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils/math"
	"nw-buddy/tools/utils/math/mat4"
	"path"
	"strconv"
	"strings"

	"github.com/goccy/go-json"
)

// ComposeRequest is a model as a viewer shows it: the model's own geometry without the hidden attachments, worn parts
// with their materials and colors, optionally clips. The character editor sends a player with parts, the model views
// a single model with its material and colors.
type ComposeRequest struct {
	// the model: a character (.cdf, e.g. the player of a gender), a mesh (.cgf, .skin) or a prefab (.dynamicslice).
	// Optional when there are parts.
	Model string `json:"model"`
	// the material of the model, in place of its own (for a .cdf: of every attachment). Empty: the model's own.
	Material string `json:"material"`
	// a material the model is drawn with a second time, not a prefab
	Overcoat string `json:"overcoat"`
	// public params of the model's materials (the colors of an appearance and its dyes), see ComposePart.Params
	Params map[string]any `json:"params"`
	// a skeleton (.chr) for skinned parts shown alone (an armor piece), its geometry left out
	Skeleton string `json:"skeleton"`
	// attachment names (AName) of the character to leave out: the ones the worn parts replace and the user hides
	Hidden []string `json:"hidden"`
	// the worn models
	Parts []ComposePart `json:"parts"`
	// the models on sockets of the character (weapons)
	Sockets []ComposeSocket `json:"sockets"`
	// clips the export includes, `{"name", "file"}` (.caf only). Without a file, the name is looked up in the animation
	// list of the model (.cdf).
	Animations []importer.AnimationAsset `json:"animations"`
	// a pose of the skeleton: controller id → local translation xyz and rotation xyzw (the viewer's joints, y-up:
	// needs `yup`)
	Pose map[string][7]float32 `json:"pose"`
	// file name of the download, without the extension
	Name string `json:"name"`
}

// ComposePart is a worn model: a skin bound to the character's skeleton
type ComposePart struct {
	// node name of the part, e.g. the attachment it replaces
	Name string `json:"name"`
	Skin string `json:"skin"`
	// the material of the skin, empty: the skin's own
	Material string `json:"material"`
	// public params of the part's materials (the colors of an armor appearance and its dyes), numbers or strings as
	// in a .mtl
	Params map[string]any `json:"params"`
	// a character (.cdf) whose cloth attachments come with the part (an armor appearance's AppearanceCDF: capes,
	// skirts), with the same params
	ClothFrom string `json:"clothFrom"`
}

// ComposeSocket is a bone attachment of the character and the models on it, static in their bind pose
type ComposeSocket struct {
	// attachment name (AName). One the character lacks is replaced by its mirror (`left_sword` for `right_sword`), else
	// by the first one, as the viewer does.
	Name string `json:"name"`
	// the models' offset on the socket in game axes, as the equip types have it: meters, and degrees about x, y, z (x
	// applied first)
	Offset struct {
		Position []float32 `json:"position"`
		Rotation []float32 `json:"rotation"`
	} `json:"offset"`
	Models []ComposeSocketModel `json:"models"`
}

// ComposeSocketModel is a model on a socket, see the fields of ComposeRequest
type ComposeSocketModel struct {
	Model    string         `json:"model"`
	Material string         `json:"material"`
	Params   map[string]any `json:"params"`
}

// composeCharacterFunc serves POST /characters/compose: the GLB of a ComposeRequest (body). The model export options
// apply as query (`textures`, `ior`, `size`, `yup`, ..., see convert_model_options.go), `target` is `.glb` (default)
// or `.gltf.zip`. Not cached: every export is composed on request.
func composeCharacterFunc(assets *game.Assets) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var request ComposeRequest
		if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
			http.Error(w, fmt.Sprintf("invalid request: %v", err), http.StatusBadRequest)
			return
		}
		query := r.URL.Query()
		target := query.Get("target")
		if target == "" {
			target = ".glb"
		}
		if !isModelTarget(target) {
			http.Error(w, fmt.Sprintf("unsupported target: %s", target), http.StatusBadRequest)
			return
		}
		group, err := composeCharacter(assets, request, math.GetBase(query.Has(QUERY_YUP)))
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		data, err := convertGltf(assets, group, target == ".glb", convertParams{
			assets: assets,
			target: target,
			query:  query,
		})
		if err != nil {
			slog.Error("compose failed", "err", err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		name := request.Name
		if name == "" {
			name = strings.TrimSuffix(path.Base(request.Model), path.Ext(request.Model))
		}
		contentType := "model/gltf-binary"
		if target != ".glb" {
			contentType = "application/zip"
		}
		w.Header().Set("Content-Type", contentType)
		w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s%s"`, safeFileName(name), target))
		w.Write(data)
	}
}

// composeCharacter is the asset group of a request: the model's own geometry (a character's attachments without the
// hidden ones, a mesh, a prefab), the skeleton, the parts and the cloth they bring, the clips
func composeCharacter(assets *game.Assets, request ComposeRequest, base math.Base) (importer.AssetGroup, error) {
	group := importer.AssetGroup{}
	model := nwfs.NormalizePath(request.Model)
	material := nwfs.NormalizePath(request.Material)
	overcoat := assets.ResolveMtl(nwfs.NormalizePath(request.Overcoat))
	modelParams := paramStrings(request.Params)
	var character *cdf.Document
	switch strings.ToLower(path.Ext(model)) {
	case "":
		if len(request.Parts) == 0 {
			return group, fmt.Errorf("neither a model nor parts")
		}
	case ".cdf":
		doc, err := assets.LoadCdf(model)
		if err != nil {
			return group, err
		}
		character = doc
		hidden := make(map[string]bool, len(request.Hidden))
		for _, name := range request.Hidden {
			hidden[strings.ToLower(name)] = true
		}
		for _, attachment := range character.SkinAndClothAttachments() {
			if hidden[strings.ToLower(attachment.AName)] {
				continue
			}
			if skin, mtl := assets.ResolveAttachment(attachment, material); skin != "" {
				group.Geometries = append(group.Geometries, importer.GeometryAsset{
					Entity:         importer.Entity{Name: attachment.AName},
					GeometryFile:   skin,
					MaterialFile:   mtl,
					OvercoatFile:   overcoat,
					MaterialParams: modelParams,
				})
			}
		}
	case ".cgf", ".skin":
		skin, mtl := assets.ResolveCgfAndMtl(model, material)
		if skin == "" {
			return group, fmt.Errorf("model not found: %s", request.Model)
		}
		group.Geometries = append(group.Geometries, importer.GeometryAsset{
			Entity:         importer.Entity{Name: strings.TrimSuffix(path.Base(model), path.Ext(model))},
			GeometryFile:   skin,
			MaterialFile:   mtl,
			OvercoatFile:   overcoat,
			MaterialParams: modelParams,
		})
	case ".dynamicslice":
		file, ok := assets.Archive.Lookup(model)
		if !ok {
			return group, fmt.Errorf("model not found: %s", request.Model)
		}
		slicemodel.Collect(assets, file, slicemodel.Options{Convert: base.Mat4, KeepSkin: true}, &group)
		for i := range group.Geometries {
			group.Geometries[i].MaterialParams = modelParams
		}
	default:
		return group, fmt.Errorf("model is not a .cdf, .cgf, .skin or .dynamicslice: %s", request.Model)
	}
	if skeleton := nwfs.NormalizePath(request.Skeleton); skeleton != "" {
		group.Geometries = append(group.Geometries, importer.GeometryAsset{
			GeometryFile: skeleton,
			MaterialFile: game.DEFAULT_MATERIAL,
			SkipGeometry: true,
		})
	}
	for _, part := range request.Parts {
		params := paramStrings(part.Params)
		skin, material := assets.ResolveCgfAndMtl(nwfs.NormalizePath(part.Skin), nwfs.NormalizePath(part.Material))
		if skin == "" {
			slog.Warn("compose: part skipped, skin not found", "skin", part.Skin)
			continue
		}
		group.Geometries = append(group.Geometries, importer.GeometryAsset{
			Entity:         importer.Entity{Name: part.Name},
			GeometryFile:   skin,
			MaterialFile:   material,
			MaterialParams: params,
		})
		for _, cloth := range clothAttachments(assets.Archive, part.ClothFrom) {
			if skin, material := assets.ResolveCgfAndMtl(cloth.Binding, cloth.Material); skin != "" {
				group.Geometries = append(group.Geometries, importer.GeometryAsset{
					Entity:         importer.Entity{Name: cloth.AName},
					GeometryFile:   skin,
					MaterialFile:   material,
					MaterialParams: params,
				})
			}
		}
	}
	group.Geometries = append(group.Geometries, socketGeometries(assets, character, request.Sockets, base)...)
	clips, err := characterClips(assets, character)
	if err != nil {
		return group, err
	}
	for _, it := range request.Animations {
		if it.File == "" {
			it.File = clips[strings.ToLower(it.Name)]
		}
		if strings.ToLower(path.Ext(it.File)) != ".caf" {
			slog.Warn("compose: animation skipped, not a .caf", "file", it.File)
			continue
		}
		group.Animations = append(group.Animations, importer.AnimationAsset{Name: it.Name, File: nwfs.NormalizePath(it.File)})
	}
	if len(request.Pose) > 0 {
		group.Pose = make(map[uint32][7]float32, len(request.Pose))
		for key, value := range request.Pose {
			id, err := strconv.ParseUint(key, 10, 32)
			if err != nil {
				return group, fmt.Errorf("invalid pose joint %q: %w", key, err)
			}
			group.Pose[uint32(id)] = value
		}
	}
	return group, nil
}

// socketGeometries are the models on the sockets of a character, none without a character or without sockets
func socketGeometries(assets *game.Assets, character *cdf.Document, sockets []ComposeSocket, base math.Base) []importer.GeometryAsset {
	result := make([]importer.GeometryAsset, 0)
	if character == nil {
		return result
	}
	bones := character.AttachmentsByType("CA_BONE")
	for _, socket := range sockets {
		bone, ok := findSocket(bones, socket.Name)
		if !ok {
			slog.Warn("compose: socket not found", "socket", socket.Name)
			continue
		}
		position, rotation := bone.RelTransform()
		transform := base.Mat4(mat4.Multiply(
			mat4.FromRotationScaleTranslation(rotation, 1, position),
			socketOffset(socket.Offset.Position, socket.Offset.Rotation),
		))
		for _, it := range socket.Models {
			add := func(name string, model string, material string) {
				result = append(result, importer.GeometryAsset{
					Entity:         importer.Entity{Name: name, Transform: transform},
					GeometryFile:   model,
					MaterialFile:   material,
					MaterialParams: paramStrings(it.Params),
					Joint:          bone.BoneName,
					SkipSkin:       true,
				})
			}
			model := nwfs.NormalizePath(it.Model)
			material := nwfs.NormalizePath(it.Material)
			if path.Ext(model) != ".cdf" {
				if mesh, mtl := assets.ResolveCgfAndMtl(model, material); mesh != "" {
					add(strings.TrimSuffix(path.Base(mesh), path.Ext(mesh)), mesh, mtl)
				} else {
					slog.Warn("compose: socket model not found", "model", it.Model)
				}
				continue
			}
			doc, err := assets.LoadCdf(model)
			if err != nil {
				slog.Warn("compose: socket model not loaded", "model", it.Model, "err", err)
				continue
			}
			for _, part := range doc.VisibleSkinAndClothAttachments() {
				if mesh, mtl := assets.ResolveAttachment(part, material); mesh != "" {
					add(part.AName, mesh, mtl)
				}
			}
		}
	}
	return result
}

// findSocket returns the bone attachment of a name, else its mirror, else the first one
func findSocket(bones []cdf.Attachment, name string) (cdf.Attachment, bool) {
	for _, it := range []string{name, mirrorSocket(name)} {
		for _, bone := range bones {
			if bone.BoneName != "" && strings.EqualFold(bone.AName, it) {
				return bone, true
			}
		}
	}
	for _, bone := range bones {
		if bone.BoneName != "" {
			return bone, true
		}
	}
	return cdf.Attachment{}, false
}

// mirrorSocket is the socket of the other side: `right…` and `left…`, other names stay
func mirrorSocket(name string) string {
	if rest, ok := strings.CutPrefix(name, "right"); ok {
		return "left" + rest
	}
	if rest, ok := strings.CutPrefix(name, "left"); ok {
		return "right" + rest
	}
	return name
}

// socketOffset is translation × Rz × Ry × Rx (degrees), missing values are 0
func socketOffset(position []float32, rotation []float32) mat4.Data {
	var p, r [3]float32
	copy(p[:], position)
	copy(r[:], rotation)
	result := mat4.Identity()
	for _, axis := range []int{2, 1, 0} {
		half := float64(r[axis]) * gomath.Pi / 360
		q := [4]float32{0, 0, 0, float32(gomath.Cos(half))}
		q[axis] = float32(gomath.Sin(half))
		result = mat4.Multiply(result, mat4.FromQuat(q))
	}
	result[12], result[13], result[14] = p[0], p[1], p[2]
	return result
}

// characterClips are the .caf files of a character's animation list by lower case name, none without a character
func characterClips(assets *game.Assets, character *cdf.Document) (map[string]string, error) {
	result := map[string]string{}
	if character == nil {
		return result, nil
	}
	list, err := CollectAnimations(assets, character)
	if err != nil {
		return nil, err
	}
	for _, it := range list {
		result[strings.ToLower(it.Name)] = it.File
	}
	return result, nil
}

// clothAttachments are the cloth attachments (capes, skirts) of a character, none for an empty path
func clothAttachments(archive nwfs.Archive, cdfPath string) []cdf.Attachment {
	if cdfPath == "" {
		return nil
	}
	file, ok := archive.Lookup(nwfs.NormalizePath(cdfPath))
	if !ok {
		return nil
	}
	doc, err := cdf.Load(file)
	if err != nil {
		slog.Warn("compose: cloth cdf not loaded", "file", cdfPath, "err", err)
		return nil
	}
	return doc.ClothAttachments()
}

// paramStrings are params as .mtl values: numbers in their shortest form, strings as they are
func paramStrings(params map[string]any) map[string]string {
	if len(params) == 0 {
		return nil
	}
	result := make(map[string]string, len(params))
	for key, value := range params {
		switch v := value.(type) {
		case string:
			result[key] = v
		case float64:
			result[key] = fmt.Sprintf("%g", v)
		default:
			result[key] = fmt.Sprint(v)
		}
	}
	return result
}

// safeFileName keeps letters, digits, dash, underscore, dot and space of a file name
func safeFileName(name string) string {
	result := strings.Map(func(r rune) rune {
		if r == '-' || r == '_' || r == '.' || r == ' ' || (r >= '0' && r <= '9') || (r >= 'a' && r <= 'z') ||
			(r >= 'A' && r <= 'Z') {
			return r
		}
		return '_'
	}, name)
	if strings.Trim(result, "_ .") == "" {
		return "character"
	}
	return result
}
