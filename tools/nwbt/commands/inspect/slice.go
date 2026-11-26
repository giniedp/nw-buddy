package inspect

import (
	"fmt"
	"io"
	"nw-buddy/tools/formats/mtl"
	"nw-buddy/tools/game"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/rtti/nwt"
	"nw-buddy/tools/utils"
	"text/tabwriter"
)

type SliceInspector struct {
	count                  int
	MeshComponent          map[string]int
	SkinnedMeshComponent   map[string]int
	InstancedMeshComponent map[string]int
	AoiComponent           map[string]int
	FogVolumeComponent     map[string]int
	GameRigidBodyComponent map[string]int
	LightComponent         map[string]int
	MeshMergerComponent    map[string]int
	RiverComponent         map[string]int
	RoadComponent          map[string]int
	SnowComponent          map[string]int
	SplineComponent        map[string]int
	TimeOfDayPOIComponent  map[string]int
	TimeOfDayShape         []string
	Materials              map[string]int
	LightInfos             map[string]map[string][]any
}

func NewSliceInspector() *SliceInspector {
	return &SliceInspector{
		MeshComponent:          make(map[string]int),
		SkinnedMeshComponent:   make(map[string]int),
		InstancedMeshComponent: make(map[string]int),
		AoiComponent:           make(map[string]int),
		FogVolumeComponent:     make(map[string]int),
		GameRigidBodyComponent: make(map[string]int),
		LightComponent:         make(map[string]int),
		MeshMergerComponent:    make(map[string]int),
		RiverComponent:         make(map[string]int),
		RoadComponent:          make(map[string]int),
		SnowComponent:          make(map[string]int),
		SplineComponent:        make(map[string]int),
		TimeOfDayPOIComponent:  make(map[string]int),
		TimeOfDayShape:         make([]string, 0),
		Materials:              make(map[string]int),
		LightInfos:             make(map[string]map[string][]any),
	}
}
func (it *SliceInspector) Inspect(assets *game.Assets, file nwfs.File) {
	it.count += 1

	f, err := assets.LoadSliceComponent(file)
	if err != nil {
		return
	}

	handleMaterial := func(asset nwt.AzAsset) {
		mf, _ := assets.LookupFileByAsset(asset)
		if mf == nil {
			return
		}
		mat, _ := mtl.Load(mf)
		if mat == nil {
			return
		}
		for _, m := range mat.Collection() {
			it.Materials[m.Shader] += 1
		}
	}

	for _, entity := range f.Entities.Element {
		var prev any = nil
		for _, component := range entity.Components.Element {

			switch v := component.(type) {
			case nwt.MeshComponent:
				options := v.Static_Mesh_Render_Node.Render_Options
				it.MeshComponent["Count"] += 1
				if v.Static_Mesh_Render_Node.Visible {
					it.MeshComponent["Visible"] += 1
				}
				if v.Load_Mesh_On_Activate {
					it.MeshComponent["Load_Mesh_On_Activate"] += 1
				}
				if options.VisibilityOccluder {
					it.MeshComponent["VisibilityOccluder"] += 1
				}
				if options.UseVisAreas {
					it.MeshComponent["UseVisAreas"] += 1
				}
				if options.ReceiveWind {
					it.MeshComponent["ReceiveWind"] += 1
				}
				if options.UseInProxyGeo {
					it.MeshComponent["UseInProxyGeo"] += 1
				}
				if options.UseManualViewDistance {
					it.MeshComponent["UseManualViewDistance"] += 1
				}
				handleMaterial(v.Static_Mesh_Render_Node.Material_Override_Asset)

			case nwt.InstancedMeshComponent:
				options := v.Instanced_Mesh_Render_Node.BaseClass1.Render_Options
				it.InstancedMeshComponent["Count"] += 1
				if options.VisibilityOccluder {
					it.InstancedMeshComponent["VisibilityOccluder"] += 1
				}
				if options.UseVisAreas {
					it.InstancedMeshComponent["UseVisAreas"] += 1
				}
				if options.ReceiveWind {
					it.InstancedMeshComponent["ReceiveWind"] += 1
				}
				if options.UseInProxyGeo {
					it.InstancedMeshComponent["UseInProxyGeo"] += 1
				}
				if options.UseManualViewDistance {
					it.InstancedMeshComponent["UseManualViewDistance"] += 1
				}
				handleMaterial(v.Instanced_Mesh_Render_Node.BaseClass1.Material_Override_Asset)

			case nwt.SkinnedMeshComponent:
				options := v.Skinned_Mesh_Render_Node.Render_Options
				it.SkinnedMeshComponent["Count"] += 1
				if v.Load_Mesh_On_Activate {
					it.SkinnedMeshComponent["Load_Mesh_On_Activate"] += 1
				}
				if options.UseVisAreas {
					it.SkinnedMeshComponent["UseVisAreas"] += 1
				}
				if options.NeverFrustumCull {
					it.SkinnedMeshComponent["NeverFrustumCull"] += 1
				}

			case nwt.AoiComponent:
				it.AoiComponent["Count"] += 1
				if v.M_useUserDefinedSpawnRadius {
					it.AoiComponent["M_useUserDefinedSpawnRadius"] += 1
				}
				if v.M_isStaticSlice {
					it.AoiComponent["M_isStaticSlice"] += 1
				}
				if v.M_overrideWithUserDefinedSpawnRadius {
					it.AoiComponent["M_overrideWithUserDefinedSpawnRadius"] += 1
				}
			case nwt.FogVolumeComponent:
				it.FogVolumeComponent["Count"] += 1
				if v.FogVolumeConfiguration.UseGlobalFogColor {
					it.FogVolumeComponent["UseGlobalFogColor"] += 1
				}
				if v.FogVolumeConfiguration.AffectsThisAreaOnly {
					it.FogVolumeComponent["AffectsThisAreaOnly"] += 1
				}
			case nwt.GameRigidBodyComponent:
				it.GameRigidBodyComponent["Count"] += 1
				if v.M_isDynamic {
					it.GameRigidBodyComponent["M_isDynamic"] += 1
				}
			case nwt.LightComponent:
				it.LightComponent["Count"] += 1
				config := v.LightConfiguration
				lightType := fmt.Sprintf("LightType%v", config.LightType)
				it.LightComponent[lightType] += 1
				if config.Ambient {
					it.LightComponent["Ambient"] += 1
				}
				if config.Deferred {
					it.LightComponent["Deferred"] += 1
				}
				if config.TerrainShadows {
					it.LightComponent["TerrainShadows"] += 1
				}
				if config.Visible {
					it.LightComponent["Visible"] += 1
				}

				it.pushLightProp(lightType, "AffectsThisAreaOnly", config.AffectsThisAreaOnly)
				it.pushLightProp(lightType, "Ambient", config.Ambient)
				it.pushLightProp(lightType, "AnimIndex", config.AnimIndex)
				it.pushLightProp(lightType, "AnimPhase", config.AnimPhase)
				it.pushLightProp(lightType, "AnimPhaseRandom", config.AnimPhaseRandom)
				it.pushLightProp(lightType, "AnimSpeed", config.AnimSpeed)
				it.pushLightProp(lightType, "AreaFOV", config.AreaFOV)
				it.pushLightProp(lightType, "AreaHeight", config.AreaHeight)
				it.pushLightProp(lightType, "AreaMaxDistance", config.AreaMaxDistance)
				it.pushLightProp(lightType, "AreaWidth", config.AreaWidth)
				it.pushLightProp(lightType, "Area_X_Y_Z", config.Area_X_Y_Z)
				it.pushLightProp(lightType, "AttenuationFalloffMax", config.AttenuationFalloffMax)
				it.pushLightProp(lightType, "BoxHeight", config.BoxHeight)
				it.pushLightProp(lightType, "BoxLength", config.BoxLength)
				it.pushLightProp(lightType, "BoxProject", config.BoxProject)
				it.pushLightProp(lightType, "BoxWidth", config.BoxWidth)
				it.pushLightProp(lightType, "CastShadowsSpec", config.CastShadowsSpec)
				it.pushLightProp(lightType, "Color", config.Color)
				it.pushLightProp(lightType, "CubemapResolution", config.CubemapResolution)
				it.pushLightProp(lightType, "CubemapTexture", config.CubemapTexture)
				it.pushLightProp(lightType, "Deferred", config.Deferred)
				it.pushLightProp(lightType, "DiffuseMultiplier", config.DiffuseMultiplier)
				it.pushLightProp(lightType, "IgnoreVisAreas", config.IgnoreVisAreas)
				it.pushLightProp(lightType, "IndoorOnly", config.IndoorOnly)
				it.pushLightProp(lightType, "LightType", config.LightType)
				it.pushLightProp(lightType, "MinimumSpec", config.MinimumSpec)
				it.pushLightProp(lightType, "OnInitially", config.OnInitially)
				it.pushLightProp(lightType, "PointAttenuationBulbSize", config.PointAttenuationBulbSize)
				it.pushLightProp(lightType, "PointMaxDistance", config.PointMaxDistance)
				it.pushLightProp(lightType, "ProjectorAttenuationBulbSize", config.ProjectorAttenuationBulbSize)
				it.pushLightProp(lightType, "ProjectorDistance", config.ProjectorDistance)
				it.pushLightProp(lightType, "ProjectorFOV", config.ProjectorFOV)
				it.pushLightProp(lightType, "ProjectorMaterial", config.ProjectorMaterial)
				it.pushLightProp(lightType, "ProjectorNearPlane", config.ProjectorNearPlane)
				it.pushLightProp(lightType, "ProjectorTexture", config.ProjectorTexture)
				it.pushLightProp(lightType, "ShadowBias", config.ShadowBias)
				it.pushLightProp(lightType, "ShadowMaxCameraDistance", config.ShadowMaxCameraDistance)
				it.pushLightProp(lightType, "ShadowResScale", config.ShadowResScale)
				it.pushLightProp(lightType, "ShadowSlopeBias", config.ShadowSlopeBias)
				it.pushLightProp(lightType, "ShadowUpdateMinRadius", config.ShadowUpdateMinRadius)
				it.pushLightProp(lightType, "ShadowUpdateRatio", config.ShadowUpdateRatio)
				it.pushLightProp(lightType, "SortPriority", config.SortPriority)
				it.pushLightProp(lightType, "SpecMultiplier", config.SpecMultiplier)
				it.pushLightProp(lightType, "TerrainShadows", config.TerrainShadows)
				it.pushLightProp(lightType, "TodInfluence", config.TodInfluence)
				it.pushLightProp(lightType, "ViewDistanceCap", config.ViewDistanceCap)
				it.pushLightProp(lightType, "ViewDistanceCapEnabled", config.ViewDistanceCapEnabled)
				it.pushLightProp(lightType, "ViewDistanceMultiplier", config.ViewDistanceMultiplier)
				it.pushLightProp(lightType, "Visible", config.Visible)
				it.pushLightProp(lightType, "VolumetricFog", config.VolumetricFog)
				it.pushLightProp(lightType, "VolumetricFogOnly", config.VolumetricFogOnly)
				it.pushLightProp(lightType, "VoxelGIMode", config.VoxelGIMode)
			// case nwt.MeshMergerComponent:
			// 	it.MeshMergerComponent["Count"] += 1
			case nwt.RiverComponent:
				it.RiverComponent["Count"] += 1
			case nwt.RoadComponent:
				it.RoadComponent["Count"] += 1
			case nwt.SnowComponent:
				it.SnowComponent["Count"] += 1
			case nwt.SplineComponent:
				it.SplineComponent["Count"] += 1
				config := v.Configuration
				splineType := fmt.Sprintf("SplineType%v", config.Spline_Type)
				it.SplineComponent[splineType] += 1
			case nwt.TimeOfDayPOIComponent:
				it.TimeOfDayPOIComponent["Count"] += 1
				if v.Configuration.HasTimeOfDayOverride {
					it.TimeOfDayPOIComponent["HasTimeOfDayOverride"] += 1
				}
				if prev != nil {
					it.TimeOfDayShape = utils.AppendUniq(it.TimeOfDayShape, fmt.Sprintf("%T", prev))
				}
			}
			prev = component
		}
	}

}

