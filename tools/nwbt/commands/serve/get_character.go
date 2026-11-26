package serve

import (
	"log/slog"
	"net/http"
	"nw-buddy/tools/formats/adb"
	"nw-buddy/tools/formats/cdf"
	"nw-buddy/tools/formats/chrparams"
	"nw-buddy/tools/game"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils"
	"path"
	"slices"
	"strings"
	"sync"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
)

// CharacterAnimations is the animation set of a skeleton: what its .chrparams names, resolved as the game does
// (formats/chrparams LoadAnimationList). The viewer parses the files itself.
type CharacterAnimations struct {
	// the skeleton (.chr)
	Skeleton string `json:"skeleton"`
	// the animation list of the skeleton, empty when the skeleton has none
	Chrparams string `json:"chrparams,omitempty"`
	// the animation events (.animevents), empty without
	AnimEvents string `json:"animEvents,omitempty"`
	// name → file, the first file with a name keeps it
	Animations []adb.AnimationFile `json:"animations"`
}

// CharacterDatabase is an animation database (ADB) and how much of it a character can play. A fragment is playable
// when one of its variants has all its animation names in the character's animation set: Mannequin resolves the
// names through that set, so the clips are the skeleton's own.
type CharacterDatabase struct {
	File string `json:"file"`
	// the fragments with an animated variant, the sub databases' included
	Fragments int `json:"fragments"`
	// of these, the fragments with a playable variant
	Playable int `json:"playable"`
}

func CharactersRouter(r *mux.Router, assets *game.Assets) {
	r.Handle("/animations", handlers.CompressHandler(getCharacterAnimationsFunc(assets)))
	r.Handle("/adbs", handlers.CompressHandler(getCharacterDatabasesFunc(assets)))
	r.Handle("/compose", composeCharacterFunc(assets)).Methods(http.MethodPost)
}

// getCharacterDatabasesFunc serves /characters/adbs?model=<.cdf|.chr>: every ADB of the archive with its playable
// fragments for the character, in path order. The animated variants of all ADBs are indexed on the first request
// (in memory, about 100 MB of xml parsed once).
func getCharacterDatabasesFunc(assets *game.Assets) http.HandlerFunc {
	var once sync.Once
	var index []databaseIndex
	return func(w http.ResponseWriter, r *http.Request) {
		skeleton, params, err := characterSkeleton(assets, nwfs.NormalizePath(r.URL.Query().Get("model")))
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		if skeleton == "" {
			http.NotFound(w, r)
			return
		}
		set, err := loadCharacterAnimations(assets, skeleton, params)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		names := make(map[string]bool, len(set.Animations))
		for _, it := range set.Animations {
			names[strings.ToLower(it.Name)] = true
		}
		once.Do(func() {
			index = indexDatabases(assets)
		})
		result := make([]CharacterDatabase, 0, len(index))
		for _, it := range index {
			result = append(result, it.evaluate(names))
		}
		serveJson(result, w)
	}
}

// databaseIndex holds the animated variants of an ADB (its own and its sub databases'): per fragment, the animation
// names of each variant
type databaseIndex struct {
	file      string
	fragments map[string][][]string
}

func (it databaseIndex) evaluate(names map[string]bool) CharacterDatabase {
	result := CharacterDatabase{File: it.file, Fragments: len(it.fragments)}
	for _, variants := range it.fragments {
		for _, variant := range variants {
			if allNames(variant, names) {
				result.Playable++
				break
			}
		}
	}
	return result
}

func allNames(list []string, names map[string]bool) bool {
	for _, name := range list {
		if !names[name] {
			return false
		}
	}
	return true
}

func indexDatabases(assets *game.Assets) []databaseIndex {
	files, err := assets.Archive.Glob("**.adb")
	if err != nil {
		slog.Warn("adb index", "err", err)
		return nil
	}
	docs := make(map[string]*adb.Document, len(files))
	for _, file := range files {
		doc, err := adb.Load(file)
		if err != nil {
			slog.Warn("adb not loaded", "file", file.Path(), "err", err)
			continue
		}
		docs[strings.ToLower(file.Path())] = doc
	}
	result := make([]databaseIndex, 0, len(files))
	for _, file := range files {
		it := databaseIndex{file: file.Path(), fragments: map[string][][]string{}}
		addDatabaseVariants(docs, strings.ToLower(file.Path()), it.fragments, map[string]bool{})
		result = append(result, it)
	}
	slices.SortFunc(result, func(a, b databaseIndex) int {
		return strings.Compare(a.file, b.file)
	})
	return result
}

// addDatabaseVariants adds the animated variants of an ADB and its sub databases, by fragment name
func addDatabaseVariants(docs map[string]*adb.Document, key string, out map[string][][]string, seen map[string]bool) {
	doc := docs[key]
	if doc == nil || seen[key] {
		return
	}
	seen[key] = true
	for name, variants := range doc.FragmentList.Iter() {
		for _, variant := range variants {
			animations := make([]string, 0)
			for _, layer := range variant.AnimLayer {
				for _, animation := range layer.Animation {
					if animation.Name != "" {
						animations = append(animations, strings.ToLower(animation.Name))
					}
				}
			}
			if len(animations) > 0 {
				out[name] = append(out[name], animations)
			}
		}
	}
	for _, sub := range doc.SubADBs.SubADB {
		addDatabaseVariants(docs, strings.ToLower(nwfs.NormalizePath(sub.File)), out, seen)
	}
}

// getCharacterAnimationsFunc serves /characters/animations?model=<.cdf|.chr>. Not cached: the resolution is fast (the
// archive caches its animation file list) and the viewer holds the result while the character is loaded.
func getCharacterAnimationsFunc(assets *game.Assets) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		skeleton, params, err := characterSkeleton(assets, nwfs.NormalizePath(r.URL.Query().Get("model")))
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		if skeleton == "" {
			http.NotFound(w, r)
			return
		}
		result, err := loadCharacterAnimations(assets, skeleton, params)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		serveJson(result, w)
	}
}

// characterSkeleton is the skeleton of a model and the animation list it plays: a .chr as it is with the .chrparams
// next to it, the model of a .cdf with its list (the ParamsOverride when set, see cdf.Document.ChrParamsPath), empty
// for other files
func characterSkeleton(assets *game.Assets, model string) (skeleton string, params string, err error) {
	switch strings.ToLower(path.Ext(model)) {
	case ".chr":
		return model, utils.ReplaceExt(model, ".chrparams"), nil
	case ".cdf":
		file, ok := assets.Archive.Lookup(model)
		if !ok {
			return "", "", nil
		}
		doc, err := cdf.Load(file)
		if err != nil {
			return "", "", err
		}
		if !doc.IsChr() {
			return "", "", nil
		}
		return nwfs.NormalizePath(doc.Model.File), doc.ChrParamsPath(), nil
	}
	return "", "", nil
}

func loadCharacterAnimations(assets *game.Assets, skeleton string, paramsPath string) (*CharacterAnimations, error) {
	result := &CharacterAnimations{
		Skeleton:   skeleton,
		Animations: make([]adb.AnimationFile, 0),
	}
	file, ok := assets.Archive.Lookup(paramsPath)
	if !ok {
		return result, nil
	}
	doc, err := chrparams.Load(file)
	if err != nil {
		return nil, err
	}
	animations, err := doc.LoadAnimationList(assets.Archive)
	if err != nil {
		return nil, err
	}
	result.Chrparams = paramsPath
	result.AnimEvents = doc.AnimEventDatabase(assets.Archive)
	result.Animations = animations
	return result, nil
}
