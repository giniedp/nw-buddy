// Package slicemodel collects the models of a slice and of everything it spawns, for glTF exports.
package slicemodel

import (
	"log/slog"
	"nw-buddy/tools/formats/gltf/importer"
	"nw-buddy/tools/game"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/rtti/nwt"
	"nw-buddy/tools/utils/math"
	"nw-buddy/tools/utils/math/mat4"
	"path"
)

type Options struct {
	// Root places the slice, identity when nil
	Root *mat4.Data
	// Convert turns a world transform into the target space, math.CryToGltfMat4 when nil
	Convert func(mat4.Data) mat4.Data
	// KeepSkin keeps the skin of skinned meshes, else they are static in their bind pose
	KeepSkin bool
	// Overcoats adds the overcoat materials of the mesh components
	Overcoats bool
	// Keep decides whether a model at a world transform is collected, all when nil
	Keep func(world mat4.Data, model string) bool
	// Exclude skips an entity: its components and its spawns, not its child entities
	Exclude func(node *game.SliceNode) bool
	// Visit receives every component that is neither a mesh nor a spawner, e.g. lights
	Visit func(node *game.SliceNode, component any, world mat4.Data, group *importer.AssetGroup)
}

// Collect adds the models of the slice file and of its spawns to group
func Collect(assets *game.Assets, file nwfs.File, options Options, group *importer.AssetGroup) {
	c := collector{assets: assets, options: options, group: group}
	if c.options.Convert == nil {
		c.options.Convert = math.CryToGltfMat4
	}
	assets.WalkSlice(file, c.visit)
}

type collector struct {
	assets  *game.Assets
	options Options
	group   *importer.AssetGroup
}

func (c *collector) world(transform mat4.Data) mat4.Data {
	if c.options.Root == nil {
		return transform
	}
	return mat4.Multiply(*c.options.Root, transform)
}

func (c *collector) keeps(world mat4.Data, model string) bool {
	return c.options.Keep == nil || c.options.Keep(world, model)
}

func (c *collector) add(name string, world mat4.Data, model string, material string, overcoat string, skinned bool) {
	c.group.Geometries = append(c.group.Geometries, importer.GeometryAsset{
		Entity: importer.Entity{
			Name:      name,
			Transform: c.options.Convert(world),
		},
		GeometryFile: model,
		MaterialFile: material,
		OvercoatFile: overcoat,
		SkipSkin:     skinned && !c.options.KeepSkin,
	})
}

