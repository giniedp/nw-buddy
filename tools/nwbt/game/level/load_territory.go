package level

import (
	"log/slog"
	"nw-buddy/tools/formats/vshapec"
	"nw-buddy/tools/game"
	"nw-buddy/tools/rtti/nwt"
	"path"
	"strconv"
	"strings"
	"sync"
)

const TerritoryComponentName = "Territory"
const PrefabReferencerComponentName = "PrefabReferencer"

// ViewerTerritoryComponent is a territory, zone or POI area (TerritoryDataProviderComponent) with its polygon prism.
// The shape is in entity space. Audio fields come from the territory and POI definition datasheets,
// e.g. AudioGroup "MX_Territory" with AudioState "Brightwoods", or AudioGroup "POI_State" with AudioState "castle_dracula".
type ViewerTerritoryComponent struct {
	Type        string       `json:"type"` // Territory
	TerritoryID string       `json:"territoryId"`
	Shape       *ViewerShape `json:"shape"`
	AudioGroup  string       `json:"audioGroup,omitempty"`
	AudioState  string       `json:"audioState,omitempty"`
}

// ViewerPrefabReferencerComponent lists slices that the entity references without spawning them itself,
// e.g. the territory master slice referencing the zone and POI bounds slices
type ViewerPrefabReferencerComponent struct {
	Type   string           `json:"type"` // PrefabReferencer
	Slices []AssetReference `json:"slices"`
}

// LoadViewerTerritory reads the territory id and its polygon prism, nil if the entity is not a territory area
func LoadViewerTerritory(assets *game.Assets, entity *nwt.AZ__Entity) *ViewerTerritoryComponent {
	var territoryId string
	var prism *nwt.PolygonPrismShapeComponent
	for _, component := range entity.Components.Element {
		switch v := component.(type) {
		case nwt.TerritoryDataProviderComponent:
			territoryId = string(v.Territory_Id)
		case nwt.PolygonPrismShapeComponent:
			prism = &v
		}
	}
	if territoryId == "" || prism == nil {
		return nil
	}

	shape := findLmbrShape(entity)
	// the polygon may live in a .vshapec asset instead of the inline vertex container
	if file, err := assets.LookupFileByAssetId(prism.Polygon_Shape_Asset_Id); err == nil && file != nil && path.Ext(file.Path()) == ".vshapec" {
		if record, err := vshapec.Load(file); err == nil && len(record.Vertices) >= 3 {
			vertices := make([][2]float32, 0, len(record.Vertices))
			for _, v := range record.Vertices {
				vertices = append(vertices, [2]float32{v[0], v[1]})
			}
			height := float32(0)
			if shape != nil {
				height = shape.Height
			}
			shape = &ViewerShape{Kind: "prism", Height: height, Vertices: vertices}
		} else if err != nil {
			slog.Warn("polygon shape asset not loaded", "file", file.Path(), "err", err)
		}
	}
	if shape == nil || shape.Kind != "prism" {
		return nil
	}

	result := &ViewerTerritoryComponent{
		Type:        TerritoryComponentName,
		TerritoryID: territoryId,
		Shape:       shape,
	}
	if id, err := strconv.Atoi(strings.TrimSpace(territoryId)); err == nil {
		if audio, ok := loadTerritoryAudio(assets)[id]; ok {
			result.AudioGroup = audio.group
			result.AudioState = audio.state
		}
	}
	return result
}

type territoryAudio struct {
	group string
	state string
}

var territoryAudioCache sync.Map // *game.Assets → map[int]territoryAudio

const territoryDefinitionsFile = "sharedassets/springboardentitites/datatables/javelindata_territorydefinitions.datasheet"
const poiDefinitionsGlob = "sharedassets/springboardentitites/datatables/pointofinterestdefinitions/*.datasheet"

// loadTerritoryAudio maps territory and POI ids (one id space) to their audio group and state
func loadTerritoryAudio(assets *game.Assets) map[int]territoryAudio {
	if cached, ok := territoryAudioCache.Load(assets); ok {
		return cached.(map[int]territoryAudio)
	}
	result := make(map[int]territoryAudio)
	files, _ := assets.Archive.Glob(poiDefinitionsGlob)
	if file, ok := assets.Archive.Lookup(territoryDefinitionsFile); ok {
		files = append(files, file)
	}
	for _, file := range files {
		sheet, err := assets.LoadDatasheet(file)
		if err != nil || sheet == nil {
			slog.Warn("territory datasheet not loaded", "file", file.Path(), "err", err)
			continue
		}
		for _, row := range sheet.RowsAsJSON() {
			state := row.GetString("AudioState")
			if state == "" {
				continue
			}
			result[row.GetInt("TerritoryID")] = territoryAudio{
				group: row.GetString("AudioGroup"),
				state: state,
			}
		}
	}
	territoryAudioCache.Store(assets, result)
	return result
}
