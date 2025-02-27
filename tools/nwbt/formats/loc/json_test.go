package loc_test

import (
	"nw-buddy/tools/formats/loc"
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestToJSON(t *testing.T) {
	data, err := os.ReadFile("samples/sample.loc.xml")
	assert.NoError(t, err, "Reading sample file")

	doc, err := loc.Parse(data)
	assert.NoError(t, err, "Parsing sample file")

	assert.Equal(t, doc.Entries[0].Key, "dialogue_continue")
	assert.Equal(t, doc.Entries[0].Value, "Fortfahren")

	assert.Equal(t, doc.Entries[2].Key, "01_SoleSurvivor_title")
	assert.Equal(t, doc.Entries[2].Value, "Einziger Überlebender")

	json, err := doc.ToJSON("", "  ")
	assert.NoError(t, err, "Converting to JSON")

	err = os.WriteFile("samples/sample.loc.json", json, 0644)
	assert.NoError(t, err, "Writing JSON file")
}