func (c *collector) visit(node *game.SliceNode) {
	if c.options.Exclude != nil && c.options.Exclude(node) {
		return
	}
	name := string(node.Entity.Name)
	world := c.world(node.Transform)
	for _, component := range node.Components {
		switch v := component.(type) {
		case nwt.InstancedMeshComponent:
			meshNode := v.Instanced_Mesh_Render_Node.BaseClass1
			if game.ShouldIgnoreMeshNode(meshNode) {
				continue
			}
			model, material := c.lookup(meshNode.Static_Mesh, meshNode.Material_Override_Asset)
			if model == "" {
				continue
			}
			model, material = c.assets.ResolveCgfAndMtl(model, material)
			overcoat := c.overcoat(meshNode.Material_Overcoat_Asset)
			for _, instance := range v.Instanced_Mesh_Render_Node.Instance_Transforms.Element {
				instanceWorld := mat4.Multiply(world, mat4.FromAzTransform(instance))
				if c.keeps(instanceWorld, model) {
					c.add(name, instanceWorld, model, material, overcoat, false)
				}
			}
		case nwt.MeshComponent:
			meshNode := v.Static_Mesh_Render_Node
			if game.ShouldIgnoreMeshNode(meshNode) {
				continue
			}
			model, material := c.lookup(meshNode.Static_Mesh, meshNode.Material_Override_Asset)
			if model == "" {
				continue
			}
			model, material = c.assets.ResolveCgfAndMtl(model, material)
			if c.keeps(world, model) {
				c.add(name, world, model, material, c.overcoat(meshNode.Material_Overcoat_Asset), false)
			}
		case nwt.SkinnedMeshComponent:
			meshNode := v.Skinned_Mesh_Render_Node
			if !meshNode.Visible {
				continue
			}
			model, material := c.lookup(meshNode.Skinned_Mesh, meshNode.Material_Override_Asset)
			if model == "" || !c.keeps(world, model) {
				continue
			}
			c.addSkinned(name, world, model, material, c.overcoat(meshNode.Material_Overcoat_Asset))
		case nwt.SpawnerComponent:
			if facet, ok := v.BaseClass1.M_serverFacetPtr.(nwt.SpawnerComponentServerFacet); ok {
				walkFirst(node, facet.M_aliasAsset, facet.M_sliceAsset)
			}
		case nwt.PrefabSpawnerComponent:
			walkFirst(node, v.M_aliasAsset, v.M_sliceAsset)
		case nwt.PointSpawnerComponent:
			walkFirst(node, v.BaseClass1.M_aliasAsset, v.BaseClass1.M_sliceAsset)
		case nwt.AreaSpawnerComponent:
			facet, ok := v.BaseClass1.M_serverFacetPtr.(nwt.AreaSpawnerComponentServerFacet)
			if !ok {
				continue
			}
			for _, location := range facet.M_locations.Element {
				if transform, ok := node.LocationTransform(location); ok {
					node.WalkAt(transform, func() {
						walkFirst(node, facet.M_aliasAsset, facet.M_sliceAsset)
					})
				}
			}
		case nwt.EncounterManagerComponent:
			for _, spawn := range game.WalkEncounterSpawns(node.Slice, v.M_stages.Element) {
				walk := func() {
					walkFirst(node, spawn.M_aliasAsset, spawn.M_sliceAsset)
				}
				locations := game.EncounterSpawnLocations(node, spawn)
				if len(locations) == 0 && spawn.M_count > 0 {
					walk()
				}
				for _, location := range locations {
					if transform, ok := node.LocationTransform(location); ok {
						node.WalkAt(transform, walk)
					}
				}
			}
		default:
			if c.options.Visit != nil {
				c.options.Visit(node, component, world, c.group)
			}
		}
	}
}

// addSkinned adds a skinned model: the skin and cloth parts of a character definition, or the model itself
func (c *collector) addSkinned(name string, world mat4.Data, model string, material string, overcoat string) {
	if path.Ext(model) != ".cdf" {
		if model, material = c.assets.ResolveCgfAndMtl(model, material); model != "" {
			c.add(name, world, model, material, overcoat, true)
		}
		return
	}
	cdf, err := c.assets.LoadCdf(model)
	if err != nil {
		slog.Warn("skip unresolved cdf file", "file", model, "err", err)
		return
	}
	for _, attachment := range cdf.SkinAndClothAttachments() {
		// an outline shell without its own material would render with the body material
		if attachment.Material == "" && attachment.AName == "outline" {
			continue
		}
		if part, mtl := c.assets.ResolveCgfAndMtl(attachment.Binding, attachment.Material, material); part != "" {
			c.add(attachment.AName, world, part, mtl, overcoat, true)
		}
	}
}

// lookup returns the file paths of a model and its material override, empty for a missing model
func (c *collector) lookup(modelAsset nwt.AzAsset, materialAsset nwt.AzAsset) (string, string) {
	modelFile, err := c.assets.LookupFileByAsset(modelAsset)
	if err != nil {
		slog.Warn("skip missing model", "err", err)
		return "", ""
	}
	if modelFile == nil {
		return "", ""
	}
	material := ""
	materialFile, err := c.assets.LookupFileByAsset(materialAsset)
	if err != nil {
		slog.Warn("ignore model material", "err", err)
	}
	if materialFile != nil {
		material = materialFile.Path()
	}
	return modelFile.Path(), material
}

// overcoat returns the file path of an overcoat material, empty without one
func (c *collector) overcoat(asset nwt.AzAsset) string {
	if !c.options.Overcoats {
		return ""
	}
	if file, err := c.assets.LookupFileByAsset(asset); err == nil && file != nil {
		return file.Path()
	}
	return ""
}

// walkFirst walks the alias of a spawner, else its slice
func walkFirst(node *game.SliceNode, alias nwt.AzAsset, slice nwt.AzAsset) {
	if !node.WalkAsset(alias) {
		node.WalkAsset(slice)
	}
}