func (it *SliceInspector) Print(w io.Writer) {

	fmt.Fprintf(w, "Slices\t%d\n", it.count)

	tw := tabwriter.NewWriter(w, 0, 0, 1, ' ', 0)

	fmt.Fprintf(tw, "\nMeshComponent\n")
	for key, count := range it.MeshComponent {
		fmt.Fprintf(tw, "%s\t%d\n", key, count)
	}

	fmt.Fprintf(tw, "\nInstancedMeshComponent\n")
	for key, count := range it.InstancedMeshComponent {
		fmt.Fprintf(tw, "%s\t%d\n", key, count)
	}

	fmt.Fprintf(tw, "\nSkinnedMeshComponent\n")
	for key, count := range it.SkinnedMeshComponent {
		fmt.Fprintf(tw, "%s\t%d\n", key, count)
	}

	fmt.Fprintf(tw, "\nAoiComponent\n")
	for key, count := range it.AoiComponent {
		fmt.Fprintf(tw, "%s\t%d\n", key, count)
	}

	fmt.Fprintf(tw, "\nFogVolumeComponent\n")
	for key, count := range it.FogVolumeComponent {
		fmt.Fprintf(tw, "%s\t%d\n", key, count)
	}

	fmt.Fprintf(tw, "\nGameRigidBodyComponent\n")
	for key, count := range it.GameRigidBodyComponent {
		fmt.Fprintf(tw, "%s\t%d\n", key, count)
	}

	fmt.Fprintf(tw, "\nLightComponent\n")
	for key, count := range it.LightComponent {
		fmt.Fprintf(tw, "%s\t%d\n", key, count)
	}

	fmt.Fprintf(tw, "\nMeshMergerComponent\n")
	for key, count := range it.MeshMergerComponent {
		fmt.Fprintf(tw, "%s\t%d\n", key, count)
	}

	fmt.Fprintf(tw, "\nRiverComponent\n")
	for key, count := range it.RiverComponent {
		fmt.Fprintf(tw, "%s\t%d\n", key, count)
	}

	fmt.Fprintf(tw, "\nRoadComponent\n")
	for key, count := range it.RoadComponent {
		fmt.Fprintf(tw, "%s\t%d\n", key, count)
	}

	fmt.Fprintf(tw, "\nSnowComponent\n")
	for key, count := range it.SnowComponent {
		fmt.Fprintf(tw, "%s\t%d\n", key, count)
	}

	fmt.Fprintf(tw, "\nSplineComponent\n")
	for key, count := range it.SplineComponent {
		fmt.Fprintf(tw, "%s\t%d\n", key, count)
	}

	fmt.Fprintf(tw, "\nTimeOfDayPOIComponent\n")
	for key, count := range it.TimeOfDayPOIComponent {
		fmt.Fprintf(tw, "%s\t%d\n", key, count)
	}

	fmt.Fprintf(tw, "\nTimeOfDayShape\n")
	for _, shape := range it.TimeOfDayShape {
		fmt.Fprintf(tw, "%s\n", shape)
	}

	fmt.Fprintf(tw, "\nMaterials\n")
	for key, count := range it.Materials {
		fmt.Fprintf(tw, "%s\t%d\n", key, count)
	}

	fmt.Fprintf(tw, "\nLights\n")
	for key, data := range it.LightInfos {
		fmt.Fprintf(tw, "%s\n", key)
		for prop, values := range data {
			fmt.Fprintf(tw, "\t%s\t%v\n", prop, values)
		}
	}
	tw.Flush()

}

