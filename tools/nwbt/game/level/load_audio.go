package level

import (
	"encoding/base64"
	"hash/crc32"
	"nw-buddy/tools/game"
	"nw-buddy/tools/rtti/nwt"
	"nw-buddy/tools/utils/math/mat4"
	"strings"
)

const AudioTriggerComponentName = "AudioTrigger"

// ViewerAudioTriggerComponent is an ATL audio emitter (AudioTriggerComponent) with the preloads it needs.
// When FollowShape is set, the emitter follows the closest point on Shape or Spline (entity space) to the listener.
type ViewerAudioTriggerComponent struct {
	Type             string `json:"type"` // AudioTrigger
	PlayTrigger      string `json:"playTrigger"`
	StopTrigger      string `json:"stopTrigger,omitempty"`
	PlaysImmediately bool   `json:"playsImmediately"`
	// ATL preload names of AudioPreloadComponents on the entity
	Preloads []string `json:"preloads,omitempty"`
	// the emitter follows the closest point on Shape or Spline (AudioShapeComponent or the splinefollow script)
	FollowShape bool          `json:"followShape,omitempty"`
	Shape       *ViewerShape  `json:"shape,omitempty"`
	Spline      *ViewerSpline `json:"spline,omitempty"`
}

// splinefollow.lua moves its Follower entity to the point of its Spline entity nearest to the player
const splineFollowScriptGuid = "95abd2ee-2d5d-528c-9ed9-310ae9c12b53"

var (
	scriptPropertyFollower = nwt.AzUInt64(3117812038) // crc32 of "follower"
	scriptPropertySpline   = nwt.AzUInt64(905336297)  // crc32 of "spline"
)

// audioFollowers maps follower entity ids to the spline they follow, in follower entity space
type audioFollowers map[nwt.AzUInt64]*ViewerSpline

// collectAudioFollowers resolves the splinefollow scripts of a slice (waterfalls): the script names a follower
// entity (the audio trigger) and a spline entity, the follower is moved along the spline towards the player
func collectAudioFollowers(slice *nwt.SliceComponent) audioFollowers {
	result := make(audioFollowers)
	entities := make(map[nwt.AzUInt64]*nwt.AZ__Entity, len(slice.Entities.Element))
	for i := range slice.Entities.Element {
		entities[slice.Entities.Element[i].Id.Id] = &slice.Entities.Element[i]
	}
	for _, entity := range slice.Entities.Element {
		for _, component := range entity.Components.Element {
			script, ok := component.(nwt.AzFramework__ScriptComponent)
			if !ok || !strings.EqualFold(string(script.Script.Guid), splineFollowScriptGuid) {
				continue
			}
			followerId := scriptEntityProperty(script, scriptPropertyFollower)
			splineId := scriptEntityProperty(script, scriptPropertySpline)
			follower := entities[followerId]
			splineEntity := entities[splineId]
			if follower == nil || splineEntity == nil {
				continue
			}
			var spline *nwt.SplineComponent
			for _, c := range splineEntity.Components.Element {
				if v, ok := c.(nwt.SplineComponent); ok {
					spline = &v
					break
				}
			}
			if spline == nil {
				continue
			}
			local := loadViewerSpline(spline)
			if len(local.Vertices) < 2 {
				continue
			}
			// spline entity space → slice space → follower entity space
			toFollower, ok := invertAffine(game.FindEntityTransformMat4(follower))
			if !ok {
				continue
			}
			m := mat4.Multiply(toFollower, game.FindEntityTransformMat4(splineEntity))
			result[followerId] = &ViewerSpline{
				Type:     "Linear",
				Closed:   local.Closed,
				Vertices: transformPoints(m, local.Vertices),
			}
		}
	}
	return result
}

// scriptEntityProperty returns the entity id of a script property (an EntityId generic class value)
func scriptEntityProperty(script nwt.AzFramework__ScriptComponent, nameCrc nwt.AzUInt64) nwt.AzUInt64 {
	for _, prop := range script.Properties.Properties.Element {
		generic, ok := prop.(nwt.AzFramework__ScriptPropertyGenericClass)
		if !ok || generic.BaseClass1.Id != nameCrc {
			continue
		}
		if id, ok := generic.Value.M_data.(nwt.EntityId); ok {
			return id.Id
		}
	}
	return 0
}

