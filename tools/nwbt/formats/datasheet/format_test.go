package datasheet_test

import (
	"nw-buddy/tools/formats/datasheet"
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestParse(t *testing.T) {
	data, err := os.ReadFile("samples/javelindata_itemdefinitions_master_seasonalserver.datasheet")
	assert.NoError(t, err)
	sheet, err := datasheet.Parse(data)
	assert.NoError(t, err)
	assert.Equal(t, 198, len(sheet.Rows))
	assert.Equal(t, 118, len(sheet.Cols))
	json, err := sheet.ToJSON("", "\t")
	assert.NoError(t, err)
	os.WriteFile("samples/javelindata_itemdefinitions_master_seasonalserver.json", json, 0644)
}
