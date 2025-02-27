package catalog_test

import (
	"nw-buddy/tools/formats/catalog"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/env"
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestParse(t *testing.T) {
	fs, err := nwfs.NewPakFS(env.GameDir())
	assert.NoError(t, err)

	file, ok := fs.Lookup("assetcatalog.catalog")
	assert.True(t, ok)

	doc, err := catalog.Load(file)
	assert.NoError(t, err)

	data, err := utils.MarshalJSON(doc, "", "\t")
	assert.NoError(t, err)

	os.WriteFile("assetcatalog.json", data, 0644)
}