// LoadViewerAudioTrigger reads the audio trigger of the entity, nil if it has none with a play trigger
func LoadViewerAudioTrigger(entity *nwt.AZ__Entity, followers audioFollowers) *ViewerAudioTriggerComponent {
	var trigger *nwt.AudioTriggerComponent
	var spline *nwt.SplineComponent
	preloads := make([]string, 0)
	followShape := false
	for _, component := range entity.Components.Element {
		switch v := component.(type) {
		case nwt.AudioTriggerComponent:
			if trigger == nil && v.Play_Trigger != "" {
				trigger = &v
			}
		case nwt.AudioPreloadComponent:
			if v.Preload_Name != "" {
				preloads = append(preloads, string(v.Preload_Name))
			}
		case nwt.AudioShapeComponent:
			followShape = true
		case nwt.SplineComponent:
			spline = &v
		}
	}
	if trigger == nil {
		return nil
	}
	result := &ViewerAudioTriggerComponent{
		Type:             AudioTriggerComponentName,
		PlayTrigger:      string(trigger.Play_Trigger),
		StopTrigger:      string(trigger.Stop_Trigger),
		PlaysImmediately: bool(trigger.Plays_Immediately),
	}
	if len(preloads) > 0 {
		result.Preloads = preloads
	}
	if follow := followers[entity.Id.Id]; follow != nil {
		result.FollowShape = true
		result.Spline = follow
		return result
	}
	if followShape {
		result.FollowShape = true
		result.Shape = findLmbrShape(entity)
		if spline != nil {
			s := loadViewerSpline(spline)
			if len(s.Vertices) >= 2 {
				result.Spline = &s
			}
		}
	}
	return result
}

func transformPoints(m mat4.Data, points [][3]float32) [][3]float32 {
	result := make([][3]float32, len(points))
	for i, p := range points {
		result[i] = [3]float32{
			m[0]*p[0] + m[4]*p[1] + m[8]*p[2] + m[12],
			m[1]*p[0] + m[5]*p[1] + m[9]*p[2] + m[13],
			m[2]*p[0] + m[6]*p[1] + m[10]*p[2] + m[14],
		}
	}
	return result
}

// invertAffine inverts a column major affine transform (rotation, scale, translation)
func invertAffine(m mat4.Data) (mat4.Data, bool) {
	a, b, c := m[0], m[4], m[8]
	d, e, f := m[1], m[5], m[9]
	g, h, i := m[2], m[6], m[10]
	det := a*(e*i-f*h) - b*(d*i-f*g) + c*(d*h-e*g)
	if det == 0 {
		return mat4.Identity(), false
	}
	inv := 1 / det
	// inverse of the 3x3 part, row major r[row][col]
	r00, r01, r02 := (e*i-f*h)*inv, (c*h-b*i)*inv, (b*f-c*e)*inv
	r10, r11, r12 := (f*g-d*i)*inv, (a*i-c*g)*inv, (c*d-a*f)*inv
	r20, r21, r22 := (d*h-e*g)*inv, (b*g-a*h)*inv, (a*e-b*d)*inv
	tx, ty, tz := m[12], m[13], m[14]
	return mat4.Data{
		r00, r10, r20, 0,
		r01, r11, r21, 0,
		r02, r12, r22, 0,
		-(r00*tx + r01*ty + r02*tz), -(r10*tx + r11*ty + r12*tz), -(r20*tx + r21*ty + r22*tz), 1,
	}, true
}

const AudioAmbienceComponentName = "AudioAmbience"
const AudioAreaComponentName = "AudioArea"

// dungeon_amb_soundbank_loader.lua: loads a preload and plays "Play_<eventName>" on the player while active
const ambienceLoaderScriptGuid = "a4278520-451f-5be2-90a0-03283e4ad6bb"

// dungeon_audio.lua: trigger area that sets ambience / music states, switches and rtpcs on enter and exit
const audioAreaScriptGuid = "db7a3178-0d30-5de0-9b40-b34c31046d35"

// ViewerAudioAmbienceComponent is a listener ambience bed of an instance (dungeon, trial), e.g. QuadAmb_Dungeon_CutlassKeys
type ViewerAudioAmbienceComponent struct {
	Type        string `json:"type"` // AudioAmbience
	PlayTrigger string `json:"playTrigger"`
	StopTrigger string `json:"stopTrigger"`
	Preload     string `json:"preload,omitempty"`
}

