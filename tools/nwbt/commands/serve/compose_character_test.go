package serve

import (
	"bytes"
	"net/url"
	"nw-buddy/tools/formats/cdf"
	"nw-buddy/tools/formats/gltf/importer"
	"nw-buddy/tools/game"
	"nw-buddy/tools/utils/env"
	"nw-buddy/tools/utils/math"
	"nw-buddy/tools/utils/math/mat4"
	"path"
	"strings"
	"testing"

	qgltf "github.com/qmuntal/gltf"
	"github.com/stretchr/testify/require"
)

func TestFindSocket(t *testing.T) {
	bones := []cdf.Attachment{
		{AName: "no_bone"},
		{AName: "spear", BoneName: "Spine2"},
		{AName: "left_sword", BoneName: "Hips"},
	}
	for name, expected := range map[string]string{"left_sword": "left_sword", "right_sword": "left_sword", "bow": "spear", "": "spear"} {
		socket, ok := findSocket(bones, name)
		require.True(t, ok)
		require.Equal(t, expected, socket.AName, name)
	}
	_, ok := findSocket(bones[:1], "bow")
	require.False(t, ok)
}

func TestSocketOffset(t *testing.T) {
	// x first: y → z by the rotation about x, z → x by the one about y
	m := socketOffset([]float32{0, 0, 5}, []float32{90, 90, 0})
	require.InDeltaSlice(t, []float32{1, 0, 0}, m[4:7], 1e-5)
	require.Equal(t, []float32{0, 0, 5}, m[12:15])
	require.Equal(t, mat4.Identity(), socketOffset(nil, nil))
}

func composeAssets(t *testing.T) *game.Assets {
	if env.GameDir() == "" {
		t.Skip("NW_GAME is not set")
	}
	assets, err := game.InitPackedAssets(env.GameDir())
	require.NoError(t, err)
	return assets
}

