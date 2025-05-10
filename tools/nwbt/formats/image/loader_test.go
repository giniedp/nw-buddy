package image_test

import (
	"nw-buddy/tools/formats/image"
	"nw-buddy/tools/nwfs"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestLoadImage(t *testing.T) {
	archive, err := nwfs.NewUnpackedArchive("./../dds/sample/fs")
	require.NoError(t, err)

	loader := image.NewLoader(archive)
	require.NotNil(t, loader)

	file, err := loader.ResolveFile("male_alchemist_calves_ddna.dds")
	require.NoError(t, err)
	require.Equal(t, "male_alchemist_calves_ddna.dds", file.Path())

	file, err = loader.ResolveFile("male_alchemist_calves_ddna.dds.a")
	require.NoError(t, err)
	require.Equal(t, "male_alchemist_calves_ddna.dds.a", file.Path())

	img1, err := loader.LoadImage("male_alchemist_calves_ddna.dds")
	require.NoError(t, err)
	require.NotNil(t, img1)
	require.NotNil(t, img1.Data)
	require.NotNil(t, img1.Alpha)

	img2, err := loader.LoadImage("male_alchemist_calves_ddna.dds.a")
	require.NoError(t, err)
	require.NotNil(t, img2)
	require.NotNil(t, img2.Data)
	require.NotNil(t, img2.Alpha)

	require.EqualValues(t, img1.Data, img2.Data)
	require.EqualValues(t, img1.Alpha, img2.Alpha)
	require.EqualValues(t, img1.Source, img2.Source)
}