// ViewerAudioAreaComponent is a trigger area (entity space shape) that sets audio states while the listener is inside
type ViewerAudioAreaComponent struct {
	Type   string       `json:"type"` // AudioArea
	Shape  *ViewerShape `json:"shape"`
	Values struct {
		// starts the instance music on activation (OnDungeon_Started)
		StartMusic        bool   `json:"startMusic,omitempty"`
		IsArena           bool   `json:"isArena,omitempty"`
		DungeonName       string `json:"dungeonName,omitempty"`
		MusicGroup        string `json:"musicGroup,omitempty"`
		AmbientGroup      string `json:"ambientGroup,omitempty"`
		SwitchName        string `json:"switchName,omitempty"`
		RtpcName          string `json:"rtpcName,omitempty"`
		EnterMusicState   string `json:"enterMusicState,omitempty"`
		EnterAmbientState string `json:"enterAmbientState,omitempty"`
		EnterSwitchValue  string `json:"enterSwitchValue,omitempty"`
		EnterRtpcValue    string `json:"enterRtpcValue,omitempty"`
		ExitMusicState    string `json:"exitMusicState,omitempty"`
		ExitAmbientState  string `json:"exitAmbientState,omitempty"`
		ExitSwitchValue   string `json:"exitSwitchValue,omitempty"`
		ExitRtpcValue     string `json:"exitRtpcValue,omitempty"`
	} `json:"values"`
}

// scriptProperties reads string and boolean script properties keyed by the crc32 of the lower cased name
type scriptProperties struct {
	strings map[nwt.AzUInt64]string
	bools   map[nwt.AzUInt64]bool
}

func readScriptProperties(script nwt.AzFramework__ScriptComponent) scriptProperties {
	result := scriptProperties{strings: map[nwt.AzUInt64]string{}, bools: map[nwt.AzUInt64]bool{}}
	for _, prop := range script.Properties.Properties.Element {
		switch v := prop.(type) {
		case nwt.AzFramework__ScriptPropertyString:
			result.strings[v.BaseClass1.Id] = decodeScriptString(string(v.Value))
		case nwt.AzFramework__ScriptPropertyBoolean:
			result.bools[v.BaseClass1.Id] = bool(v.Value)
		}
	}
	return result
}

// decodeScriptString decodes script string properties, they are stored base64 encoded in the slices
func decodeScriptString(value string) string {
	decoded, err := base64.StdEncoding.DecodeString(value)
	if err != nil || len(decoded) == 0 {
		return value
	}
	for _, c := range decoded {
		if c < 0x20 || c > 0x7e {
			return value
		}
	}
	return string(decoded)
}

func (p scriptProperties) str(name string) string {
	return p.strings[nwt.AzUInt64(crc32.ChecksumIEEE([]byte(strings.ToLower(name))))]
}

func (p scriptProperties) flag(name string) bool {
	return p.bools[nwt.AzUInt64(crc32.ChecksumIEEE([]byte(strings.ToLower(name))))]
}

// LoadViewerAudioScripts reads the instance audio scripts of an entity (ambience loaders and audio areas)
func LoadViewerAudioScripts(entity *nwt.AZ__Entity) []any {
	result := make([]any, 0)
	for _, component := range entity.Components.Element {
		script, ok := component.(nwt.AzFramework__ScriptComponent)
		if !ok {
			continue
		}
		switch strings.ToLower(string(script.Script.Guid)) {
		case ambienceLoaderScriptGuid:
			props := readScriptProperties(script)
			event := props.str("eventName")
			if event == "" {
				continue
			}
			result = append(result, ViewerAudioAmbienceComponent{
				Type:        AudioAmbienceComponentName,
				PlayTrigger: "Play_" + event,
				StopTrigger: "Stop_" + event,
				Preload:     props.str("bankName"),
			})
		case audioAreaScriptGuid:
			props := readScriptProperties(script)
			area := ViewerAudioAreaComponent{Type: AudioAreaComponentName, Shape: findLmbrShape(entity)}
			v := &area.Values
			v.StartMusic = props.flag("startMusic")
			v.IsArena = props.flag("isArena")
			v.DungeonName = props.str("dungeon_name")
			v.MusicGroup = props.str("Music_group")
			v.AmbientGroup = props.str("Ambient_group")
			v.SwitchName = props.str("Switch_name")
			v.RtpcName = props.str("RTPC_name")
			v.EnterMusicState = props.str("enter_Music_state")
			v.EnterAmbientState = props.str("enter_Ambient_state")
			v.EnterSwitchValue = props.str("enter_Switch_value")
			v.EnterRtpcValue = props.str("enter_RTPC_value")
			v.ExitMusicState = props.str("exit_Music_state")
			v.ExitAmbientState = props.str("exit_Ambient_state")
			v.ExitSwitchValue = props.str("exit_Switch_value")
			v.ExitRtpcValue = props.str("exit_RTPC_value")
			result = append(result, area)
		}
	}
	return result
}
