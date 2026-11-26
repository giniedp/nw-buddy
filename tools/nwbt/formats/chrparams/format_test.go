package chrparams_test

import (
	"nw-buddy/tools/formats/chrparams"
	"nw-buddy/tools/nwfs"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestLoad(t *testing.T) {
	archive, err := nwfs.NewUnpackedArchive("sample")
	assert.NoError(t, err)

	file, ok := archive.Lookup("npc_skel.chrparams")
	assert.True(t, ok)

	doc, err := chrparams.Load(file)
	assert.NoError(t, err)

	assert.Len(t, doc.AnimationIncludePaths(), 2)
	assert.Len(t, doc.AnimationGlobPaths(), 93)
}

func writeFiles(t *testing.T, root string, files map[string]string) {
	t.Helper()
	for name, content := range files {
		file := filepath.Join(root, filepath.FromSlash(name))
		assert.NoError(t, os.MkdirAll(filepath.Dir(file), 0o755))
		assert.NoError(t, os.WriteFile(file, []byte(content), 0o644))
	}
}

func chrparamsXML(folder string, includes ...string) string {
	result := `<Params><AnimationList><Animation name="#filepath" path="` + folder + `"/><Animation name="*" path="*/*.caf"/>`
	for _, include := range includes {
		result += `<Animation name="$Include" path="` + include + `"/>`
	}
	return result + `</AnimationList></Params>`
}

// The game adds a list before the lists it includes, includes in reverse order, and the first file with a stem keeps it
func TestLoadAnimationListOrder(t *testing.T) {
	root := t.TempDir()
	writeFiles(t, root, map[string]string{
		"root.chrparams":        chrparamsXML("anims/root", "inc_a.chrparams", "inc_b.chrparams"),
		"inc_a.chrparams":       chrparamsXML("anims/a"),
		"inc_b.chrparams":       chrparamsXML("anims/b"),
		"anims/root/x/walk.caf": "",
		"anims/a/x/walk.caf":    "",
		"anims/a/x/run.caf":     "",
		"anims/a/x/jump.caf":    "",
		"anims/b/x/run.caf":     "",
		"anims/b/y/Idle.caf":    "",
		"anims/b/z/idle.caf":    "",
	})
	archive, err := nwfs.NewUnpackedArchive(root)
	assert.NoError(t, err)
	file, ok := archive.Lookup("root.chrparams")
	assert.True(t, ok)
	doc, err := chrparams.Load(file)
	assert.NoError(t, err)

	list, err := doc.LoadAnimationList(archive)
	assert.NoError(t, err)
	files := map[string]string{}
	order := []string{}
	for _, it := range list {
		files[strings.ToLower(it.Name)] = it.File
		order = append(order, strings.ToLower(it.Name))
	}
	assert.Equal(t, []string{"walk", "run", "idle", "jump"}, order)
	assert.Equal(t, "anims/root/x/walk.caf", files["walk"])
	assert.Equal(t, "anims/b/x/run.caf", files["run"])
	assert.Equal(t, "anims/b/y/idle.caf", files["idle"])
	assert.Equal(t, "anims/a/x/jump.caf", files["jump"])
}