func TestComposeModels(t *testing.T) {
	assets := composeAssets(t)
	base := math.GetBase(true)
	params := map[string]any{"DyeColorR": "1,0,0"}

	t.Run("character with material, params and an animation by name", func(t *testing.T) {
		model := "Objects/Characters/player/mounts/horseMountTraditional/horseMountTraditional.cdf"
		character, err := assets.LoadCdf("objects/characters/player/mounts/horsemounttraditional/horsemounttraditional.cdf")
		require.NoError(t, err)
		clips, err := CollectAnimations(assets, character)
		require.NoError(t, err)
		require.NotEmpty(t, clips)

		group, err := composeCharacter(assets, ComposeRequest{
			Model:      model,
			Material:   "Objects/Characters/player/mounts/horseMountTraditional/horseMountTraditional_matGroup.mtl",
			Params:     params,
			Animations: []importer.AnimationAsset{{Name: strings.ToUpper(clips[0].Name)}},
		}, base)
		require.NoError(t, err)
		require.NotEmpty(t, group.Geometries)
		for _, it := range group.Geometries {
			require.Equal(t, "1,0,0", it.MaterialParams["DyeColorR"])
			require.NotEmpty(t, it.MaterialFile)
		}
		require.Len(t, group.Animations, 1)
		require.Equal(t, clips[0].File, group.Animations[0].File)
	})

	t.Run("a mount variant has its material", func(t *testing.T) {
		// Mount_Horse_9, paths as the data has them
		group, err := composeCharacter(assets, ComposeRequest{
			Model:    `Objects\Characters\player\mounts\horseSaddle\horse_saddle.cdf`,
			Material: `Objects\Characters\player\mounts\horseSaddle\variantMaterials\Mount_Horse_pattern9_matGroup.mtl`,
		}, base)
		require.NoError(t, err)
		require.NotEmpty(t, group.Geometries)
		for _, it := range group.Geometries {
			require.Equal(t, "mount_horse_pattern9_matgroup.mtl", path.Base(it.MaterialFile))
		}
	})

	t.Run("the material wins over the attachments', with an overcoat", func(t *testing.T) {
		request := ComposeRequest{
			Model:    "objects/characters/npc/natural/boar_wild/boar.cdf",
			Material: "materials/vfx/misc/spectral_green.mtl",
			Overcoat: "materials/vfx/overcoat/spectral_overcoat.mtl",
		}
		group, err := composeCharacter(assets, request, base)
		require.NoError(t, err)
		require.NotEmpty(t, group.Geometries)
		for _, it := range group.Geometries {
			require.Equal(t, request.Material, it.MaterialFile)
			require.Equal(t, request.Overcoat, it.OvercoatFile)
		}
		// a material that does not exist is ignored
		request.Material = "materials/missing.mtl"
		group, err = composeCharacter(assets, request, base)
		require.NoError(t, err)
		for _, it := range group.Geometries {
			require.NotEqual(t, request.Material, it.MaterialFile)
			require.NotEqual(t, game.DEFAULT_MATERIAL, it.MaterialFile)
		}
	})

	t.Run("mesh alone with its material and a skeleton", func(t *testing.T) {
		group, err := composeCharacter(assets, ComposeRequest{
			Model:    "Objects/Characters/player/male/conquistadorT1/male_conquistadorT1_helmet.skin",
			Material: "Objects/Characters/player/male/conquistadorT1/male_conquistadorT1_helmet_matGroup.mtl",
			Params:   params,
			Skeleton: game.CHR_MODEL_MALE,
		}, base)
		require.NoError(t, err)
		require.Len(t, group.Geometries, 2)
		require.Equal(t, ".skin", path.Ext(group.Geometries[0].GeometryFile))
		require.Equal(t, "male_conquistadort1_helmet_matgroup.mtl", path.Base(group.Geometries[0].MaterialFile))
		require.Equal(t, "1,0,0", group.Geometries[0].MaterialParams["DyeColorR"])
		require.True(t, group.Geometries[1].SkipGeometry)
	})

	t.Run("character with weapons on sockets", func(t *testing.T) {
		shield := ComposeSocket{Name: "shieldattach", Models: []ComposeSocketModel{
			{Model: "objects/weapons/shields/kiteshieldwar/wep_mel_shld_1h_kiteshieldwar.cdf", Params: params},
		}}
		shield.Offset.Rotation = []float32{90, 0, 0}
		request := ComposeRequest{
			Model:   "objects/characters/player/male/player_male.cdf",
			Sockets: []ComposeSocket{shield, {Name: "left_sword"}},
		}
		plain, err := composeCharacter(assets, ComposeRequest{Model: request.Model}, base)
		require.NoError(t, err)
		group, err := composeCharacter(assets, request, base)
		require.NoError(t, err)
		require.Len(t, group.Geometries, len(plain.Geometries)+1)
		weapon := group.Geometries[len(plain.Geometries)]
		require.Equal(t, "Spine2", weapon.Joint)
		require.True(t, weapon.SkipSkin)
		require.Equal(t, "1,0,0", weapon.MaterialParams["DyeColorR"])

		// the weapon is below the joint, without and with animations (merged skeleton)
		for _, animations := range [][]importer.AnimationAsset{nil, {{Name: "unarmed_idle"}}} {
			request.Animations = animations
			group, err := composeCharacter(assets, request, base)
			require.NoError(t, err)
			data, err := convertGltf(assets, group, true, convertParams{
				assets: assets,
				target: ".glb",
				query:  url.Values{QUERY_YUP: {"true"}, QUERY_TEXTURES: {"none"}},
			})
			require.NoError(t, err)
			doc := qgltf.Document{}
			require.NoError(t, qgltf.NewDecoder(bytes.NewReader(data)).Decode(&doc))
			require.Equal(t, len(animations), len(doc.Animations))
			parents := 0
			for _, node := range doc.Nodes {
				for _, child := range node.Children {
					holder := doc.Nodes[child]
					if node.Name == "Spine2" && len(holder.Children) == 1 && holder.Children[0] != child {
						below := doc.Nodes[holder.Children[0]]
						if below.Mesh != nil || len(below.Children) > 0 && doc.Nodes[below.Children[0]].Mesh != nil {
							require.Nil(t, below.Skin)
							parents++
						}
					}
				}
			}
			require.Equal(t, 1, parents)
		}
	})

	t.Run("prefab slice", func(t *testing.T) {
		model := "slices/Housing/Items/Tests/HousingItemDefault.dynamicslice"
		if _, ok := assets.Archive.Lookup(strings.ToLower(model)); !ok {
			t.Skip("slice not found")
		}
		group, err := composeCharacter(assets, ComposeRequest{Model: model}, base)
		require.NoError(t, err)
		require.NotEmpty(t, group.Geometries)
	})

	t.Run("refuses no model and unknown kinds", func(t *testing.T) {
		_, err := composeCharacter(assets, ComposeRequest{}, base)
		require.Error(t, err)
		_, err = composeCharacter(assets, ComposeRequest{Model: "a/b.mtl"}, base)
		require.Error(t, err)
	})
}
