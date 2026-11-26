package adb_test

import (
	"nw-buddy/tools/formats/adb"
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestParse(t *testing.T) {
	data, err := os.ReadFile("sample/npc_sandworm_anims.adb")
	assert.NoError(t, err)

	doc, err := adb.Parse(data)
	assert.NoError(t, err)
	assert.NotNil(t, doc.FragmentList.ByName("Idle"))
	assert.NotNil(t, doc.FragmentList.ByName("r_R1_F"))
	assert.NotNil(t, doc.FragmentList.ByName("Attack_Slam"))
	assert.EqualValues(t, float32(0.2), doc.FragmentList.ByName("Attack_Slam")[0].BlendOutDuration)

}

func TestParseSequence(t *testing.T) {
	data, err := os.ReadFile("sample/npc_sandworm_anims.adb")
	assert.NoError(t, err)
	doc, err := adb.Parse(data)
	assert.NoError(t, err)

	idle := doc.FragmentList.ByName("Idle")[0].AnimLayer[0]
	assert.Len(t, idle.Sequence, 1)
	assert.True(t, idle.Sequence[0].Animation.HasFlag("loop"))
	assert.EqualValues(t, 1, idle.Sequence[0].Animation.Weight, "weight defaults to 1")
	assert.EqualValues(t, 1, idle.Sequence[0].Animation.Speed, "speed defaults to 1")

	spawn := doc.FragmentList.ByName("Spawn")[0].AnimLayer[0]
	assert.Len(t, spawn.Sequence, 3)
	assert.Equal(t, "baby_sandworm_submerge_loop", spawn.Sequence[0].Animation.Name)
	assert.False(t, spawn.Sequence[0].Animation.HasFlag("Loop"))
	assert.EqualValues(t, -1, spawn.Sequence[1].Blend.ExitTime)
	assert.True(t, spawn.Sequence[1].Animation.HasFlag("Loop"))
	assert.InDelta(t, 1.5333333, spawn.Sequence[2].Blend.ExitTime, 1e-6)
	assert.Equal(t, "", spawn.Sequence[2].Animation.Name, "an empty animation stops the layer")
	// the flat lists stay as before
	assert.Len(t, spawn.Blend, 3)
	assert.Len(t, spawn.Animation, 3)
}

func TestAnimationNames(t *testing.T) {
	doc, err := adb.Parse([]byte(`<AnimDB><FragmentList>
		<Idle><Fragment><AnimLayer><Animation name="Idle_A" flags="Loop"/></AnimLayer></Fragment></Idle>
		<Attack>
			<Fragment Tags="Bow"><AnimLayer><Animation name="atk_bow"/><Blend ExitTime="1"/><Animation name=""/></AnimLayer>
				<AnimLayer><Animation name="lhand_bow_pose"/></AnimLayer></Fragment>
			<Fragment><AnimLayer><Animation name="idle_a"/></AnimLayer></Fragment>
		</Attack>
	</FragmentList></AnimDB>`))
	assert.NoError(t, err)
	assert.Equal(t, []string{"idle_a", "atk_bow", "lhand_bow_pose"}, doc.AnimationNames())
}

func TestParseDefaults(t *testing.T) {
	doc, err := adb.Parse([]byte(`<AnimDB><FragmentList><Idle><Fragment><AnimLayer>
		<Animation name="a" speed="2"/><Blend ExitTime="1"/></AnimLayer></Fragment></Idle></FragmentList></AnimDB>`))
	assert.NoError(t, err)
	fragment := doc.FragmentList.ByName("Idle")[0]
	assert.InDelta(t, adb.DefaultBlendOutDuration, fragment.BlendOutDuration, 1e-6)
	layer := fragment.AnimLayer[0]
	assert.Len(t, layer.Sequence, 2)
	assert.Nil(t, layer.Sequence[0].Blend, "no blend before the first animation")
	assert.EqualValues(t, 2, layer.Sequence[0].Animation.Speed)
	assert.Nil(t, layer.Sequence[1].Animation, "a final blend without animation")
	assert.InDelta(t, adb.DefaultBlendDuration, layer.Sequence[1].Blend.Duration, 1e-6)
}
