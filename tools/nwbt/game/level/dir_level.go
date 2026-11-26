package level

import (
	"bufio"
	"bytes"
	"log/slog"
	"nw-buddy/tools/formats/mission"
	"nw-buddy/tools/game"
	"path"
	"regexp"
	"strings"
)

type LevelDirectory struct {
	Name string // directory base name of the level. This may be nested, e.g. "climax/climaxftue_02"
}

func levelsPath(paths ...string) string {
	paths = append([]string{"levels"}, paths...)
	return path.Join(paths...)
}

func (dir *LevelDirectory) Path(paths ...string) string {
	paths = append([]string{dir.Name}, paths...)
	return levelsPath(paths...)
}
func (dir *LevelDirectory) PathResourcelistTxt() string {
	return dir.Path("resourcelist.txt")
}
func (dir *LevelDirectory) PathMissionFile() string {
	return dir.Path("mission_mission0.xml")
}
func (dir *LevelDirectory) PathMissionEntitiesFile() string {
	return dir.Path("mission0.entities_xml")
}

func FindLevelDirectory(assets *game.Assets, name string) (LevelDirectory, bool) {
	files, _ := assets.Archive.Glob(levelsPath("**", name, "levelinfo.xml"))
	if len(files) == 0 {
		return LevelDirectory{}, false

	}
	file := files[0]
	tokens := strings.Split(file.Path(), "/")
	tokens = tokens[1 : len(tokens)-1]
	return LevelDirectory{Name: path.Join(tokens...)}, true
}

func ListLevelDirectories(assets *game.Assets) []LevelDirectory {
	files, _ := assets.Archive.Glob(levelsPath("**", "levelinfo.xml"))
	result := make([]LevelDirectory, 0)
	for _, file := range files {
		// remove leading "levels/" and trailing "/levelinfo.xml"
		tokens := strings.Split(file.Path(), "/")
		tokens = tokens[1 : len(tokens)-1]
		result = append(result, LevelDirectory{Name: path.Join(tokens...)})
	}
	return result
}

func ListLevelEntries(assets *game.Assets) []LevelListEntry {
	result := make([]LevelListEntry, 0)
	for _, dir := range ListLevelDirectories(assets) {
		result = append(result, LevelListEntry{
			Name:           dir.Name,
			CoatlicueNames: dir.ListCoatlicueNames(assets),
		})
	}
	return result
}

var coatlicueRe = regexp.MustCompile(`/sharedassets/coatlicue/([0-9a-zA-Z_\-]+)/`)

func (dir *LevelDirectory) Exists(assets *game.Assets) bool {
	file, ok := assets.Archive.LookupBySuffix(dir.PathResourcelistTxt())
	return ok && file != nil
}

func (dir *LevelDirectory) ListCoatlicueNames(assets *game.Assets) []string {
	result := make([]string, 0)

	file, ok := assets.Archive.Lookup(dir.PathResourcelistTxt())
	if !ok {
		return result
	}

	content, err := file.Read()
	if err != nil {
		slog.Error("resourcelist not loaded", "level", dir.Name, "error", err)
		return result
	}

	seen := make(map[string]bool)
	scanner := bufio.NewScanner(bytes.NewReader(content))
	for scanner.Scan() {
		if match := coatlicueRe.FindSubmatch(scanner.Bytes()); len(match) > 1 {
			name := string(match[1])
			if !seen[name] {
				seen[name] = true
				result = append(result, name)
			}
		}
	}

	return result
}

func (dir *LevelDirectory) LoadMissionEntities(assets *game.Assets) []ViewerEntity {
	file, ok := assets.Archive.LookupBySuffix(dir.PathMissionEntitiesFile())
	if !ok || file == nil {
		return nil
	}

	slice, err := LoadViewerSlice(assets, file, "", nil)
	if err != nil {
		slog.Error("mission entities slice not loaded", "level", dir.Name, "error", err)
		return nil
	}

	return slice.Entities
}

func (dir *LevelDirectory) LoadMission(assets *game.Assets) *mission.Document {
	file, ok := assets.Archive.LookupBySuffix(dir.PathMissionFile())
	if !ok || file == nil {
		return nil
	}
	doc, err := mission.Load(file)
	if err != nil {
		slog.Error("mission file not loaded", "level", dir.Name, "error", err)
		return nil
	}
	return doc
}
