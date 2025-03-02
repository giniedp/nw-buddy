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