func (it *SliceInspector) pushLightProp(t string, prop string, value any) {
	if it.LightInfos[t] == nil {
		it.LightInfos[t] = make(map[string][]any)
	}
	it.LightInfos[t][prop] = utils.AppendUniq(it.LightInfos[t][prop], value)
}

// light types in lumberyard
//
// enum class LightType : AZ::u32
// {
//     Point = 0,  ///> Omni-directional point light
//     Area,       ///> Area/box light
//     Projector,  ///> Texture projector light
//     Probe,      ///> Environment probe
// };

// light defaults in lumberyard
//
// LightConfiguration::LightConfiguration()
//   : m_lightType(LightType::Point)
//   , m_visible(true)
//   , m_onInitially(true)
//   , m_pointMaxDistance(2.f)
//   , m_pointAttenuationBulbSize(0.05f)
//   , m_areaMaxDistance(2.f)
//   , m_areaWidth(5.f)
//   , m_areaHeight(5.f)
//   , m_areaFOV(45.0f)
//   , m_projectorAttenuationBulbSize(0.05f)
//   , m_projectorRange(5.f)
//   , m_projectorFOV(90.f)
//   , m_projectorNearPlane(0)
//   , m_probeSortPriority(0)
//   , m_probeArea(20.0f, 20.0f, 20.0f)
//   , m_probeCubemapResolution(ResolutionSetting::ResDefault)
//   , m_isBoxProjected(false)
//   , m_boxWidth(20.0f)
//   , m_boxHeight(20.0f)
//   , m_boxLength(20.0f)
//   , m_attenFalloffMax(0.3f)
//   , m_probeFade(1.0f)
//   , m_minSpec(EngineSpec::Low)
//   , m_viewDistMultiplier(1.f)
//   , m_castShadowsSpec(EngineSpec::Never)
//   , m_voxelGIMode(IRenderNode::VM_None)
//   , m_color(1.f, 1.f, 1.f, 1.f)
//   , m_diffuseMultiplier(1.f)
//   , m_specMultiplier(1.f)
//   , m_affectsThisAreaOnly(true)
//   , m_useVisAreas(true)
//   , m_volumetricFog(true)
//   , m_volumetricFogOnly(false)
//   , m_indoorOnly(false)
//   , m_ambient(false)
//   , m_deferred(true)
//   , m_animIndex(0)
//   , m_animSpeed(1.f)
//   , m_animPhase(0.f)
//   , m_castTerrainShadows(false)
//   , m_shadowBias(1.f)
//   , m_shadowSlopeBias(1.f)
//   , m_shadowResScale(1.f)
//   , m_shadowUpdateMinRadius(10.f)
//   , m_shadowUpdateRatio(1.f)
//   , m_cubemapId(AZ::Uuid::Create())
// {
// }
