<AnimDB FragDef="Animations/Mannequin/ADB/NPC_Monster/Sandworm_Family/Sandworm_Actions.xml" TagDef="Animations/Mannequin/ADB/NPC_Monster/Sandworm_Family/Sandworm_Tags.xml">
 <FragmentList>
  <Idle>
   <Fragment BlendOutDuration="0.2" Tags="Season_02">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="baby_sandworm_submerge_loop" flags="Loop"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="DisableCollision" contextType="DisableCollisionContext">
      <ProceduralParams>
       <ModifyStaticCollision value="true"/>
       <ModifyActorCollision value="true"/>
       <ModifyPlayerToPlayerCollision value="false"/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Invulnerability" contextType="InvulnerabilityContext">
      <ProceduralParams>
       <ShowImmuneOnHit value="true"/>
       <ImmuneText value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.30000001" CurveType="0"/>
     <Procedural type="HideAttachment" contextType="">
      <ProceduralParams>
       <AttachmentName value="sandworm_mesh"/>
       <ForceVisibleOnExit value="true"/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Named" contextType="NamedContext">
      <ProceduralParams>
       <Name value="Nameplate_Off"/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
   </Fragment>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.5" CurveType="0"/>
     <Animation name="sandworm_idle_fast" flags="Loop"/>
    </AnimLayer>
   </Fragment>
  </Idle>
  <Combat_Idle>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.5" CurveType="0"/>
     <Animation name="sandworm_idle_fast" flags="Loop"/>
    </AnimLayer>
    <ProcLayer />
   </Fragment>
  </Combat_Idle>
  <Move>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="sandworm_prototype_v002" flags="Loop"/>
    </AnimLayer>
   </Fragment>
  </Move>
  <r_R1_F>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Animation name="corruptiontendril_r_r0"/>
    </AnimLayer>
   </Fragment>
  </r_R1_F>
  <r_R1_B>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Animation name="corruptiontendril_r_r0"/>
    </AnimLayer>
   </Fragment>
  </r_R1_B>
  <r_R1_L>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Animation name="corruptiontendril_r_r0"/>
    </AnimLayer>
   </Fragment>
  </r_R1_L>
  <r_R1_R>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Animation name="sandworm_glimpse"/>
    </AnimLayer>
   </Fragment>
  </r_R1_R>
  <r_Death_F>
   <Fragment BlendOutDuration="0.2" Tags="Season_02">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="sandworm_death"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Named" contextType="NamedContext">
      <ProceduralParams>
       <Name value="Aura_Off"/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="true"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="true"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="0.2"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="15"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="true"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value=""/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="2.3333333" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
   </Fragment>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="sandworm_death"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Named" contextType="NamedContext">
      <ProceduralParams>
       <Name value="Aura_Off"/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="true"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="true"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="0.2"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="15"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="true"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value="Selected_Pos"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="2.3333333" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
   </Fragment>
  </r_Death_F>
  <r_Death_B>
   <Fragment BlendOutDuration="0.2" Tags="Season_02">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="sandworm_death"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Named" contextType="NamedContext">
      <ProceduralParams>
       <Name value="Aura_Off"/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="true"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="true"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="0.2"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="15"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="true"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value=""/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="2.3333333" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
   </Fragment>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="sandworm_death"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Named" contextType="NamedContext">
      <ProceduralParams>
       <Name value="Aura_Off"/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="true"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="true"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="0.2"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="15"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="true"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value="Selected_Pos"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="2.3333333" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
   </Fragment>
  </r_Death_B>
  <Alert>
   <Fragment BlendOutDuration="0.2" Tags="Season_02">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="baby_sandworm_submerge_end"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Named" contextType="NamedContext">
      <ProceduralParams>
       <Name value="Nameplate_On"/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0.22499999" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Sandworm_BodySweep_L"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeSphere"/>
       <MeleeAttackShapeRadius value="6"/>
       <MeleeAttackCapsuleHalfHeight value="0"/>
       <MeleeAttackBoxDimensionsX value="17"/>
       <MeleeAttackBoxDimensionsY value="2"/>
       <MeleeAttackBoxDimensionsZ value="10"/>
       <JointName value=""/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="0"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="0"/>
       <AmmoSlotForScaling value="PaperdollSlotTypes::HEAD_SLOT"/>
       <ShapeAxesModifierCommands value=""/>
       <DisableLOSCheck value="false"/>
       <UseEndAsCenter value="false"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.34999999" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="true"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="false"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="1080"/>
       <Radius value="20"/>
       <MaxAngle value="180"/>
       <Height value="5"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="true"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value=""/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.16666667" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
     <Blend ExitTime="0.55833334" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="true"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="true"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="0.2"/>
       <Radius value="20"/>
       <MaxAngle value="180"/>
       <Height value="5"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="true"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value=""/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="2.7416668" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
   </Fragment>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="sandworm_idle_slow" flags="Loop"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="false"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="true"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="false"/>
       <TurnRate value="0.050000001"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="5"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="true"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
   </Fragment>
  </Alert>
  <Spawn>
   <Fragment BlendOutDuration="0.2" Tags="Season_02">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="baby_sandworm_submerge_loop"/>
     <Blend ExitTime="-1" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="baby_sandworm_submerge_loop" flags="Loop"/>
     <Blend ExitTime="1.5333333" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name=""/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="DisableCollision" contextType="DisableCollisionContext">
      <ProceduralParams>
       <ModifyStaticCollision value="true"/>
       <ModifyActorCollision value="true"/>
       <ModifyPlayerToPlayerCollision value="false"/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Invulnerability" contextType="InvulnerabilityContext">
      <ProceduralParams>
       <ShowImmuneOnHit value="true"/>
       <ImmuneText value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.30000001" CurveType="0"/>
     <Procedural type="HideAttachment" contextType="">
      <ProceduralParams>
       <AttachmentName value="sandworm_mesh"/>
       <ForceVisibleOnExit value="true"/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0.15000001" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Named" contextType="NamedContext">
      <ProceduralParams>
       <Name value="Nameplate_Off"/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="true"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="true"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="1080"/>
       <Radius value="20"/>
       <MaxAngle value="180"/>
       <Height value="5"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="true"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="true"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value=""/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.57499999" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
     <Blend ExitTime="0.15000004" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="true"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="true"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="1080"/>
       <Radius value="20"/>
       <MaxAngle value="180"/>
       <Height value="5"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="true"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="true"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value=""/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.57500005" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
   </Fragment>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.016894549" CurveType="0"/>
     <Animation name="sandworm_hide_loop" flags="Loop"/>
     <Blend ExitTime="13.8" StartTime="0" Duration="0" CurveType="0"/>
     <Animation name="sandworm_spawn"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="13.8" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="SpawnSlice" contextType="">
      <ProceduralParams>
       <SliceToSpawn value="slices/Arenas/Events/Sandworm/Phase3/Sandworm_ArenaEncounter_WormPellet_Projectile_Targets_Rapid_Master.dynamicslice"/>
       <DespawnOnExit value="false"/>
       <SliceDestructionCageAction value=""/>
       <UseAreaSpawner value="true"/>
       <SpawnOnClientsOnly value="false"/>
       <CanBeDisabledByEmoteFxSettings value="false"/>
       <TargetPosBlackboardKey value=""/>
       <SpawnCount value="1"/>
       <SpawnLocationOverrideIndex value="2"/>
       <Condition value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="DisableCollision" contextType="DisableCollisionContext">
      <ProceduralParams>
       <ModifyStaticCollision value="true"/>
       <ModifyActorCollision value="true"/>
       <ModifyPlayerToPlayerCollision value="false"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="13.8" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Invulnerability" contextType="InvulnerabilityContext">
      <ProceduralParams>
       <ShowImmuneOnHit value="false"/>
       <ImmuneText value=""/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="13.8" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="13.8" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Named" contextType="NamedContext">
      <ProceduralParams>
       <Name value="Nameplate_On"/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="13.8" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="SpawnSlice" contextType="">
      <ProceduralParams>
       <SliceToSpawn value="slices/Arenas/Events/Sandworm/Phase3/Sandworm_ArenaEncounter_Emerge_Explosion_AOE.dynamicslice"/>
       <DespawnOnExit value="false"/>
       <SliceDestructionCageAction value=""/>
       <UseAreaSpawner value="true"/>
       <SpawnOnClientsOnly value="false"/>
       <CanBeDisabledByEmoteFxSettings value="false"/>
       <TargetPosBlackboardKey value=""/>
       <SpawnCount value="1"/>
       <SpawnLocationOverrideIndex value="2"/>
       <Condition value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="13.8" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Named" contextType="NamedContext">
      <ProceduralParams>
       <Name value="Aura_On"/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
   </Fragment>
  </Spawn>
  <Attack_Slam>
   <Fragment BlendOutDuration="0.2" Tags="Dryad">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="corruptiontendril_slam_01"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="true"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="false"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="600"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="5"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="true"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value=""/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.56666666" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="true"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="false"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="600"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="5"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="true"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value=""/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.83333331" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="1.3666667" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Attack_Slam"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_spline_i"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="-90"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value="y z x"/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="false"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.16666663" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="1.3666667" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Attack_Slam"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_spline_l"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="-90"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value="y z x"/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="false"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.16666663" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="1.3666667" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Attack_Slam"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_hook"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="-90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="-90"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value="y z x"/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="true"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.16666663" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="1.3666667" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Attack_Slam"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_spline_f"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="-90"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value="y z x"/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="false"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.16666663" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="1.4333333" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Attack_Slam"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="1"/>
       <OffsetZ value="1"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="0.5"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="Xform"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="-90"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value=""/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="true"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.10000002" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
   </Fragment>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="sandworm_body_slam"/>
    </AnimLayer>
   </Fragment>
  </Attack_Slam>
  <Attack_BarbStrike>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="corruptiontendril_barb_strike_01"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="true"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="false"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="600"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="5"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="true"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value=""/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.33333334" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="false"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="false"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="400"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="5"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="false"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value=""/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.63333333" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0.96666664" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Attack_Barb_Strike"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_hook"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="-90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="0"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value=""/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="true"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.19999999" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0.96666664" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Attack_Barb_Strike"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="-1.5"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_hook"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="-90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="0"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value=""/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="true"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.19999999" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="1.0666667" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Attack_Barb_Strike"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_spline_k"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="-90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="0"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value=""/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="true"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.099999905" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="1.0666667" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Attack_Barb_Strike"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="-1.5"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_spline_k"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="-90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="0"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value=""/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="true"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.099999905" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
   </Fragment>
  </Attack_BarbStrike>
  <Attack_SweepL>
   <Fragment BlendOutDuration="0.2" Tags="Dryad">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="corruptiontendril_sweep_l_01"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="true"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="false"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="400"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="5"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="true"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value=""/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.53333336" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="1.0666667" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Attack_Slam"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_hook"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="-90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="-90"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value=""/>
       <DisableLOSCheck value="false"/>
       <UseEndAsCenter value="true"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.13333321" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="1.8" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk2"/>
       <DamageTableRow value="Attack_Sweep"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_hook"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="-90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="-90"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value="y z x"/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="true"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.29999995" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="1.8" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk2"/>
       <DamageTableRow value="Attack_Sweep"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="1.5"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_hook"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="-90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="-90"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value="y z x"/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="true"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.16666675" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="1.9666667" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk2"/>
       <DamageTableRow value="Attack_Sweep"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="1.5"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_hook"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="-90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="-90"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value="y z x"/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="true"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.066666603" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="2.0333333" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk2"/>
       <DamageTableRow value="Attack_Sweep"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="1.5"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_hook"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="-90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="-90"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value="y z x"/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="true"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.10000014" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="2.0333333" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-CastSpell" contextType="CastSpellContext">
      <ProceduralParams>
       <SpellName value="Dryad_Tendril_Sweep_Pools"/>
       <takeDurability value="false"/>
       <AIAimAtTarget value="true"/>
       <AILeadTarget value="false"/>
       <ProjectileSpeed value="100"/>
       <HitScanPredictionSpeed value="100"/>
       <AIMissMinDistance value="0.5"/>
       <AIMissMaxDistance value="1"/>
       <AILeadTargetMaxAngle value="10"/>
       <AIAimMaxAngle value="45"/>
       <Condition value=""/>
       <AITrackMinionSpawns value="false"/>
       <AIRandomlySelectTargets value="false"/>
       <UseAllAvailableTargets value="true"/>
       <AITargetOffsetInMeters>
        <Element value="0"/>
        <Element value="0"/>
        <Element value="0"/>
       </AITargetOffsetInMeters>
       <AIUseTargetFacingForOffset value="false"/>
       <BeamEntryName value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
   </Fragment>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="corruptiontendril_sweep_l_01"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="true"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="false"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="400"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="5"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="true"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value=""/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.53333336" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="1.0666667" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Attack_Slam"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_hook"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="-90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="-90"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value=""/>
       <DisableLOSCheck value="false"/>
       <UseEndAsCenter value="true"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.13333321" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="1.8" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk2"/>
       <DamageTableRow value="Attack_Sweep"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_hook"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="-90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="-90"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value="y z x"/>
       <DisableLOSCheck value="false"/>
       <UseEndAsCenter value="true"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.29999995" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="1.8" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk2"/>
       <DamageTableRow value="Attack_Sweep"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="1.5"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_hook"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="-90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="-90"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value="y z x"/>
       <DisableLOSCheck value="false"/>
       <UseEndAsCenter value="true"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.16666675" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="1.9666667" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk2"/>
       <DamageTableRow value="Attack_Sweep"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="1.5"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_hook"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="-90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="-90"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value="y z x"/>
       <DisableLOSCheck value="false"/>
       <UseEndAsCenter value="true"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.066666603" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="2.0333333" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk2"/>
       <DamageTableRow value="Attack_Sweep"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="1.5"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_hook"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="-90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="-90"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value="y z x"/>
       <DisableLOSCheck value="false"/>
       <UseEndAsCenter value="true"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.10000014" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
   </Fragment>
  </Attack_SweepL>
  <Attack_SweepR>
   <Fragment BlendOutDuration="0.2" Tags="Dryad">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="corruptiontendril_sweep_r_01"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="true"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="false"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="400"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="5"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="true"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value=""/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.53333336" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="1.0333333" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Attack_Slam"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_hook"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="-90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="-90"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value="y z x"/>
       <DisableLOSCheck value="false"/>
       <UseEndAsCenter value="true"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.13333333" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="1.7666667" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk2"/>
       <DamageTableRow value="Attack_Sweep"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_hook"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="-90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="-90"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value="y z x"/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="true"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.4000001" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="1.7666667" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk2"/>
       <DamageTableRow value="Attack_Sweep"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="-1.5"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_hook"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="-90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="-90"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value="y z x"/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="true"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.16666663" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="1.9333333" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk2"/>
       <DamageTableRow value="Attack_Sweep"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="-1.5"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_hook"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="-90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="-90"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value="y z x"/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="true"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.10000002" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="2.0333333" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk2"/>
       <DamageTableRow value="Attack_Sweep"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="-2"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_hook"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="-90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="0"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value=""/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="true"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.099999905" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="2.0333333" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-CastSpell" contextType="CastSpellContext">
      <ProceduralParams>
       <SpellName value="Dryad_Tendril_Sweep_Pools"/>
       <takeDurability value="false"/>
       <AIAimAtTarget value="true"/>
       <AILeadTarget value="false"/>
       <ProjectileSpeed value="100"/>
       <HitScanPredictionSpeed value="100"/>
       <AIMissMinDistance value="0.5"/>
       <AIMissMaxDistance value="1"/>
       <AILeadTargetMaxAngle value="10"/>
       <AIAimMaxAngle value="45"/>
       <Condition value=""/>
       <AITrackMinionSpawns value="false"/>
       <AIRandomlySelectTargets value="false"/>
       <UseAllAvailableTargets value="true"/>
       <AITargetOffsetInMeters>
        <Element value="0"/>
        <Element value="0"/>
        <Element value="0"/>
       </AITargetOffsetInMeters>
       <AIUseTargetFacingForOffset value="false"/>
       <BeamEntryName value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
   </Fragment>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="corruptiontendril_sweep_r_01"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="true"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="false"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="400"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="5"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="true"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value=""/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.53333336" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="1.0333333" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Attack_Slam"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_hook"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="-90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="-90"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value="y z x"/>
       <DisableLOSCheck value="false"/>
       <UseEndAsCenter value="true"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.13333333" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="1.7666667" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk2"/>
       <DamageTableRow value="Attack_Sweep"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_hook"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="-90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="-90"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value="y z x"/>
       <DisableLOSCheck value="false"/>
       <UseEndAsCenter value="true"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.4000001" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="1.7666667" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk2"/>
       <DamageTableRow value="Attack_Sweep"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="-1.5"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_hook"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="-90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="-90"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value="y z x"/>
       <DisableLOSCheck value="false"/>
       <UseEndAsCenter value="true"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.16666663" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="1.9333333" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk2"/>
       <DamageTableRow value="Attack_Sweep"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="-1.5"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_hook"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="-90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="-90"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value="y z x"/>
       <DisableLOSCheck value="false"/>
       <UseEndAsCenter value="true"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.10000002" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="2.0333333" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk2"/>
       <DamageTableRow value="Attack_Sweep"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="-2"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_hook"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="-90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="0"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value=""/>
       <DisableLOSCheck value="false"/>
       <UseEndAsCenter value="true"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.099999905" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
   </Fragment>
  </Attack_SweepR>
  <Attack_BurrowStrike>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="corruptiontendril_burrow_strike_intro"/>
     <Blend ExitTime="-1" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="corruptiontendril_burrow_strike_loop" flags="Loop"/>
     <Blend ExitTime="1" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="corruptiontendril_burrow_strike_outro"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="true"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="false"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="400"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="5"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="true"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value=""/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.56666666" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="1.3333334" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-CastSpell" contextType="CastSpellContext">
      <ProceduralParams>
       <SpellName value="Tendril_Burrow_Strike"/>
       <takeDurability value="true"/>
       <AIAimAtTarget value="true"/>
       <AILeadTarget value="true"/>
       <ProjectileSpeed value="40"/>
       <HitScanPredictionSpeed value="40"/>
       <AIMissMinDistance value="0.5"/>
       <AIMissMaxDistance value="1"/>
       <AILeadTargetMaxAngle value="10"/>
       <AIAimMaxAngle value="45"/>
       <Condition value=""/>
       <AITrackMinionSpawns value="false"/>
       <AIRandomlySelectTargets value="false"/>
       <UseAllAvailableTargets value="true"/>
       <AITargetOffsetInMeters>
        <Element value="0"/>
        <Element value="0"/>
        <Element value="0"/>
       </AITargetOffsetInMeters>
       <AIUseTargetFacingForOffset value="false"/>
       <BeamEntryName value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
   </Fragment>
  </Attack_BurrowStrike>
  <Attack_OozeFling>
   <Fragment BlendOutDuration="0.2" Tags="Dryad">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="corruptiontendril_ooze_fling_01"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="1.7" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-RangedAttack" contextType="RangedAttackContext">
      <ProceduralParams>
       <RangedAttackName value="Basic"/>
       <ChargeValue value="0"/>
       <DamageTableRow value="Attack_OozeFling"/>
       <FireJoint value="bind_hook"/>
       <PosOffset>
        <Element value="0"/>
        <Element value="0"/>
        <Element value="0"/>
       </PosOffset>
       <RotOffset>
        <Element value="0"/>
        <Element value="0"/>
        <Element value="0"/>
       </RotOffset>
       <UseJointTransformForOffsets value="false"/>
       <AccuracyBonus value="0"/>
       <SliceOverride value="slices/characters/spellslices/sandworm/sandworm_acid_ball.dynamicslice"/>
       <ForwardSpawnInfo value="false"/>
       <UseAmmo value="false"/>
       <AIAimAtTarget value="true"/>
       <AIUseSelectedPositionAction value="false"/>
       <AILeadTarget value="false"/>
       <ProjectileSpeed value="0.001"/>
       <HitScanPredictionSpeed value="0.001"/>
       <AimJoint value="aim_direction"/>
       <AIMissMinDistance value="0.5"/>
       <AIMissMaxDistance value="1"/>
       <AILeadTargetMaxAngle value="10"/>
       <AIAimMaxAngle value="45"/>
       <AIRandomlySelectTargets value="false"/>
       <AIUseAllAvailableTargets value="true"/>
       <AIUseTargetGroundPos value="false"/>
       <AIAddTargetOffset value="true"/>
       <AITargetOffset>
        <Element value="0"/>
        <Element value="0"/>
        <Element value="-0.25"/>
       </AITargetOffset>
       <AIUseTargetFacingForOffset value="false"/>
       <Condition value=""/>
       <UseForwardFiringOffset value="false"/>
       <ForwardRotOffset>
        <Element value="0"/>
        <Element value="0"/>
        <Element value="0"/>
       </ForwardRotOffset>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0.1" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="true"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="false"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="600"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="5"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="true"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value=""/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.46666667" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="true"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="false"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="400"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="5"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="true"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value=""/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="1.1333334" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
   </Fragment>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="sandworm_acid_ball_intro"/>
     <Blend ExitTime="-1" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="sandworm_acid_ball_loop"/>
     <Blend ExitTime="1.6000001" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="sandworm_acid_ball_outro"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="3" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-RangedAttack" contextType="RangedAttackContext">
      <ProceduralParams>
       <RangedAttackName value="Basic"/>
       <ChargeValue value="0"/>
       <DamageTableRow value="Attack_OozeFling"/>
       <FireJoint value="bind_hook"/>
       <PosOffset>
        <Element value="0"/>
        <Element value="0"/>
        <Element value="0"/>
       </PosOffset>
       <RotOffset>
        <Element value="0"/>
        <Element value="0"/>
        <Element value="0"/>
       </RotOffset>
       <UseJointTransformForOffsets value="true"/>
       <AccuracyBonus value="0"/>
       <SliceOverride value="slices/items/weapons/ai/tendril_ooze_ball.dynamicslice"/>
       <ForwardSpawnInfo value="false"/>
       <UseAmmo value="false"/>
       <AIAimAtTarget value="true"/>
       <AIUseSelectedPositionAction value="false"/>
       <AILeadTarget value="true"/>
       <ProjectileSpeed value="50"/>
       <HitScanPredictionSpeed value="50"/>
       <AimJoint value="aim_direction"/>
       <AIMissMinDistance value="0"/>
       <AIMissMaxDistance value="0.5"/>
       <AILeadTargetMaxAngle value="60"/>
       <AIAimMaxAngle value="90"/>
       <AIRandomlySelectTargets value="false"/>
       <AIUseAllAvailableTargets value="true"/>
       <AIUseTargetGroundPos value="false"/>
       <AIAddTargetOffset value="true"/>
       <AITargetOffset>
        <Element value="0"/>
        <Element value="0"/>
        <Element value="-0.25"/>
       </AITargetOffset>
       <AIUseTargetFacingForOffset value="false"/>
       <Condition value=""/>
       <UseForwardFiringOffset value="false"/>
       <ForwardRotOffset>
        <Element value="0"/>
        <Element value="0"/>
        <Element value="0"/>
       </ForwardRotOffset>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0.1" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="true"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="false"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="600"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="5"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="true"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value=""/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.46666667" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="true"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="false"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="400"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="5"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="true"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value=""/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="1.1333334" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
   </Fragment>
  </Attack_OozeFling>
  <Dazed>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="sandworm_victory"/>
     <Blend ExitTime="-1" StartTime="0" Duration="0" CurveType="0"/>
     <Animation name="corruptiontendril_burrow_stun_loop" flags="Loop"/>
    </AnimLayer>
   </Fragment>
  </Dazed>
  <Dazed_End>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="corruptiontendril_burrow_stun_outro"/>
    </AnimLayer>
   </Fragment>
  </Dazed_End>
  <r_Death>
   <Fragment BlendOutDuration="0.2" Tags="Season_02">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="sandworm_death"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Named" contextType="NamedContext">
      <ProceduralParams>
       <Name value="Aura_Off"/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="true"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="true"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="0.2"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="15"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="true"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value=""/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="2.3333333" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
   </Fragment>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="sandworm_death"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Named" contextType="NamedContext">
      <ProceduralParams>
       <Name value="Aura_Off"/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="true"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="true"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="0.2"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="15"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="true"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value="Selected_Pos"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="2.3333333" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
   </Fragment>
  </r_Death>
  <Attack_BurrowStrike_2x>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="corruptiontendril_burrow_strike_intro"/>
     <Blend ExitTime="-1" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="corruptiontendril_burrow_strike_loop" flags="Loop"/>
     <Blend ExitTime="2.3333333" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="corruptiontendril_burrow_strike_outro"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="true"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="false"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="400"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="5"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="true"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value=""/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.56666666" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="1.3333334" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-CastSpell" contextType="CastSpellContext">
      <ProceduralParams>
       <SpellName value="Tendril_Burrow_Strike"/>
       <takeDurability value="true"/>
       <AIAimAtTarget value="true"/>
       <AILeadTarget value="true"/>
       <ProjectileSpeed value="40"/>
       <HitScanPredictionSpeed value="40"/>
       <AIMissMinDistance value="0.5"/>
       <AIMissMaxDistance value="1"/>
       <AILeadTargetMaxAngle value="10"/>
       <AIAimMaxAngle value="45"/>
       <Condition value=""/>
       <AITrackMinionSpawns value="false"/>
       <AIRandomlySelectTargets value="false"/>
       <UseAllAvailableTargets value="true"/>
       <AITargetOffsetInMeters>
        <Element value="0"/>
        <Element value="0"/>
        <Element value="0"/>
       </AITargetOffsetInMeters>
       <AIUseTargetFacingForOffset value="false"/>
       <BeamEntryName value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="2.8" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-CastSpell" contextType="CastSpellContext">
      <ProceduralParams>
       <SpellName value="Tendril_Burrow_Strike"/>
       <takeDurability value="true"/>
       <AIAimAtTarget value="true"/>
       <AILeadTarget value="true"/>
       <ProjectileSpeed value="40"/>
       <HitScanPredictionSpeed value="40"/>
       <AIMissMinDistance value="0.5"/>
       <AIMissMaxDistance value="1"/>
       <AILeadTargetMaxAngle value="10"/>
       <AIAimMaxAngle value="45"/>
       <Condition value=""/>
       <AITrackMinionSpawns value="false"/>
       <AIRandomlySelectTargets value="false"/>
       <UseAllAvailableTargets value="true"/>
       <AITargetOffsetInMeters>
        <Element value="0"/>
        <Element value="0"/>
        <Element value="0"/>
       </AITargetOffsetInMeters>
       <AIUseTargetFacingForOffset value="false"/>
       <BeamEntryName value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
   </Fragment>
  </Attack_BurrowStrike_2x>
  <Attack_BurrowStrike_3x>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="corruptiontendril_burrow_strike_intro"/>
     <Blend ExitTime="-1" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="corruptiontendril_burrow_strike_loop" flags="Loop"/>
     <Blend ExitTime="3.3333335" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="corruptiontendril_burrow_strike_outro"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="true"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="false"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="400"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="5"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="true"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value=""/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.56666666" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="1.4666667" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-CastSpell" contextType="CastSpellContext">
      <ProceduralParams>
       <SpellName value="Tendril_Burrow_Strike"/>
       <takeDurability value="true"/>
       <AIAimAtTarget value="true"/>
       <AILeadTarget value="true"/>
       <ProjectileSpeed value="40"/>
       <HitScanPredictionSpeed value="40"/>
       <AIMissMinDistance value="0.5"/>
       <AIMissMaxDistance value="1"/>
       <AILeadTargetMaxAngle value="10"/>
       <AIAimMaxAngle value="45"/>
       <Condition value=""/>
       <AITrackMinionSpawns value="false"/>
       <AIRandomlySelectTargets value="false"/>
       <UseAllAvailableTargets value="true"/>
       <AITargetOffsetInMeters>
        <Element value="0"/>
        <Element value="0"/>
        <Element value="0"/>
       </AITargetOffsetInMeters>
       <AIUseTargetFacingForOffset value="false"/>
       <BeamEntryName value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="2.8" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-CastSpell" contextType="CastSpellContext">
      <ProceduralParams>
       <SpellName value="Tendril_Burrow_Strike"/>
       <takeDurability value="true"/>
       <AIAimAtTarget value="true"/>
       <AILeadTarget value="true"/>
       <ProjectileSpeed value="40"/>
       <HitScanPredictionSpeed value="40"/>
       <AIMissMinDistance value="0.5"/>
       <AIMissMaxDistance value="1"/>
       <AILeadTargetMaxAngle value="10"/>
       <AIAimMaxAngle value="45"/>
       <Condition value=""/>
       <AITrackMinionSpawns value="false"/>
       <AIRandomlySelectTargets value="false"/>
       <UseAllAvailableTargets value="true"/>
       <AITargetOffsetInMeters>
        <Element value="0"/>
        <Element value="0"/>
        <Element value="0"/>
       </AITargetOffsetInMeters>
       <AIUseTargetFacingForOffset value="false"/>
       <BeamEntryName value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="3.8" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-CastSpell" contextType="CastSpellContext">
      <ProceduralParams>
       <SpellName value="Tendril_Burrow_Strike"/>
       <takeDurability value="true"/>
       <AIAimAtTarget value="true"/>
       <AILeadTarget value="true"/>
       <ProjectileSpeed value="40"/>
       <HitScanPredictionSpeed value="40"/>
       <AIMissMinDistance value="0.5"/>
       <AIMissMaxDistance value="1"/>
       <AILeadTargetMaxAngle value="10"/>
       <AIAimMaxAngle value="45"/>
       <Condition value=""/>
       <AITrackMinionSpawns value="false"/>
       <AIRandomlySelectTargets value="false"/>
       <UseAllAvailableTargets value="true"/>
       <AITargetOffsetInMeters>
        <Element value="0"/>
        <Element value="0"/>
        <Element value="0"/>
       </AITargetOffsetInMeters>
       <AIUseTargetFacingForOffset value="false"/>
       <BeamEntryName value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
   </Fragment>
  </Attack_BurrowStrike_3x>
  <Attack_OozeFling_Combo>
   <Fragment BlendOutDuration="0.2" Tags="Dryad">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="1.2" Duration="0.2" CurveType="0"/>
     <Animation name="corruptiontendril_ooze_fling_01"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="0.43333334" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-RangedAttack" contextType="RangedAttackContext">
      <ProceduralParams>
       <RangedAttackName value="Basic"/>
       <ChargeValue value="0"/>
       <DamageTableRow value="Attack_OozeFling"/>
       <FireJoint value="bind_hook"/>
       <PosOffset>
        <Element value="0"/>
        <Element value="0"/>
        <Element value="0"/>
       </PosOffset>
       <RotOffset>
        <Element value="0"/>
        <Element value="0"/>
        <Element value="0"/>
       </RotOffset>
       <UseJointTransformForOffsets value="false"/>
       <AccuracyBonus value="0"/>
       <SliceOverride value="slices/characters/spellslices/dryad_tendril_poison_ball.dynamicslice"/>
       <ForwardSpawnInfo value="false"/>
       <UseAmmo value="false"/>
       <AIAimAtTarget value="true"/>
       <AIUseSelectedPositionAction value="false"/>
       <AILeadTarget value="true"/>
       <ProjectileSpeed value="50"/>
       <HitScanPredictionSpeed value="50"/>
       <AimJoint value="aim_direction"/>
       <AIMissMinDistance value="0.5"/>
       <AIMissMaxDistance value="1"/>
       <AILeadTargetMaxAngle value="10"/>
       <AIAimMaxAngle value="45"/>
       <AIRandomlySelectTargets value="false"/>
       <AIUseAllAvailableTargets value="true"/>
       <AIUseTargetGroundPos value="false"/>
       <AIAddTargetOffset value="true"/>
       <AITargetOffset>
        <Element value="0"/>
        <Element value="0"/>
        <Element value="-0.25"/>
       </AITargetOffset>
       <AIUseTargetFacingForOffset value="false"/>
       <Condition value=""/>
       <UseForwardFiringOffset value="false"/>
       <ForwardRotOffset>
        <Element value="0"/>
        <Element value="0"/>
        <Element value="0"/>
       </ForwardRotOffset>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="true"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="false"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="1080"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="5"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="true"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value=""/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.2" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="true"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="false"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="400"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="5"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="true"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value=""/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.23333333" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
   </Fragment>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="1.2" Duration="0.2" CurveType="0"/>
     <Animation name="corruptiontendril_ooze_fling_01"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="0.43333334" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-RangedAttack" contextType="RangedAttackContext">
      <ProceduralParams>
       <RangedAttackName value="Basic"/>
       <ChargeValue value="0"/>
       <DamageTableRow value="Attack_OozeFling"/>
       <FireJoint value="bind_hook"/>
       <PosOffset>
        <Element value="0"/>
        <Element value="0"/>
        <Element value="0"/>
       </PosOffset>
       <RotOffset>
        <Element value="0"/>
        <Element value="0"/>
        <Element value="0"/>
       </RotOffset>
       <UseJointTransformForOffsets value="false"/>
       <AccuracyBonus value="0"/>
       <SliceOverride value="slices/items/weapons/ai/tendril_ooze_ball.dynamicslice"/>
       <ForwardSpawnInfo value="false"/>
       <UseAmmo value="false"/>
       <AIAimAtTarget value="true"/>
       <AIUseSelectedPositionAction value="false"/>
       <AILeadTarget value="true"/>
       <ProjectileSpeed value="50"/>
       <HitScanPredictionSpeed value="50"/>
       <AimJoint value="aim_direction"/>
       <AIMissMinDistance value="0"/>
       <AIMissMaxDistance value="0.5"/>
       <AILeadTargetMaxAngle value="10"/>
       <AIAimMaxAngle value="45"/>
       <AIRandomlySelectTargets value="false"/>
       <AIUseAllAvailableTargets value="true"/>
       <AIUseTargetGroundPos value="false"/>
       <AIAddTargetOffset value="true"/>
       <AITargetOffset>
        <Element value="0"/>
        <Element value="0"/>
        <Element value="-0.25"/>
       </AITargetOffset>
       <AIUseTargetFacingForOffset value="false"/>
       <Condition value=""/>
       <UseForwardFiringOffset value="false"/>
       <ForwardRotOffset>
        <Element value="0"/>
        <Element value="0"/>
        <Element value="0"/>
       </ForwardRotOffset>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="true"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="false"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="1080"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="5"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="true"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value=""/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.2" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="true"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="false"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="400"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="5"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="true"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value=""/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.23333333" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
   </Fragment>
  </Attack_OozeFling_Combo>
  <Attack_Slam_Combo>
   <Fragment BlendOutDuration="0.2" Tags="Dryad">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.1" CurveType="0"/>
     <Animation name="corruptiontendril_slam_trans_01"/>
     <Blend ExitTime="0.66666669" StartTime="0.89999998" Duration="0" CurveType="0"/>
     <Animation name="corruptiontendril_slam_01"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="0.2" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="true"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="false"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="600"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="5"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="true"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value=""/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.2" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="true"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="false"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="600"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="5"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="true"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value=""/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.70000005" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="1.1666666" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Attack_Slam"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_spline_i"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="-90"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value="y z x"/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="false"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.13333333" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="1.1666666" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Attack_Slam"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_spline_l"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="-90"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value="y z x"/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="false"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.13333333" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="1.1666666" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Attack_Slam"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_hook"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="-90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="-90"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value="y z x"/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="true"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.13333333" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="1.1666666" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Attack_Slam"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_spline_f"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="-90"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value="y z x"/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="false"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.13333333" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="1.1999998" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Attack_Slam"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="1"/>
       <OffsetZ value="1"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="0.5"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="Xform"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="-90"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value=""/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="true"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.10000014" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
   </Fragment>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.1" CurveType="0"/>
     <Animation name="corruptiontendril_slam_trans_01"/>
     <Blend ExitTime="0.66666669" StartTime="0.89999998" Duration="0" CurveType="0"/>
     <Animation name="corruptiontendril_slam_01"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="0.2" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="true"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="false"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="600"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="5"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="true"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value=""/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.2" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="true"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="false"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="600"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="5"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="true"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value=""/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.70000005" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="1.1666666" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Attack_Slam"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_spline_i"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="-90"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value="y z x"/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="false"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.13333333" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="1.1666666" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Attack_Slam"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_spline_l"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="-90"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value="y z x"/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="false"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.13333333" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="1.1666666" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Attack_Slam"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_hook"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="-90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="-90"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value="y z x"/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="true"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.13333333" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="1.1666666" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Attack_Slam"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_spline_f"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="-90"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value="y z x"/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="false"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.13333333" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="1.1999998" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Attack_Slam"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="1"/>
       <OffsetZ value="1"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="0.5"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="Xform"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="-90"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value=""/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="true"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.10000014" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
   </Fragment>
  </Attack_Slam_Combo>
  <Attack_BarbStrike_Combo>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.1" CurveType="0"/>
     <Animation name="corruptiontendril_barb_strike_trans_01"/>
     <Blend ExitTime="0.63333338" StartTime="0.60000002" Duration="0" CurveType="0"/>
     <Animation name="corruptiontendril_barb_strike_01"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="0.16666667" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="true"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="false"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="600"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="5"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="true"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value=""/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.16666667" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="false"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="false"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="400"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="5"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="false"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value=""/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.63333333" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0.96666664" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Attack_Barb_Strike"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_hook"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="-90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="0"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value=""/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="true"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.19999999" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0.96666664" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Attack_Barb_Strike"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="-1.5"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_hook"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="-90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="0"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value=""/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="true"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.19999999" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="1.0666667" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Attack_Barb_Strike"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_spline_k"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="-90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="0"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value=""/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="true"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.099999905" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="1.0666667" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Attack_Barb_Strike"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="-1.5"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_spline_k"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="-90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="0"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value=""/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="true"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.099999905" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
   </Fragment>
  </Attack_BarbStrike_Combo>
  <r_Stun>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0.40000001" Duration="0.1" CurveType="0"/>
     <Animation name="corruptiontendril_burrow_stun_intro"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="0.5" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="SpawnSlice" contextType="">
      <ProceduralParams>
       <SliceToSpawn value="slices/Arenas/Events/Sandworm/Phase3/Sandworm_ArenaEncounter_WormPellet_Projectile_Launcher_RapidFire.dynamicslice"/>
       <DespawnOnExit value="false"/>
       <SliceDestructionCageAction value=""/>
       <UseAreaSpawner value="true"/>
       <SpawnOnClientsOnly value="false"/>
       <CanBeDisabledByEmoteFxSettings value="false"/>
       <TargetPosBlackboardKey value=""/>
       <SpawnCount value="1"/>
       <SpawnLocationOverrideIndex value="2"/>
       <Condition value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
   </Fragment>
  </r_Stun>
  <r_Stun_Loop>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.40000001" CurveType="0"/>
     <Animation name="corruptiontendril_burrow_stun_loop" flags="Loop"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Named" contextType="NamedContext">
      <ProceduralParams>
       <Name value="ForceStunned"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="1.8333334" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
   </Fragment>
  </r_Stun_Loop>
  <r_Stun_End>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="corruptiontendril_burrow_stun_outro"/>
    </AnimLayer>
   </Fragment>
  </r_Stun_End>
  <Attack_BarbStrike_2x>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="corruptiontendril_barb_strike_01"/>
     <Blend ExitTime="1.7" StartTime="0.1" Duration="0.1" CurveType="0"/>
     <Animation name="corruptiontendril_barb_strike_01"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="true"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="false"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="600"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="5"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="true"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value=""/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.33333334" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="false"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="false"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="400"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="5"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="false"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value=""/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.63333333" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
     <Blend ExitTime="0.83333325" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="false"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="false"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="400"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="5"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="false"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value=""/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.63333344" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0.96666664" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Attack_Barb_Strike"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_hook"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="-90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="0"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value=""/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="true"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.19999999" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
     <Blend ExitTime="1.2783993" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Attack_Barb_Strike"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_hook"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="-90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="0"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value=""/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="true"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.25028229" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0.96666664" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Attack_Barb_Strike"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="-1.5"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_hook"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="-90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="0"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value=""/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="true"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.19999999" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
     <Blend ExitTime="1.2783993" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Attack_Barb_Strike"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="-1.5"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_hook"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="-90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="0"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value=""/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="true"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.25028229" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="1.0666667" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Attack_Barb_Strike"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_spline_k"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="-90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="0"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value=""/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="true"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.099999905" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
     <Blend ExitTime="1.2783993" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Attack_Barb_Strike"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_spline_k"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="-90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="0"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value=""/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="true"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.099999905" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="1.0666667" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Attack_Barb_Strike"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="-1.5"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_spline_k"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="-90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="0"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value=""/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="true"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.099999905" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
     <Blend ExitTime="1.2783993" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Attack_Barb_Strike"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="-1.5"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_spline_k"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="-90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="0"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value=""/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="true"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.099999905" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
   </Fragment>
  </Attack_BarbStrike_2x>
  <Attack_Slam_Combo_FromBarbStrike>
   <Fragment BlendOutDuration="0.2" Tags="Dryad">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.1" CurveType="0"/>
     <Animation name="corruptiontendril_barb_to_slam_trans_01"/>
     <Blend ExitTime="-1" StartTime="0.89999998" Duration="0" CurveType="0"/>
     <Animation name="corruptiontendril_slam_01"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="0.2" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="true"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="false"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="600"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="5"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="true"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value=""/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.2" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="true"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="false"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="600"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="5"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="true"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value=""/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.70000005" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="1.2" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Attack_Slam"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_spline_i"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="-90"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value="y z x"/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="false"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.20000005" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="1.2" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Attack_Slam"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_spline_l"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="-90"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value="y z x"/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="false"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.20000005" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="1.2" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Attack_Slam"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_hook"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="-90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="-90"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value="y z x"/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="true"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.20000005" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="1.2" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Attack_Slam"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_spline_f"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="-90"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value="y z x"/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="false"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.20000005" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="1.3" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Attack_Slam"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="1"/>
       <OffsetZ value="1"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="0.5"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="Xform"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="-90"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value=""/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="true"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.10000014" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
   </Fragment>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.1" CurveType="0"/>
     <Animation name="corruptiontendril_barb_to_slam_trans_01"/>
     <Blend ExitTime="-1" StartTime="0.89999998" Duration="0" CurveType="0"/>
     <Animation name="corruptiontendril_slam_01"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="0.2" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="true"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="false"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="600"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="5"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="true"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value=""/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.2" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="true"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="false"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="600"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="5"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="true"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value=""/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.70000005" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="1.2" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Attack_Slam"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_spline_i"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="-90"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value="y z x"/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="false"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.20000005" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="1.2" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Attack_Slam"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_spline_l"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="-90"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value="y z x"/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="false"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.20000005" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="1.2" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Attack_Slam"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_hook"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="-90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="-90"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value="y z x"/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="true"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.20000005" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="1.2" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Attack_Slam"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_spline_f"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="-90"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value="y z x"/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="false"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.20000005" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="1.3" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Attack_Slam"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="1"/>
       <OffsetZ value="1"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="0.5"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="Xform"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="-90"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value=""/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="true"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.10000014" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
   </Fragment>
  </Attack_Slam_Combo_FromBarbStrike>
  <Attack_BarbStrike_Combo_FromSlam>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.1" CurveType="0"/>
     <Animation name="corruptiontendril_slam_to_barb_trans_01"/>
     <Blend ExitTime="-1" StartTime="0.60000002" Duration="0" CurveType="0"/>
     <Animation name="corruptiontendril_barb_strike_01"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="0.16666667" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="true"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="false"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="600"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="5"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="true"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value=""/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.16666667" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="false"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="false"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="400"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="5"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="false"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value=""/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.63333333" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0.96666664" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Attack_Barb_Strike"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_hook"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="-90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="0"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value=""/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="true"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.19999999" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0.96666664" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Attack_Barb_Strike"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="-1.5"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_hook"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="-90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="0"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value=""/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="true"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.19999999" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="1.0666667" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Attack_Barb_Strike"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_spline_k"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="-90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="0"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value=""/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="true"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.099999905" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="1.0666667" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Attack_Barb_Strike"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="-1.5"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_spline_k"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="-90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="0"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value=""/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="true"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.099999905" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
   </Fragment>
  </Attack_BarbStrike_Combo_FromSlam>
  <Attack_BurrowStrike_2x_02>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="corruptiontendril_burrow_strike_intro"/>
     <Blend ExitTime="-1" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="corruptiontendril_burrow_strike_loop" flags="Loop"/>
     <Blend ExitTime="1.8666666" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="corruptiontendril_burrow_strike_outro"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="true"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="false"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="400"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="5"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="true"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value=""/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.56666666" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="1.3333334" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-CastSpell" contextType="CastSpellContext">
      <ProceduralParams>
       <SpellName value="Tendril_Burrow_Strike"/>
       <takeDurability value="true"/>
       <AIAimAtTarget value="true"/>
       <AILeadTarget value="true"/>
       <ProjectileSpeed value="40"/>
       <HitScanPredictionSpeed value="40"/>
       <AIMissMinDistance value="0.5"/>
       <AIMissMaxDistance value="1"/>
       <AILeadTargetMaxAngle value="10"/>
       <AIAimMaxAngle value="45"/>
       <Condition value=""/>
       <AITrackMinionSpawns value="false"/>
       <AIRandomlySelectTargets value="false"/>
       <UseAllAvailableTargets value="true"/>
       <AITargetOffsetInMeters>
        <Element value="0"/>
        <Element value="0"/>
        <Element value="0"/>
       </AITargetOffsetInMeters>
       <AIUseTargetFacingForOffset value="false"/>
       <BeamEntryName value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="2.3333333" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-CastSpell" contextType="CastSpellContext">
      <ProceduralParams>
       <SpellName value="Tendril_Burrow_Strike"/>
       <takeDurability value="true"/>
       <AIAimAtTarget value="true"/>
       <AILeadTarget value="true"/>
       <ProjectileSpeed value="40"/>
       <HitScanPredictionSpeed value="40"/>
       <AIMissMinDistance value="0.5"/>
       <AIMissMaxDistance value="1"/>
       <AILeadTargetMaxAngle value="10"/>
       <AIAimMaxAngle value="45"/>
       <Condition value=""/>
       <AITrackMinionSpawns value="false"/>
       <AIRandomlySelectTargets value="false"/>
       <UseAllAvailableTargets value="true"/>
       <AITargetOffsetInMeters>
        <Element value="0"/>
        <Element value="0"/>
        <Element value="0"/>
       </AITargetOffsetInMeters>
       <AIUseTargetFacingForOffset value="false"/>
       <BeamEntryName value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
   </Fragment>
  </Attack_BurrowStrike_2x_02>
  <Attack_BurrowStrike_3x_02>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="corruptiontendril_burrow_strike_intro"/>
     <Blend ExitTime="-1" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="corruptiontendril_burrow_strike_loop" flags="Loop"/>
     <Blend ExitTime="2.8666668" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="corruptiontendril_burrow_strike_outro"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="true"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="false"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="400"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="5"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="true"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value=""/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.56666666" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="1.3333334" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-CastSpell" contextType="CastSpellContext">
      <ProceduralParams>
       <SpellName value="Tendril_Burrow_Strike"/>
       <takeDurability value="true"/>
       <AIAimAtTarget value="true"/>
       <AILeadTarget value="true"/>
       <ProjectileSpeed value="40"/>
       <HitScanPredictionSpeed value="40"/>
       <AIMissMinDistance value="0.5"/>
       <AIMissMaxDistance value="1"/>
       <AILeadTargetMaxAngle value="10"/>
       <AIAimMaxAngle value="45"/>
       <Condition value=""/>
       <AITrackMinionSpawns value="false"/>
       <AIRandomlySelectTargets value="false"/>
       <UseAllAvailableTargets value="true"/>
       <AITargetOffsetInMeters>
        <Element value="0"/>
        <Element value="0"/>
        <Element value="0"/>
       </AITargetOffsetInMeters>
       <AIUseTargetFacingForOffset value="false"/>
       <BeamEntryName value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="2.3333333" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-CastSpell" contextType="CastSpellContext">
      <ProceduralParams>
       <SpellName value="Tendril_Burrow_Strike"/>
       <takeDurability value="true"/>
       <AIAimAtTarget value="true"/>
       <AILeadTarget value="true"/>
       <ProjectileSpeed value="40"/>
       <HitScanPredictionSpeed value="40"/>
       <AIMissMinDistance value="0.5"/>
       <AIMissMaxDistance value="1"/>
       <AILeadTargetMaxAngle value="10"/>
       <AIAimMaxAngle value="45"/>
       <Condition value=""/>
       <AITrackMinionSpawns value="false"/>
       <AIRandomlySelectTargets value="false"/>
       <UseAllAvailableTargets value="true"/>
       <AITargetOffsetInMeters>
        <Element value="0"/>
        <Element value="0"/>
        <Element value="0"/>
       </AITargetOffsetInMeters>
       <AIUseTargetFacingForOffset value="false"/>
       <BeamEntryName value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="3.3333333" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-CastSpell" contextType="CastSpellContext">
      <ProceduralParams>
       <SpellName value="Tendril_Burrow_Strike"/>
       <takeDurability value="true"/>
       <AIAimAtTarget value="true"/>
       <AILeadTarget value="true"/>
       <ProjectileSpeed value="40"/>
       <HitScanPredictionSpeed value="40"/>
       <AIMissMinDistance value="0.5"/>
       <AIMissMaxDistance value="1"/>
       <AILeadTargetMaxAngle value="10"/>
       <AIAimMaxAngle value="45"/>
       <Condition value=""/>
       <AITrackMinionSpawns value="false"/>
       <AIRandomlySelectTargets value="false"/>
       <UseAllAvailableTargets value="true"/>
       <AITargetOffsetInMeters>
        <Element value="0"/>
        <Element value="0"/>
        <Element value="0"/>
       </AITargetOffsetInMeters>
       <AIUseTargetFacingForOffset value="false"/>
       <BeamEntryName value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
   </Fragment>
  </Attack_BurrowStrike_3x_02>
  <Attack_BurrowStrike_3x_03>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="corruptiontendril_burrow_strike_intro"/>
     <Blend ExitTime="-1" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="corruptiontendril_burrow_strike_loop" flags="Loop"/>
     <Blend ExitTime="3.3333335" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="corruptiontendril_burrow_strike_outro"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="true"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="false"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="400"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="5"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="true"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value=""/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.56666666" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="1.3333334" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-CastSpell" contextType="CastSpellContext">
      <ProceduralParams>
       <SpellName value="Tendril_Burrow_Strike"/>
       <takeDurability value="true"/>
       <AIAimAtTarget value="true"/>
       <AILeadTarget value="true"/>
       <ProjectileSpeed value="40"/>
       <HitScanPredictionSpeed value="40"/>
       <AIMissMinDistance value="0.5"/>
       <AIMissMaxDistance value="1"/>
       <AILeadTargetMaxAngle value="10"/>
       <AIAimMaxAngle value="45"/>
       <Condition value=""/>
       <AITrackMinionSpawns value="false"/>
       <AIRandomlySelectTargets value="false"/>
       <UseAllAvailableTargets value="true"/>
       <AITargetOffsetInMeters>
        <Element value="0"/>
        <Element value="0"/>
        <Element value="0"/>
       </AITargetOffsetInMeters>
       <AIUseTargetFacingForOffset value="false"/>
       <BeamEntryName value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="2.3333333" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-CastSpell" contextType="CastSpellContext">
      <ProceduralParams>
       <SpellName value="Tendril_Burrow_Strike"/>
       <takeDurability value="true"/>
       <AIAimAtTarget value="true"/>
       <AILeadTarget value="true"/>
       <ProjectileSpeed value="40"/>
       <HitScanPredictionSpeed value="40"/>
       <AIMissMinDistance value="0.5"/>
       <AIMissMaxDistance value="1"/>
       <AILeadTargetMaxAngle value="10"/>
       <AIAimMaxAngle value="45"/>
       <Condition value=""/>
       <AITrackMinionSpawns value="false"/>
       <AIRandomlySelectTargets value="false"/>
       <UseAllAvailableTargets value="true"/>
       <AITargetOffsetInMeters>
        <Element value="0"/>
        <Element value="0"/>
        <Element value="0"/>
       </AITargetOffsetInMeters>
       <AIUseTargetFacingForOffset value="false"/>
       <BeamEntryName value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="3.8" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-CastSpell" contextType="CastSpellContext">
      <ProceduralParams>
       <SpellName value="Tendril_Burrow_Strike"/>
       <takeDurability value="true"/>
       <AIAimAtTarget value="true"/>
       <AILeadTarget value="true"/>
       <ProjectileSpeed value="40"/>
       <HitScanPredictionSpeed value="40"/>
       <AIMissMinDistance value="0.5"/>
       <AIMissMaxDistance value="1"/>
       <AILeadTargetMaxAngle value="10"/>
       <AIAimMaxAngle value="45"/>
       <Condition value=""/>
       <AITrackMinionSpawns value="false"/>
       <AIRandomlySelectTargets value="false"/>
       <UseAllAvailableTargets value="true"/>
       <AITargetOffsetInMeters>
        <Element value="0"/>
        <Element value="0"/>
        <Element value="0"/>
       </AITargetOffsetInMeters>
       <AIUseTargetFacingForOffset value="false"/>
       <BeamEntryName value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
   </Fragment>
  </Attack_BurrowStrike_3x_03>
  <Burrow_Reposition_Start>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="dryadtendril_burrow_start"/>
    </AnimLayer>
   </Fragment>
  </Burrow_Reposition_Start>
  <Burrow_Reposition_Loop>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Animation name="dryadtendril_burrow_loop" flags="Loop"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="DisableCollision" contextType="DisableCollisionContext">
      <ProceduralParams>
       <ModifyStaticCollision value="false"/>
       <ModifyActorCollision value="true"/>
       <ModifyPlayerToPlayerCollision value="false"/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
   </Fragment>
  </Burrow_Reposition_Loop>
  <Burrow_Reposition_End>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Animation name="dryadtendril_burrow_loop" flags="Loop"/>
     <Blend ExitTime="0.33333334" StartTime="0" Duration="0" CurveType="0"/>
     <Animation name="dryadtendril_burrow_end"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="0.33333334" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Attack_BurrowStrike"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="2.5"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="Xform"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="0"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="0"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value=""/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="true"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.19999996" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="DisableCollision" contextType="DisableCollisionContext">
      <ProceduralParams>
       <ModifyStaticCollision value="false"/>
       <ModifyActorCollision value="true"/>
       <ModifyPlayerToPlayerCollision value="false"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.43333331" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
   </Fragment>
  </Burrow_Reposition_End>
  <Attack_Thrash_LR>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="dryadtendril_thrash_lr"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="true"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="false"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="600"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="5"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="true"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value=""/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.56666666" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="true"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="false"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="600"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="5"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="true"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value=""/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.83333331" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="1.6333333" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Attack_Thrash"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_spline_i"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="-90"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value="y z x"/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="false"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.29999995" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
     <Blend ExitTime="0.63333333" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk2"/>
       <DamageTableRow value="Attack_Thrash"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1.2"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_spline_i"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="-90"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value="y z x"/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="false"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.16666651" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
     <Blend ExitTime="0.43333364" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk3"/>
       <DamageTableRow value="Attack_Thrash"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1.2"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_spline_i"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="-90"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value="y z x"/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="false"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.19999981" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="1.6333333" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Attack_Thrash"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_spline_l"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="-90"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value="y z x"/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="false"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.29999995" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
     <Blend ExitTime="0.63333333" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk2"/>
       <DamageTableRow value="Attack_Thrash"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1.2"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_spline_l"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="-90"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value="y z x"/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="false"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.16666651" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
     <Blend ExitTime="0.43333364" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk3"/>
       <DamageTableRow value="Attack_Thrash"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1.2"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_spline_l"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="-90"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value="y z x"/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="false"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.19999981" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="1.6333333" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Attack_Thrash"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_hook"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="-90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="-90"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value="y z x"/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="true"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.29999995" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
     <Blend ExitTime="0.63333333" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk2"/>
       <DamageTableRow value="Attack_Thrash"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1.2"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_hook"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="-90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="-90"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value="y z x"/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="true"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.16666651" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
     <Blend ExitTime="0.43333364" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk3"/>
       <DamageTableRow value="Attack_Thrash"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1.2"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_hook"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="-90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="-90"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value="y z x"/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="true"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.19999981" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="1.6333333" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Attack_Thrash"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_spline_f"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="-90"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value="y z x"/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="false"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.29999995" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
     <Blend ExitTime="0.63333333" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk2"/>
       <DamageTableRow value="Attack_Thrash"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1.2"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_spline_f"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="-90"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value="y z x"/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="false"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.16666651" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
     <Blend ExitTime="0.43333364" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk3"/>
       <DamageTableRow value="Attack_Thrash"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1.2"/>
       <MeleeAttackCapsuleHalfHeight value="1"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="bind_spline_f"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="-90"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value="y z x"/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="false"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.19999981" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="1.6999999" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Attack_Thrash"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="1"/>
       <OffsetZ value="1"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1"/>
       <MeleeAttackCapsuleHalfHeight value="0.5"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="Xform"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="-90"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value=""/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="true"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.23333335" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
     <Blend ExitTime="0.69999993" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk2"/>
       <DamageTableRow value="Attack_Thrash"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="1"/>
       <OffsetZ value="1"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1.2"/>
       <MeleeAttackCapsuleHalfHeight value="0.5"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="Xform"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="-90"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value=""/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="true"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.099999905" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
     <Blend ExitTime="0.50000024" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk3"/>
       <DamageTableRow value="Attack_Thrash"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="1"/>
       <OffsetZ value="1"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="1.2"/>
       <MeleeAttackCapsuleHalfHeight value="0.5"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="Xform"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="90"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="-90"/>
       <AmmoSlotForScaling value=""/>
       <ShapeAxesModifierCommands value=""/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="true"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.13333321" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
   </Fragment>
  </Attack_Thrash_LR>
  <r_Stagger>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0.40000001" Duration="0.1" CurveType="0"/>
     <Animation name="sandworm_stagger"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-CastSpell" contextType="CastSpellContext">
      <ProceduralParams>
       <SpellName value="AI_Staggered_Telegraph"/>
       <takeDurability value="true"/>
       <AIAimAtTarget value="true"/>
       <AILeadTarget value="true"/>
       <ProjectileSpeed value="100"/>
       <HitScanPredictionSpeed value="100"/>
       <AIMissMinDistance value="0.5"/>
       <AIMissMaxDistance value="1"/>
       <AILeadTargetMaxAngle value="45"/>
       <AIAimMaxAngle value="45"/>
       <Condition value=""/>
       <AITrackMinionSpawns value="false"/>
       <AIRandomlySelectTargets value="false"/>
       <UseAllAvailableTargets value="true"/>
       <AITargetOffsetInMeters>
        <Element value="0"/>
        <Element value="0"/>
        <Element value="0"/>
       </AITargetOffsetInMeters>
       <AIUseTargetFacingForOffset value="false"/>
       <BeamEntryName value=""/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="5.1999998" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-CastSpell" contextType="CastSpellContext">
      <ProceduralParams>
       <SpellName value="Sandworm_Acid_Storm_Cleanup"/>
       <takeDurability value="true"/>
       <AIAimAtTarget value="true"/>
       <AILeadTarget value="true"/>
       <ProjectileSpeed value="100"/>
       <HitScanPredictionSpeed value="100"/>
       <AIMissMinDistance value="0.5"/>
       <AIMissMaxDistance value="1"/>
       <AILeadTargetMaxAngle value="20"/>
       <AIAimMaxAngle value="45"/>
       <Condition value=""/>
       <AITrackMinionSpawns value="false"/>
       <AIRandomlySelectTargets value="false"/>
       <UseAllAvailableTargets value="true"/>
       <AITargetOffsetInMeters>
        <Element value="0"/>
        <Element value="0"/>
        <Element value="0"/>
       </AITargetOffsetInMeters>
       <AIUseTargetFacingForOffset value="false"/>
       <BeamEntryName value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
   </Fragment>
  </r_Stagger>
  <Sandworm_Acid_Storm_Loop>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="sandworm_acid_spew_full"/>
    </AnimLayer>
   </Fragment>
  </Sandworm_Acid_Storm_Loop>
  <Sandworm_Acid_Storm_Intro>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="sandworm_acid_storm_intro"/>
     <Blend ExitTime="-1" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="sandworm_acid_storm_loop"/>
     <Blend ExitTime="-1" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="sandworm_acid_storm_end"/>
     <Blend ExitTime="-1" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name=""/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Named" contextType="NamedContext">
      <ProceduralParams>
       <Name value="TOD_On"/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="false"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="false"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="1080"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="5"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="false"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="3.55" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="SpawnSlice" contextType="">
      <ProceduralParams>
       <SliceToSpawn value="slices/Arenas/Events/Sandworm/BASE_-_AngryEarth_-_SandElemental_Heavy_Sandworm.dynamicslice"/>
       <DespawnOnExit value="false"/>
       <SliceDestructionCageAction value=""/>
       <UseAreaSpawner value="true"/>
       <SpawnOnClientsOnly value="false"/>
       <CanBeDisabledByEmoteFxSettings value="false"/>
       <TargetPosBlackboardKey value=""/>
       <SpawnCount value="1"/>
       <SpawnLocationOverrideIndex value="23"/>
       <Condition value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="3.75" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="SpawnSlice" contextType="">
      <ProceduralParams>
       <SliceToSpawn value="slices/Arenas/Events/Sandworm/BASE_-_AngryEarth_-_SandElemental_Heavy_Sandworm.dynamicslice"/>
       <DespawnOnExit value="false"/>
       <SliceDestructionCageAction value=""/>
       <UseAreaSpawner value="true"/>
       <SpawnOnClientsOnly value="false"/>
       <CanBeDisabledByEmoteFxSettings value="false"/>
       <TargetPosBlackboardKey value=""/>
       <SpawnCount value="1"/>
       <SpawnLocationOverrideIndex value="24"/>
       <Condition value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="3.3348434" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="SpawnSlice" contextType="">
      <ProceduralParams>
       <SliceToSpawn value="slices/Arenas/Events/Sandworm/BASE_-_Angry_Earth_-_Sand_Elemental_Shaman_Sandworm.dynamicslice"/>
       <DespawnOnExit value="false"/>
       <SliceDestructionCageAction value=""/>
       <UseAreaSpawner value="true"/>
       <SpawnOnClientsOnly value="false"/>
       <CanBeDisabledByEmoteFxSettings value="false"/>
       <TargetPosBlackboardKey value=""/>
       <SpawnCount value="1"/>
       <SpawnLocationOverrideIndex value="4"/>
       <Condition value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="2.9152267" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="SpawnSlice" contextType="">
      <ProceduralParams>
       <SliceToSpawn value="slices/Arenas/Events/Sandworm/BASE_-_Angry_Earth_-_Sand_Elemental_Shaman_Sandworm.dynamicslice"/>
       <DespawnOnExit value="false"/>
       <SliceDestructionCageAction value=""/>
       <UseAreaSpawner value="true"/>
       <SpawnOnClientsOnly value="false"/>
       <CanBeDisabledByEmoteFxSettings value="false"/>
       <TargetPosBlackboardKey value=""/>
       <SpawnCount value="1"/>
       <SpawnLocationOverrideIndex value="5"/>
       <Condition value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="3.1822555" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="SpawnSlice" contextType="">
      <ProceduralParams>
       <SliceToSpawn value="slices/Arenas/Events/Sandworm/BASE_-_Angry_Earth_-_Sand_Elemental_Shaman_Sandworm.dynamicslice"/>
       <DespawnOnExit value="false"/>
       <SliceDestructionCageAction value=""/>
       <UseAreaSpawner value="true"/>
       <SpawnOnClientsOnly value="false"/>
       <CanBeDisabledByEmoteFxSettings value="false"/>
       <TargetPosBlackboardKey value=""/>
       <SpawnCount value="1"/>
       <SpawnLocationOverrideIndex value="6"/>
       <Condition value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="2.9152267" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="SpawnSlice" contextType="">
      <ProceduralParams>
       <SliceToSpawn value="slices/Arenas/Events/Sandworm/BASE_-_Angry_Earth_-_Sand_Elemental_Shaman_Sandworm.dynamicslice"/>
       <DespawnOnExit value="false"/>
       <SliceDestructionCageAction value=""/>
       <UseAreaSpawner value="true"/>
       <SpawnOnClientsOnly value="false"/>
       <CanBeDisabledByEmoteFxSettings value="false"/>
       <TargetPosBlackboardKey value=""/>
       <SpawnCount value="1"/>
       <SpawnLocationOverrideIndex value="7"/>
       <Condition value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
   </Fragment>
  </Sandworm_Acid_Storm_Intro>
  <Sandworm_Acid_Storm_Outro>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="2" Duration="1" CurveType="0"/>
     <Animation name="sandworm_spawn" speed="1.5"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Named" contextType="NamedContext">
      <ProceduralParams>
       <Name value="TOD_Off"/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
   </Fragment>
  </Sandworm_Acid_Storm_Outro>
  <Sandworm_Stagger_Intro>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="1" Duration="0.1" CurveType="0"/>
     <Animation name="sandworm_stagger_intro"/>
     <Blend ExitTime="1.6333333" StartTime="0.75" Duration="1.4300001" CurveType="0"/>
     <Animation name="sandworm_taunt" speed="0.89999998"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-CastSpell" contextType="CastSpellContext">
      <ProceduralParams>
       <SpellName value="AI_Staggered_Telegraph"/>
       <takeDurability value="true"/>
       <AIAimAtTarget value="true"/>
       <AILeadTarget value="true"/>
       <ProjectileSpeed value="100"/>
       <HitScanPredictionSpeed value="100"/>
       <AIMissMinDistance value="0.5"/>
       <AIMissMaxDistance value="1"/>
       <AILeadTargetMaxAngle value="45"/>
       <AIAimMaxAngle value="45"/>
       <Condition value=""/>
       <AITrackMinionSpawns value="false"/>
       <AIRandomlySelectTargets value="false"/>
       <UseAllAvailableTargets value="true"/>
       <AITargetOffsetInMeters>
        <Element value="0"/>
        <Element value="0"/>
        <Element value="0"/>
       </AITargetOffsetInMeters>
       <AIUseTargetFacingForOffset value="false"/>
       <BeamEntryName value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Named" contextType="NamedContext">
      <ProceduralParams>
       <Name value="TOD_Off"/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="true"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="true"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="0.1"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="15"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="true"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value="Selected_Pos"/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
   </Fragment>
  </Sandworm_Stagger_Intro>
  <Sandworm_Stagger_Outro>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="sandworm_stagger_outtro"/>
     <Blend ExitTime="-1" StartTime="2" Duration="1" CurveType="0"/>
     <Animation name="sandworm_spawn" speed="1.5"/>
    </AnimLayer>
   </Fragment>
  </Sandworm_Stagger_Outro>
  <Sandworm_Acid_Spew>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="sandworm_idle_slow"/>
     <Blend ExitTime="3" StartTime="0" Duration="0.40000001" CurveType="0"/>
     <Animation name="sandworm_acid_spew_3" speed="1.5"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="5.3333335" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-CastSpell" contextType="CastSpellContext">
      <ProceduralParams>
       <SpellName value="Sandworm_Acid_Spew_Cylinder01"/>
       <takeDurability value="true"/>
       <AIAimAtTarget value="false"/>
       <AILeadTarget value="false"/>
       <ProjectileSpeed value="100"/>
       <HitScanPredictionSpeed value="100"/>
       <AIMissMinDistance value="0.5"/>
       <AIMissMaxDistance value="1"/>
       <AILeadTargetMaxAngle value="20"/>
       <AIAimMaxAngle value="45"/>
       <Condition value=""/>
       <AITrackMinionSpawns value="false"/>
       <AIRandomlySelectTargets value="false"/>
       <UseAllAvailableTargets value="false"/>
       <AITargetOffsetInMeters>
        <Element value="0"/>
        <Element value="3"/>
        <Element value="0"/>
       </AITargetOffsetInMeters>
       <AIUseTargetFacingForOffset value="false"/>
       <BeamEntryName value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="5.5" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-CastSpell" contextType="CastSpellContext">
      <ProceduralParams>
       <SpellName value="Sandworm_Acid_Spew_Cylinder02"/>
       <takeDurability value="true"/>
       <AIAimAtTarget value="false"/>
       <AILeadTarget value="false"/>
       <ProjectileSpeed value="100"/>
       <HitScanPredictionSpeed value="100"/>
       <AIMissMinDistance value="0.5"/>
       <AIMissMaxDistance value="1"/>
       <AILeadTargetMaxAngle value="20"/>
       <AIAimMaxAngle value="45"/>
       <Condition value=""/>
       <AITrackMinionSpawns value="false"/>
       <AIRandomlySelectTargets value="false"/>
       <UseAllAvailableTargets value="false"/>
       <AITargetOffsetInMeters>
        <Element value="0"/>
        <Element value="6"/>
        <Element value="0"/>
       </AITargetOffsetInMeters>
       <AIUseTargetFacingForOffset value="false"/>
       <BeamEntryName value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="5.6999998" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-CastSpell" contextType="CastSpellContext">
      <ProceduralParams>
       <SpellName value="Sandworm_Acid_Spew_Cylinder03"/>
       <takeDurability value="true"/>
       <AIAimAtTarget value="false"/>
       <AILeadTarget value="false"/>
       <ProjectileSpeed value="100"/>
       <HitScanPredictionSpeed value="100"/>
       <AIMissMinDistance value="0.5"/>
       <AIMissMaxDistance value="1"/>
       <AILeadTargetMaxAngle value="20"/>
       <AIAimMaxAngle value="45"/>
       <Condition value=""/>
       <AITrackMinionSpawns value="false"/>
       <AIRandomlySelectTargets value="false"/>
       <UseAllAvailableTargets value="false"/>
       <AITargetOffsetInMeters>
        <Element value="0"/>
        <Element value="9"/>
        <Element value="0"/>
       </AITargetOffsetInMeters>
       <AIUseTargetFacingForOffset value="false"/>
       <BeamEntryName value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="5.9000001" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-CastSpell" contextType="CastSpellContext">
      <ProceduralParams>
       <SpellName value="Sandworm_Acid_Spew_Cylinder04"/>
       <takeDurability value="true"/>
       <AIAimAtTarget value="false"/>
       <AILeadTarget value="false"/>
       <ProjectileSpeed value="100"/>
       <HitScanPredictionSpeed value="100"/>
       <AIMissMinDistance value="0.5"/>
       <AIMissMaxDistance value="1"/>
       <AILeadTargetMaxAngle value="20"/>
       <AIAimMaxAngle value="45"/>
       <Condition value=""/>
       <AITrackMinionSpawns value="false"/>
       <AIRandomlySelectTargets value="false"/>
       <UseAllAvailableTargets value="false"/>
       <AITargetOffsetInMeters>
        <Element value="0"/>
        <Element value="12"/>
        <Element value="0"/>
       </AITargetOffsetInMeters>
       <AIUseTargetFacingForOffset value="false"/>
       <BeamEntryName value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="6.0999999" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-CastSpell" contextType="CastSpellContext">
      <ProceduralParams>
       <SpellName value="Sandworm_Acid_Spew_Cylinder05"/>
       <takeDurability value="true"/>
       <AIAimAtTarget value="false"/>
       <AILeadTarget value="false"/>
       <ProjectileSpeed value="100"/>
       <HitScanPredictionSpeed value="100"/>
       <AIMissMinDistance value="0.5"/>
       <AIMissMaxDistance value="1"/>
       <AILeadTargetMaxAngle value="20"/>
       <AIAimMaxAngle value="45"/>
       <Condition value=""/>
       <AITrackMinionSpawns value="false"/>
       <AIRandomlySelectTargets value="false"/>
       <UseAllAvailableTargets value="false"/>
       <AITargetOffsetInMeters>
        <Element value="0"/>
        <Element value="12"/>
        <Element value="0"/>
       </AITargetOffsetInMeters>
       <AIUseTargetFacingForOffset value="false"/>
       <BeamEntryName value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="6.3000002" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-CastSpell" contextType="CastSpellContext">
      <ProceduralParams>
       <SpellName value="Sandworm_Acid_Spew_Cylinder06"/>
       <takeDurability value="true"/>
       <AIAimAtTarget value="false"/>
       <AILeadTarget value="false"/>
       <ProjectileSpeed value="100"/>
       <HitScanPredictionSpeed value="100"/>
       <AIMissMinDistance value="0.5"/>
       <AIMissMaxDistance value="1"/>
       <AILeadTargetMaxAngle value="20"/>
       <AIAimMaxAngle value="45"/>
       <Condition value=""/>
       <AITrackMinionSpawns value="false"/>
       <AIRandomlySelectTargets value="false"/>
       <UseAllAvailableTargets value="false"/>
       <AITargetOffsetInMeters>
        <Element value="0"/>
        <Element value="12"/>
        <Element value="0"/>
       </AITargetOffsetInMeters>
       <AIUseTargetFacingForOffset value="false"/>
       <BeamEntryName value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="6.5" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-CastSpell" contextType="CastSpellContext">
      <ProceduralParams>
       <SpellName value="Sandworm_Acid_Spew_Cylinder07"/>
       <takeDurability value="true"/>
       <AIAimAtTarget value="false"/>
       <AILeadTarget value="false"/>
       <ProjectileSpeed value="100"/>
       <HitScanPredictionSpeed value="100"/>
       <AIMissMinDistance value="0.5"/>
       <AIMissMaxDistance value="1"/>
       <AILeadTargetMaxAngle value="20"/>
       <AIAimMaxAngle value="45"/>
       <Condition value=""/>
       <AITrackMinionSpawns value="false"/>
       <AIRandomlySelectTargets value="false"/>
       <UseAllAvailableTargets value="false"/>
       <AITargetOffsetInMeters>
        <Element value="0"/>
        <Element value="12"/>
        <Element value="0"/>
       </AITargetOffsetInMeters>
       <AIUseTargetFacingForOffset value="false"/>
       <BeamEntryName value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="true"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="true"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="0.1"/>
       <Radius value="40"/>
       <MaxAngle value="180"/>
       <Height value="20"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="true"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="false"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value=""/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="2.5" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-CastSpell" contextType="CastSpellContext">
      <ProceduralParams>
       <SpellName value="Sandworm_Acid_Spew_Target_Marker"/>
       <takeDurability value="false"/>
       <AIAimAtTarget value="true"/>
       <AILeadTarget value="false"/>
       <ProjectileSpeed value="100"/>
       <HitScanPredictionSpeed value="100"/>
       <AIMissMinDistance value="0.5"/>
       <AIMissMaxDistance value="1"/>
       <AILeadTargetMaxAngle value="20"/>
       <AIAimMaxAngle value="45"/>
       <Condition value=""/>
       <AITrackMinionSpawns value="false"/>
       <AIRandomlySelectTargets value="false"/>
       <UseAllAvailableTargets value="false"/>
       <AITargetOffsetInMeters>
        <Element value="0"/>
        <Element value="0"/>
        <Element value="0"/>
       </AITargetOffsetInMeters>
       <AIUseTargetFacingForOffset value="false"/>
       <BeamEntryName value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
   </Fragment>
  </Sandworm_Acid_Spew>
  <Sandworm_Resonant_Roar>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="3" Duration="0.40000001" CurveType="0"/>
     <Animation name="sandworm_spawn" speed="1.5"/>
     <Blend ExitTime="2.7" StartTime="0" Duration="0.85000002" CurveType="0"/>
     <Animation name="sandworm_taunt" speed="1.5"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="2.9152267" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="SpawnSlice" contextType="">
      <ProceduralParams>
       <SliceToSpawn value="slices/Arenas/Events/Sandworm/BASE_-_Angry_Earth_-_Desert_Scorpion_Impaler_Tiny_Sandworm_001.dynamicslice"/>
       <DespawnOnExit value="false"/>
       <SliceDestructionCageAction value=""/>
       <UseAreaSpawner value="true"/>
       <SpawnOnClientsOnly value="false"/>
       <CanBeDisabledByEmoteFxSettings value="false"/>
       <TargetPosBlackboardKey value=""/>
       <SpawnCount value="1"/>
       <SpawnLocationOverrideIndex value="9"/>
       <Condition value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="2.9152267" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="SpawnSlice" contextType="">
      <ProceduralParams>
       <SliceToSpawn value="slices/Arenas/Events/Sandworm/BASE_-_Angry_Earth_-_Desert_Scorpion_Impaler_Tiny_Sandworm_001.dynamicslice"/>
       <DespawnOnExit value="false"/>
       <SliceDestructionCageAction value=""/>
       <UseAreaSpawner value="true"/>
       <SpawnOnClientsOnly value="false"/>
       <CanBeDisabledByEmoteFxSettings value="false"/>
       <TargetPosBlackboardKey value=""/>
       <SpawnCount value="1"/>
       <SpawnLocationOverrideIndex value="10"/>
       <Condition value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="2.9152267" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="SpawnSlice" contextType="">
      <ProceduralParams>
       <SliceToSpawn value="slices/Arenas/Events/Sandworm/BASE_-_Angry_Earth_-_Desert_Scorpion_Impaler_Tiny_Sandworm_001.dynamicslice"/>
       <DespawnOnExit value="false"/>
       <SliceDestructionCageAction value=""/>
       <UseAreaSpawner value="true"/>
       <SpawnOnClientsOnly value="false"/>
       <CanBeDisabledByEmoteFxSettings value="false"/>
       <TargetPosBlackboardKey value=""/>
       <SpawnCount value="1"/>
       <SpawnLocationOverrideIndex value="11"/>
       <Condition value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="2.9152267" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="SpawnSlice" contextType="">
      <ProceduralParams>
       <SliceToSpawn value="slices/Arenas/Events/Sandworm/BASE_-_Angry_Earth_-_Desert_Scorpion_Impaler_Tiny_Sandworm_001.dynamicslice"/>
       <DespawnOnExit value="false"/>
       <SliceDestructionCageAction value=""/>
       <UseAreaSpawner value="true"/>
       <SpawnOnClientsOnly value="false"/>
       <CanBeDisabledByEmoteFxSettings value="false"/>
       <TargetPosBlackboardKey value=""/>
       <SpawnCount value="1"/>
       <SpawnLocationOverrideIndex value="12"/>
       <Condition value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="2.9152267" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="SpawnSlice" contextType="">
      <ProceduralParams>
       <SliceToSpawn value="slices/Arenas/Events/Sandworm/BASE_-_Angry_Earth_-_Desert_Scorpion_Impaler_Tiny_Sandworm_001.dynamicslice"/>
       <DespawnOnExit value="false"/>
       <SliceDestructionCageAction value=""/>
       <UseAreaSpawner value="true"/>
       <SpawnOnClientsOnly value="false"/>
       <CanBeDisabledByEmoteFxSettings value="false"/>
       <TargetPosBlackboardKey value=""/>
       <SpawnCount value="1"/>
       <SpawnLocationOverrideIndex value="15"/>
       <Condition value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="2.9152267" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="SpawnSlice" contextType="">
      <ProceduralParams>
       <SliceToSpawn value="slices/Arenas/Events/Sandworm/BASE_-_Angry_Earth_-_Desert_Scorpion_Impaler_Tiny_Sandworm_001.dynamicslice"/>
       <DespawnOnExit value="false"/>
       <SliceDestructionCageAction value=""/>
       <UseAreaSpawner value="true"/>
       <SpawnOnClientsOnly value="false"/>
       <CanBeDisabledByEmoteFxSettings value="false"/>
       <TargetPosBlackboardKey value=""/>
       <SpawnCount value="1"/>
       <SpawnLocationOverrideIndex value="16"/>
       <Condition value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="true"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="true"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="0.050000001"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="15"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="true"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value="Selected_Pos"/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="3.55" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="SpawnSlice" contextType="">
      <ProceduralParams>
       <SliceToSpawn value="slices/Arenas/Events/Sandworm/BASE_-_AngryEarth_-_SandElemental_Heavy_Sandworm.dynamicslice"/>
       <DespawnOnExit value="false"/>
       <SliceDestructionCageAction value=""/>
       <UseAreaSpawner value="true"/>
       <SpawnOnClientsOnly value="false"/>
       <CanBeDisabledByEmoteFxSettings value="false"/>
       <TargetPosBlackboardKey value=""/>
       <SpawnCount value="1"/>
       <SpawnLocationOverrideIndex value="23"/>
       <Condition value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="3.75" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="SpawnSlice" contextType="">
      <ProceduralParams>
       <SliceToSpawn value="slices/Arenas/Events/Sandworm/BASE_-_AngryEarth_-_SandElemental_Heavy_Sandworm.dynamicslice"/>
       <DespawnOnExit value="false"/>
       <SliceDestructionCageAction value=""/>
       <UseAreaSpawner value="true"/>
       <SpawnOnClientsOnly value="false"/>
       <CanBeDisabledByEmoteFxSettings value="false"/>
       <TargetPosBlackboardKey value=""/>
       <SpawnCount value="1"/>
       <SpawnLocationOverrideIndex value="24"/>
       <Condition value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="3.3348434" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="SpawnSlice" contextType="">
      <ProceduralParams>
       <SliceToSpawn value="slices/Arenas/Events/Sandworm/BASE_-_AngryEarth_-_SandElemental_Soldier_Sandworm.dynamicslice"/>
       <DespawnOnExit value="false"/>
       <SliceDestructionCageAction value=""/>
       <UseAreaSpawner value="true"/>
       <SpawnOnClientsOnly value="false"/>
       <CanBeDisabledByEmoteFxSettings value="false"/>
       <TargetPosBlackboardKey value=""/>
       <SpawnCount value="1"/>
       <SpawnLocationOverrideIndex value="0"/>
       <Condition value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="2.9152267" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="SpawnSlice" contextType="">
      <ProceduralParams>
       <SliceToSpawn value="slices/Arenas/Events/Sandworm/BASE_-_AngryEarth_-_SandElemental_Soldier_Sandworm.dynamicslice"/>
       <DespawnOnExit value="false"/>
       <SliceDestructionCageAction value=""/>
       <UseAreaSpawner value="true"/>
       <SpawnOnClientsOnly value="false"/>
       <CanBeDisabledByEmoteFxSettings value="false"/>
       <TargetPosBlackboardKey value=""/>
       <SpawnCount value="1"/>
       <SpawnLocationOverrideIndex value="5"/>
       <Condition value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="3.1822555" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="SpawnSlice" contextType="">
      <ProceduralParams>
       <SliceToSpawn value="slices/Arenas/Events/Sandworm/BASE_-_AngryEarth_-_SandElemental_Soldier_Sandworm.dynamicslice"/>
       <DespawnOnExit value="false"/>
       <SliceDestructionCageAction value=""/>
       <UseAreaSpawner value="true"/>
       <SpawnOnClientsOnly value="false"/>
       <CanBeDisabledByEmoteFxSettings value="false"/>
       <TargetPosBlackboardKey value=""/>
       <SpawnCount value="1"/>
       <SpawnLocationOverrideIndex value="6"/>
       <Condition value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="2.9152267" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="SpawnSlice" contextType="">
      <ProceduralParams>
       <SliceToSpawn value="slices/Arenas/Events/Sandworm/BASE_-_AngryEarth_-_SandElemental_Soldier_Sandworm.dynamicslice"/>
       <DespawnOnExit value="false"/>
       <SliceDestructionCageAction value=""/>
       <UseAreaSpawner value="true"/>
       <SpawnOnClientsOnly value="false"/>
       <CanBeDisabledByEmoteFxSettings value="false"/>
       <TargetPosBlackboardKey value=""/>
       <SpawnCount value="1"/>
       <SpawnLocationOverrideIndex value="1"/>
       <Condition value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
   </Fragment>
  </Sandworm_Resonant_Roar>
  <Sandworm_Body_Slam>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="sandworm_body_slam_start"/>
     <Blend ExitTime="1.95" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="sandworm_body_slam_end"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="1.7" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Sandworm_BodySlam"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="15"/>
       <OffsetZ value="5"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="6"/>
       <MeleeAttackCapsuleHalfHeight value="15"/>
       <MeleeAttackBoxDimensionsX value="0"/>
       <MeleeAttackBoxDimensionsY value="0"/>
       <MeleeAttackBoxDimensionsZ value="0"/>
       <JointName value="xform_C0_0_jnt"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="275"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="0"/>
       <AmmoSlotForScaling value="PaperdollSlotTypes::HEAD_SLOT"/>
       <ShapeAxesModifierCommands value=""/>
       <DisableLOSCheck value="false"/>
       <UseEndAsCenter value="false"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.17499995" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="false"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="false"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="1080"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="5"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="false"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value=""/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="1.0666667" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
   </Fragment>
  </Sandworm_Body_Slam>
  <Sandworm_Acid_Spit>
   <Fragment BlendOutDuration="0.2" Tags="Season_02">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.5" CurveType="0"/>
     <Animation name="baby_sandworm_acid_spit" speed="2"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="1" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-RangedAttack" contextType="RangedAttackContext">
      <ProceduralParams>
       <RangedAttackName value="Basic"/>
       <ChargeValue value="0"/>
       <DamageTableRow value="Sandworm_AcidSpit_Direct"/>
       <FireJoint value="Jaw_C0_0_jnt"/>
       <PosOffset>
        <Element value="0"/>
        <Element value="0"/>
        <Element value="0"/>
       </PosOffset>
       <RotOffset>
        <Element value="0"/>
        <Element value="0"/>
        <Element value="0"/>
       </RotOffset>
       <UseJointTransformForOffsets value="true"/>
       <AccuracyBonus value="0"/>
       <SliceOverride value="slices/characters/spellslices/sandworm/sandworm_acid_spit_projectile.dynamicslice"/>
       <ForwardSpawnInfo value="false"/>
       <UseAmmo value="false"/>
       <AIAimAtTarget value="true"/>
       <AIUseSelectedPositionAction value="false"/>
       <AILeadTarget value="true"/>
       <ProjectileSpeed value="300"/>
       <HitScanPredictionSpeed value="300"/>
       <AimJoint value=""/>
       <AIMissMinDistance value="0"/>
       <AIMissMaxDistance value="0.5"/>
       <AILeadTargetMaxAngle value="45"/>
       <AIAimMaxAngle value="45"/>
       <AIRandomlySelectTargets value="false"/>
       <AIUseAllAvailableTargets value="true"/>
       <AIUseTargetGroundPos value="false"/>
       <AIAddTargetOffset value="true"/>
       <AITargetOffset>
        <Element value="0"/>
        <Element value="0"/>
        <Element value="-0.25"/>
       </AITargetOffset>
       <AIUseTargetFacingForOffset value="false"/>
       <Condition value=""/>
       <UseForwardFiringOffset value="false"/>
       <ForwardRotOffset>
        <Element value="0"/>
        <Element value="0"/>
        <Element value="0"/>
       </ForwardRotOffset>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="true"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="true"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="0.40000001"/>
       <Radius value="20"/>
       <MaxAngle value="180"/>
       <Height value="15"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="true"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value=""/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="2.3333333" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
   </Fragment>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.5" CurveType="0"/>
     <Animation name="sandworm_acid_spit" speed="2"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="1" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-RangedAttack" contextType="RangedAttackContext">
      <ProceduralParams>
       <RangedAttackName value="Basic"/>
       <ChargeValue value="0"/>
       <DamageTableRow value="Sandworm_AcidSpit_Direct"/>
       <FireJoint value="Jaw_C0_0_jnt"/>
       <PosOffset>
        <Element value="0"/>
        <Element value="0"/>
        <Element value="0"/>
       </PosOffset>
       <RotOffset>
        <Element value="0"/>
        <Element value="0"/>
        <Element value="0"/>
       </RotOffset>
       <UseJointTransformForOffsets value="true"/>
       <AccuracyBonus value="0"/>
       <SliceOverride value="slices/characters/spellslices/sandworm/sandworm_acid_spit_projectile.dynamicslice"/>
       <ForwardSpawnInfo value="false"/>
       <UseAmmo value="false"/>
       <AIAimAtTarget value="true"/>
       <AIUseSelectedPositionAction value="false"/>
       <AILeadTarget value="true"/>
       <ProjectileSpeed value="300"/>
       <HitScanPredictionSpeed value="300"/>
       <AimJoint value=""/>
       <AIMissMinDistance value="0"/>
       <AIMissMaxDistance value="0.5"/>
       <AILeadTargetMaxAngle value="45"/>
       <AIAimMaxAngle value="45"/>
       <AIRandomlySelectTargets value="false"/>
       <AIUseAllAvailableTargets value="true"/>
       <AIUseTargetGroundPos value="false"/>
       <AIAddTargetOffset value="true"/>
       <AITargetOffset>
        <Element value="0"/>
        <Element value="0"/>
        <Element value="-0.25"/>
       </AITargetOffset>
       <AIUseTargetFacingForOffset value="false"/>
       <Condition value=""/>
       <UseForwardFiringOffset value="false"/>
       <ForwardRotOffset>
        <Element value="0"/>
        <Element value="0"/>
        <Element value="0"/>
       </ForwardRotOffset>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="true"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="true"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="0.15000001"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="15"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="true"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value=""/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="2.3333333" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
   </Fragment>
  </Sandworm_Acid_Spit>
  <Sandworm_Acid_Balls>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="sandworm_acid_ball_intro" speed="2"/>
     <Blend ExitTime="-1" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="sandworm_acid_ball_loop" speed="2.3"/>
     <Blend ExitTime="-1" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="sandworm_acid_ball_loop" speed="2.3"/>
     <Blend ExitTime="-1" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="sandworm_acid_ball_loop" speed="2.3"/>
     <Blend ExitTime="-1" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="sandworm_acid_ball_outro" speed="2.3"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="2.5" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-RangedAttack" contextType="RangedAttackContext">
      <ProceduralParams>
       <RangedAttackName value="Acid_Ball"/>
       <ChargeValue value="0"/>
       <DamageTableRow value="Sandworm_AcidBall_Direct"/>
       <FireJoint value="Jaw_C0_0_jnt"/>
       <PosOffset>
        <Element value="0"/>
        <Element value="0"/>
        <Element value="0"/>
       </PosOffset>
       <RotOffset>
        <Element value="0"/>
        <Element value="0"/>
        <Element value="0"/>
       </RotOffset>
       <UseJointTransformForOffsets value="true"/>
       <AccuracyBonus value="0"/>
       <SliceOverride value="slices/characters/spellslices/sandworm/sandworm_acid_ball.dynamicslice"/>
       <ForwardSpawnInfo value="true"/>
       <UseAmmo value="false"/>
       <AIAimAtTarget value="true"/>
       <AIUseSelectedPositionAction value="false"/>
       <AILeadTarget value="true"/>
       <ProjectileSpeed value="50"/>
       <HitScanPredictionSpeed value="50"/>
       <AimJoint value=""/>
       <AIMissMinDistance value="0"/>
       <AIMissMaxDistance value="0.5"/>
       <AILeadTargetMaxAngle value="60"/>
       <AIAimMaxAngle value="90"/>
       <AIRandomlySelectTargets value="false"/>
       <AIUseAllAvailableTargets value="true"/>
       <AIUseTargetGroundPos value="false"/>
       <AIAddTargetOffset value="true"/>
       <AITargetOffset>
        <Element value="0"/>
        <Element value="0"/>
        <Element value="0"/>
       </AITargetOffset>
       <AIUseTargetFacingForOffset value="false"/>
       <Condition value=""/>
       <UseForwardFiringOffset value="false"/>
       <ForwardRotOffset>
        <Element value="0"/>
        <Element value="0"/>
        <Element value="0"/>
       </ForwardRotOffset>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="3.7" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-RangedAttack" contextType="RangedAttackContext">
      <ProceduralParams>
       <RangedAttackName value="Acid_Ball"/>
       <ChargeValue value="0"/>
       <DamageTableRow value="Sandworm_AcidBall_Direct"/>
       <FireJoint value="Jaw_C0_0_jnt"/>
       <PosOffset>
        <Element value="0"/>
        <Element value="0"/>
        <Element value="0"/>
       </PosOffset>
       <RotOffset>
        <Element value="0"/>
        <Element value="0"/>
        <Element value="0"/>
       </RotOffset>
       <UseJointTransformForOffsets value="true"/>
       <AccuracyBonus value="0"/>
       <SliceOverride value="slices/characters/spellslices/sandworm/sandworm_acid_ball.dynamicslice"/>
       <ForwardSpawnInfo value="true"/>
       <UseAmmo value="false"/>
       <AIAimAtTarget value="true"/>
       <AIUseSelectedPositionAction value="false"/>
       <AILeadTarget value="true"/>
       <ProjectileSpeed value="50"/>
       <HitScanPredictionSpeed value="50"/>
       <AimJoint value=""/>
       <AIMissMinDistance value="0"/>
       <AIMissMaxDistance value="0.5"/>
       <AILeadTargetMaxAngle value="60"/>
       <AIAimMaxAngle value="90"/>
       <AIRandomlySelectTargets value="false"/>
       <AIUseAllAvailableTargets value="true"/>
       <AIUseTargetGroundPos value="false"/>
       <AIAddTargetOffset value="true"/>
       <AITargetOffset>
        <Element value="0"/>
        <Element value="0"/>
        <Element value="0"/>
       </AITargetOffset>
       <AIUseTargetFacingForOffset value="false"/>
       <Condition value=""/>
       <UseForwardFiringOffset value="false"/>
       <ForwardRotOffset>
        <Element value="0"/>
        <Element value="0"/>
        <Element value="0"/>
       </ForwardRotOffset>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="4.9000001" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-RangedAttack" contextType="RangedAttackContext">
      <ProceduralParams>
       <RangedAttackName value="Acid_Ball"/>
       <ChargeValue value="0"/>
       <DamageTableRow value="Sandworm_AcidBall_Direct"/>
       <FireJoint value="Jaw_C0_0_jnt"/>
       <PosOffset>
        <Element value="0"/>
        <Element value="0"/>
        <Element value="0"/>
       </PosOffset>
       <RotOffset>
        <Element value="0"/>
        <Element value="0"/>
        <Element value="0"/>
       </RotOffset>
       <UseJointTransformForOffsets value="true"/>
       <AccuracyBonus value="0"/>
       <SliceOverride value="slices/characters/spellslices/sandworm/sandworm_acid_ball.dynamicslice"/>
       <ForwardSpawnInfo value="true"/>
       <UseAmmo value="false"/>
       <AIAimAtTarget value="true"/>
       <AIUseSelectedPositionAction value="false"/>
       <AILeadTarget value="true"/>
       <ProjectileSpeed value="50"/>
       <HitScanPredictionSpeed value="50"/>
       <AimJoint value=""/>
       <AIMissMinDistance value="0"/>
       <AIMissMaxDistance value="0.5"/>
       <AILeadTargetMaxAngle value="60"/>
       <AIAimMaxAngle value="90"/>
       <AIRandomlySelectTargets value="false"/>
       <AIUseAllAvailableTargets value="true"/>
       <AIUseTargetGroundPos value="false"/>
       <AIAddTargetOffset value="true"/>
       <AITargetOffset>
        <Element value="0"/>
        <Element value="0"/>
        <Element value="0"/>
       </AITargetOffset>
       <AIUseTargetFacingForOffset value="false"/>
       <Condition value=""/>
       <UseForwardFiringOffset value="false"/>
       <ForwardRotOffset>
        <Element value="0"/>
        <Element value="0"/>
        <Element value="0"/>
       </ForwardRotOffset>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="true"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="true"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="0.050000001"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="15"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="true"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value="Selected_Pos"/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
   </Fragment>
  </Sandworm_Acid_Balls>
  <Sandworm_Submerge_Intro>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.5" CurveType="0"/>
     <Animation name="sandworm_hide_intro"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="2.03" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="SpawnSlice" contextType="">
      <ProceduralParams>
       <SliceToSpawn value="slices/Arenas/Events/Sandworm/BASE_-_Angry_Earth_-_Desert_Scorpion_Impaler_Sandworm_Fred.dynamicslice"/>
       <DespawnOnExit value="false"/>
       <SliceDestructionCageAction value=""/>
       <UseAreaSpawner value="true"/>
       <SpawnOnClientsOnly value="false"/>
       <CanBeDisabledByEmoteFxSettings value="false"/>
       <TargetPosBlackboardKey value=""/>
       <SpawnCount value="1"/>
       <SpawnLocationOverrideIndex value="0"/>
       <Condition value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="2.03" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="SpawnSlice" contextType="">
      <ProceduralParams>
       <SliceToSpawn value="slices/Arenas/Events/Sandworm/BASE_-_Angry_Earth_-_Desert_Scorpion_Impaler_Sandworm_Ted.dynamicslice"/>
       <DespawnOnExit value="false"/>
       <SliceDestructionCageAction value=""/>
       <UseAreaSpawner value="true"/>
       <SpawnOnClientsOnly value="false"/>
       <CanBeDisabledByEmoteFxSettings value="false"/>
       <TargetPosBlackboardKey value=""/>
       <SpawnCount value="1"/>
       <SpawnLocationOverrideIndex value="1"/>
       <Condition value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="3.5" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="DisableCollision" contextType="DisableCollisionContext">
      <ProceduralParams>
       <ModifyStaticCollision value="true"/>
       <ModifyActorCollision value="true"/>
       <ModifyPlayerToPlayerCollision value="false"/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Invulnerability" contextType="InvulnerabilityContext">
      <ProceduralParams>
       <ShowImmuneOnHit value="true"/>
       <ImmuneText value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Named" contextType="NamedContext">
      <ProceduralParams>
       <Name value="Nameplate_Off"/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Named" contextType="NamedContext">
      <ProceduralParams>
       <Name value="Aura_Off"/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="true"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="true"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="0.050000001"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="15"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="true"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value="Selected_Pos"/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
   </Fragment>
  </Sandworm_Submerge_Intro>
  <Sandworm_Emerge>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="sandworm_hide_loop" flags="Loop"/>
     <Blend ExitTime="8" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="sandworm_spawn"/>
     <Blend ExitTime="1" StartTime="0" Duration="2.5" CurveType="0"/>
     <Animation name="sandworm_acid_storm_loop"/>
     <Blend ExitTime="3" StartTime="0" Duration="1" CurveType="0"/>
     <Animation name="sandworm_acid_storm_end"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="8.3000002" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="SpawnSlice" contextType="">
      <ProceduralParams>
       <SliceToSpawn value="slices/Arenas/Events/Sandworm/Phase3/Sandworm_ArenaEncounter_Emerge_Explosion_AOE.dynamicslice"/>
       <DespawnOnExit value="false"/>
       <SliceDestructionCageAction value=""/>
       <UseAreaSpawner value="true"/>
       <SpawnOnClientsOnly value="false"/>
       <CanBeDisabledByEmoteFxSettings value="false"/>
       <TargetPosBlackboardKey value=""/>
       <SpawnCount value="1"/>
       <SpawnLocationOverrideIndex value="2"/>
       <Condition value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="8" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Named" contextType="NamedContext">
      <ProceduralParams>
       <Name value="Nameplate_On"/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="10.8" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Named" contextType="NamedContext">
      <ProceduralParams>
       <Name value="Aura_On"/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="12" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Named" contextType="NamedContext">
      <ProceduralParams>
       <Name value="TOD_On"/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="13" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="SpawnSlice" contextType="">
      <ProceduralParams>
       <SliceToSpawn value="slices/Arenas/Events/Sandworm/PointSpawner_1wp_AngryEarth_Scorpion_Sandworm.dynamicslice"/>
       <DespawnOnExit value="false"/>
       <SliceDestructionCageAction value=""/>
       <UseAreaSpawner value="true"/>
       <SpawnOnClientsOnly value="false"/>
       <CanBeDisabledByEmoteFxSettings value="false"/>
       <TargetPosBlackboardKey value=""/>
       <SpawnCount value="1"/>
       <SpawnLocationOverrideIndex value="9"/>
       <Condition value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="13" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="SpawnSlice" contextType="">
      <ProceduralParams>
       <SliceToSpawn value="slices/Arenas/Events/Sandworm/PointSpawner_1wp_AngryEarth_Scorpion_Sandworm.dynamicslice"/>
       <DespawnOnExit value="false"/>
       <SliceDestructionCageAction value=""/>
       <UseAreaSpawner value="true"/>
       <SpawnOnClientsOnly value="false"/>
       <CanBeDisabledByEmoteFxSettings value="false"/>
       <TargetPosBlackboardKey value=""/>
       <SpawnCount value="1"/>
       <SpawnLocationOverrideIndex value="10"/>
       <Condition value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="13" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="SpawnSlice" contextType="">
      <ProceduralParams>
       <SliceToSpawn value="slices/Arenas/Events/Sandworm/PointSpawner_1wp_AngryEarth_Scorpion_Sandworm.dynamicslice"/>
       <DespawnOnExit value="false"/>
       <SliceDestructionCageAction value=""/>
       <UseAreaSpawner value="true"/>
       <SpawnOnClientsOnly value="false"/>
       <CanBeDisabledByEmoteFxSettings value="false"/>
       <TargetPosBlackboardKey value=""/>
       <SpawnCount value="1"/>
       <SpawnLocationOverrideIndex value="11"/>
       <Condition value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="13" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="SpawnSlice" contextType="">
      <ProceduralParams>
       <SliceToSpawn value="slices/Arenas/Events/Sandworm/PointSpawner_1wp_AngryEarth_Scorpion_Sandworm.dynamicslice"/>
       <DespawnOnExit value="false"/>
       <SliceDestructionCageAction value=""/>
       <UseAreaSpawner value="true"/>
       <SpawnOnClientsOnly value="false"/>
       <CanBeDisabledByEmoteFxSettings value="false"/>
       <TargetPosBlackboardKey value=""/>
       <SpawnCount value="1"/>
       <SpawnLocationOverrideIndex value="12"/>
       <Condition value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="13" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="SpawnSlice" contextType="">
      <ProceduralParams>
       <SliceToSpawn value="slices/Arenas/Events/Sandworm/PointSpawner_1wp_AngryEarth_Scorpion_Sandworm.dynamicslice"/>
       <DespawnOnExit value="false"/>
       <SliceDestructionCageAction value=""/>
       <UseAreaSpawner value="true"/>
       <SpawnOnClientsOnly value="false"/>
       <CanBeDisabledByEmoteFxSettings value="false"/>
       <TargetPosBlackboardKey value=""/>
       <SpawnCount value="1"/>
       <SpawnLocationOverrideIndex value="13"/>
       <Condition value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="13" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="SpawnSlice" contextType="">
      <ProceduralParams>
       <SliceToSpawn value="slices/Arenas/Events/Sandworm/PointSpawner_1wp_AngryEarth_Scorpion_Sandworm.dynamicslice"/>
       <DespawnOnExit value="false"/>
       <SliceDestructionCageAction value=""/>
       <UseAreaSpawner value="true"/>
       <SpawnOnClientsOnly value="false"/>
       <CanBeDisabledByEmoteFxSettings value="false"/>
       <TargetPosBlackboardKey value=""/>
       <SpawnCount value="1"/>
       <SpawnLocationOverrideIndex value="14"/>
       <Condition value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="13" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="SpawnSlice" contextType="">
      <ProceduralParams>
       <SliceToSpawn value="slices/Arenas/Events/Sandworm/PointSpawner_1wp_AngryEarth_Scorpion_Sandworm.dynamicslice"/>
       <DespawnOnExit value="false"/>
       <SliceDestructionCageAction value=""/>
       <UseAreaSpawner value="true"/>
       <SpawnOnClientsOnly value="false"/>
       <CanBeDisabledByEmoteFxSettings value="false"/>
       <TargetPosBlackboardKey value=""/>
       <SpawnCount value="1"/>
       <SpawnLocationOverrideIndex value="15"/>
       <Condition value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="13" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="SpawnSlice" contextType="">
      <ProceduralParams>
       <SliceToSpawn value="slices/Arenas/Events/Sandworm/PointSpawner_1wp_AngryEarth_Scorpion_Sandworm.dynamicslice"/>
       <DespawnOnExit value="false"/>
       <SliceDestructionCageAction value=""/>
       <UseAreaSpawner value="true"/>
       <SpawnOnClientsOnly value="false"/>
       <CanBeDisabledByEmoteFxSettings value="false"/>
       <TargetPosBlackboardKey value=""/>
       <SpawnCount value="1"/>
       <SpawnLocationOverrideIndex value="16"/>
       <Condition value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="DisableCollision" contextType="DisableCollisionContext">
      <ProceduralParams>
       <ModifyStaticCollision value="true"/>
       <ModifyActorCollision value="false"/>
       <ModifyPlayerToPlayerCollision value="false"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="8" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Invulnerability" contextType="InvulnerabilityContext">
      <ProceduralParams>
       <ShowImmuneOnHit value="false"/>
       <ImmuneText value=""/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="8" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="true"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="true"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="0.050000001"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="15"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="true"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value="Selected_Pos"/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
   </Fragment>
  </Sandworm_Emerge>
  <Sandworm_Acid_Spew_Full>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="sandworm_acid_spew_full"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="true"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="true"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="0.050000001"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="15"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="true"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value="Selected_Pos"/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="2" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="SpawnSlice" contextType="">
      <ProceduralParams>
       <SliceToSpawn value="slices/arenas/events/sandworm/phase1/sandworm_arenaencounter_acid_spew.dynamicslice"/>
       <DespawnOnExit value="false"/>
       <SliceDestructionCageAction value=""/>
       <UseAreaSpawner value="true"/>
       <SpawnOnClientsOnly value="false"/>
       <CanBeDisabledByEmoteFxSettings value="false"/>
       <TargetPosBlackboardKey value=""/>
       <SpawnCount value="1"/>
       <SpawnLocationOverrideIndex value="3"/>
       <Condition value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="2.5999999" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="SpawnSlice" contextType="">
      <ProceduralParams>
       <SliceToSpawn value="slices/arenas/events/sandworm/phase1/sandworm_arenaencounter_acid_spew.dynamicslice"/>
       <DespawnOnExit value="false"/>
       <SliceDestructionCageAction value=""/>
       <UseAreaSpawner value="true"/>
       <SpawnOnClientsOnly value="false"/>
       <CanBeDisabledByEmoteFxSettings value="false"/>
       <TargetPosBlackboardKey value=""/>
       <SpawnCount value="1"/>
       <SpawnLocationOverrideIndex value="4"/>
       <Condition value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="3.1466668" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="SpawnSlice" contextType="">
      <ProceduralParams>
       <SliceToSpawn value="slices/arenas/events/sandworm/phase1/sandworm_arenaencounter_acid_spew.dynamicslice"/>
       <DespawnOnExit value="false"/>
       <SliceDestructionCageAction value=""/>
       <UseAreaSpawner value="true"/>
       <SpawnOnClientsOnly value="false"/>
       <CanBeDisabledByEmoteFxSettings value="false"/>
       <TargetPosBlackboardKey value=""/>
       <SpawnCount value="1"/>
       <SpawnLocationOverrideIndex value="5"/>
       <Condition value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="3.7586665" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="SpawnSlice" contextType="">
      <ProceduralParams>
       <SliceToSpawn value="slices/arenas/events/sandworm/phase1/sandworm_arenaencounter_acid_spew.dynamicslice"/>
       <DespawnOnExit value="false"/>
       <SliceDestructionCageAction value=""/>
       <UseAreaSpawner value="true"/>
       <SpawnOnClientsOnly value="false"/>
       <CanBeDisabledByEmoteFxSettings value="false"/>
       <TargetPosBlackboardKey value=""/>
       <SpawnCount value="1"/>
       <SpawnLocationOverrideIndex value="6"/>
       <Condition value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="4.1079998" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="SpawnSlice" contextType="">
      <ProceduralParams>
       <SliceToSpawn value="slices/arenas/events/sandworm/phase1/sandworm_arenaencounter_acid_spew.dynamicslice"/>
       <DespawnOnExit value="false"/>
       <SliceDestructionCageAction value=""/>
       <UseAreaSpawner value="true"/>
       <SpawnOnClientsOnly value="false"/>
       <CanBeDisabledByEmoteFxSettings value="false"/>
       <TargetPosBlackboardKey value=""/>
       <SpawnCount value="1"/>
       <SpawnLocationOverrideIndex value="7"/>
       <Condition value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="4.6533332" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="SpawnSlice" contextType="">
      <ProceduralParams>
       <SliceToSpawn value="slices/arenas/events/sandworm/phase1/sandworm_arenaencounter_acid_spew.dynamicslice"/>
       <DespawnOnExit value="false"/>
       <SliceDestructionCageAction value=""/>
       <UseAreaSpawner value="true"/>
       <SpawnOnClientsOnly value="false"/>
       <CanBeDisabledByEmoteFxSettings value="false"/>
       <TargetPosBlackboardKey value=""/>
       <SpawnCount value="1"/>
       <SpawnLocationOverrideIndex value="8"/>
       <Condition value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Invulnerability" contextType="InvulnerabilityContext">
      <ProceduralParams>
       <ShowImmuneOnHit value="true"/>
       <ImmuneText value="Invulnerable"/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Named" contextType="NamedContext">
      <ProceduralParams>
       <Name value="Nameplate_Off_"/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Named" contextType="NamedContext">
      <ProceduralParams>
       <Name value="Aura_Off_"/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
   </Fragment>
  </Sandworm_Acid_Spew_Full>
  <Sandworm_Body_Sweep>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="sandworm_ground_chomp" speed="1.55"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="0.60000002" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Sandworm_BodySweep"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeBox"/>
       <MeleeAttackShapeRadius value="0"/>
       <MeleeAttackCapsuleHalfHeight value="0"/>
       <MeleeAttackBoxDimensionsX value="10"/>
       <MeleeAttackBoxDimensionsY value="8"/>
       <MeleeAttackBoxDimensionsZ value="8"/>
       <JointName value="Tongue_C0_2_jnt"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="0"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="0"/>
       <AmmoSlotForScaling value="PaperdollSlotTypes::HEAD_SLOT"/>
       <ShapeAxesModifierCommands value=""/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="false"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="4.9000001" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="false"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="false"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="1080"/>
       <Radius value="7"/>
       <MaxAngle value="90"/>
       <Height value="5"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="false"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0.60000002" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Sandworm_BodySweep"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeBox"/>
       <MeleeAttackShapeRadius value="0"/>
       <MeleeAttackCapsuleHalfHeight value="0"/>
       <MeleeAttackBoxDimensionsX value="10"/>
       <MeleeAttackBoxDimensionsY value="5"/>
       <MeleeAttackBoxDimensionsZ value="3"/>
       <JointName value="R_Pincher_R0_0_jnt"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="0"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="0"/>
       <AmmoSlotForScaling value="PaperdollSlotTypes::HEAD_SLOT"/>
       <ShapeAxesModifierCommands value=""/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="false"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="4.9000001" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0.60000002" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Sandworm_BodySweep"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeBox"/>
       <MeleeAttackShapeRadius value="0"/>
       <MeleeAttackCapsuleHalfHeight value="0"/>
       <MeleeAttackBoxDimensionsX value="10"/>
       <MeleeAttackBoxDimensionsY value="5"/>
       <MeleeAttackBoxDimensionsZ value="3"/>
       <JointName value="L_Pincher_L0_0_jnt"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="0"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="0"/>
       <AmmoSlotForScaling value="PaperdollSlotTypes::HEAD_SLOT"/>
       <ShapeAxesModifierCommands value=""/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="false"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="4.9000001" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
   </Fragment>
  </Sandworm_Body_Sweep>
  <Victory>
   <Fragment BlendOutDuration="0.2" Tags="Submerged">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.5" CurveType="0"/>
     <Animation name="sandworm_spawn"/>
     <Blend ExitTime="2.1500001" StartTime="0" Duration="0.5" CurveType="0"/>
     <Animation name="sandworm_victory"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="true"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="true"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="0.050000001"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="15"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="true"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value="Selected_Pos"/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="4.75" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-CastSpell" contextType="CastSpellContext">
      <ProceduralParams>
       <SpellName value="AI_Boss_Victory_Wipe"/>
       <takeDurability value="false"/>
       <AIAimAtTarget value="true"/>
       <AILeadTarget value="false"/>
       <ProjectileSpeed value="100"/>
       <HitScanPredictionSpeed value="100"/>
       <AIMissMinDistance value="0.5"/>
       <AIMissMaxDistance value="1"/>
       <AILeadTargetMaxAngle value="45"/>
       <AIAimMaxAngle value="45"/>
       <Condition value=""/>
       <AITrackMinionSpawns value="false"/>
       <AIRandomlySelectTargets value="false"/>
       <UseAllAvailableTargets value="true"/>
       <AITargetOffsetInMeters>
        <Element value="0"/>
        <Element value="0"/>
        <Element value="0"/>
       </AITargetOffsetInMeters>
       <AIUseTargetFacingForOffset value="false"/>
       <BeamEntryName value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
   </Fragment>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.5" CurveType="0"/>
     <Animation name="sandworm_victory"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="true"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="true"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="0.050000001"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="15"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="true"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value="Selected_Pos"/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="2.5333333" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-CastSpell" contextType="CastSpellContext">
      <ProceduralParams>
       <SpellName value="AI_Boss_Victory_Wipe"/>
       <takeDurability value="false"/>
       <AIAimAtTarget value="true"/>
       <AILeadTarget value="false"/>
       <ProjectileSpeed value="100"/>
       <HitScanPredictionSpeed value="100"/>
       <AIMissMinDistance value="0.5"/>
       <AIMissMaxDistance value="1"/>
       <AILeadTargetMaxAngle value="45"/>
       <AIAimMaxAngle value="45"/>
       <Condition value=""/>
       <AITrackMinionSpawns value="false"/>
       <AIRandomlySelectTargets value="false"/>
       <UseAllAvailableTargets value="true"/>
       <AITargetOffsetInMeters>
        <Element value="0"/>
        <Element value="0"/>
        <Element value="0"/>
       </AITargetOffsetInMeters>
       <AIUseTargetFacingForOffset value="false"/>
       <BeamEntryName value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
   </Fragment>
  </Victory>
  <Sandworm_Body_Sweep_L>
   <Fragment BlendOutDuration="0.2" Tags="Season_02">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="baby_sandworm_body_sweep_l" speed="2.3"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="1" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Sandworm_BodySweep_L"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="2"/>
       <OffsetY value="-6"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="9"/>
       <MeleeAttackCapsuleHalfHeight value="5"/>
       <MeleeAttackBoxDimensionsX value="17"/>
       <MeleeAttackBoxDimensionsY value="2"/>
       <MeleeAttackBoxDimensionsZ value="10"/>
       <JointName value="Head_C0_0_jnt"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="120"/>
       <yRotationOffset value="40"/>
       <zRotationOffset value="0"/>
       <AmmoSlotForScaling value="PaperdollSlotTypes::HEAD_SLOT"/>
       <ShapeAxesModifierCommands value=""/>
       <DisableLOSCheck value="false"/>
       <UseEndAsCenter value="false"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="1.1500001" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="true"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="true"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="0.40000001"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="5"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="false"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value=""/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="1" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
   </Fragment>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="sandworm_body_sweep_l" speed="0.89999998"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="2.5" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Sandworm_BodySweep_L"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="5"/>
       <OffsetZ value="1"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeBox"/>
       <MeleeAttackShapeRadius value="0"/>
       <MeleeAttackCapsuleHalfHeight value="0"/>
       <MeleeAttackBoxDimensionsX value="17"/>
       <MeleeAttackBoxDimensionsY value="2"/>
       <MeleeAttackBoxDimensionsZ value="10"/>
       <JointName value="Head_C0_0_jnt"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="0"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="0"/>
       <AmmoSlotForScaling value="PaperdollSlotTypes::HEAD_SLOT"/>
       <ShapeAxesModifierCommands value=""/>
       <DisableLOSCheck value="false"/>
       <UseEndAsCenter value="false"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.75" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="true"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="true"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="0.1"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="15"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="true"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value="Selected_Pos"/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
   </Fragment>
  </Sandworm_Body_Sweep_L>
  <Sandworm_Body_Sweep_R>
   <Fragment BlendOutDuration="0.2" Tags="Season_02">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="baby_sandworm_body_sweep_r" speed="2.3499999"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="true"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="true"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="0.40000001"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="5"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="false"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value=""/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="1" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="1" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Sandworm_BodySweep_L"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="-4"/>
       <OffsetY value="-4"/>
       <OffsetZ value="-5"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeCapsule"/>
       <MeleeAttackShapeRadius value="9"/>
       <MeleeAttackCapsuleHalfHeight value="5"/>
       <MeleeAttackBoxDimensionsX value="17"/>
       <MeleeAttackBoxDimensionsY value="2"/>
       <MeleeAttackBoxDimensionsZ value="10"/>
       <JointName value="topJaw_C0_0_jnt"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="-50"/>
       <yRotationOffset value="60"/>
       <zRotationOffset value="0"/>
       <AmmoSlotForScaling value="PaperdollSlotTypes::HEAD_SLOT"/>
       <ShapeAxesModifierCommands value=""/>
       <DisableLOSCheck value="false"/>
       <UseEndAsCenter value="false"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.75000012" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
   </Fragment>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="sandworm_body_sweep_r" speed="0.89999998"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="true"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="true"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="0.1"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="15"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="true"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value="Selected_Pos"/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="2.5" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Sandworm_BodySweep_L"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="5"/>
       <OffsetZ value="1"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeBox"/>
       <MeleeAttackShapeRadius value="0"/>
       <MeleeAttackCapsuleHalfHeight value="0"/>
       <MeleeAttackBoxDimensionsX value="17"/>
       <MeleeAttackBoxDimensionsY value="2"/>
       <MeleeAttackBoxDimensionsZ value="10"/>
       <JointName value="Head_C0_0_jnt"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="0"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="0"/>
       <AmmoSlotForScaling value="PaperdollSlotTypes::HEAD_SLOT"/>
       <ShapeAxesModifierCommands value=""/>
       <DisableLOSCheck value="false"/>
       <UseEndAsCenter value="false"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.75" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
   </Fragment>
  </Sandworm_Body_Sweep_R>
  <Taunt>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Animation name="sandworm_taunt"/>
    </AnimLayer>
   </Fragment>
  </Taunt>
  <Sandworm_Emerge_With_Bombs>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="sandworm_hide_intro" speed="2"/>
     <Blend ExitTime="3.4000001" StartTime="0" Duration="0.47000027" CurveType="0"/>
     <Animation name="sandworm_spawn" speed="1.5"/>
     <Blend ExitTime="1.5999999" StartTime="0" Duration="1.0100002" CurveType="0"/>
     <Animation name="sandworm_idle_slow"/>
     <Blend ExitTime="1.4000001" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name=""/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="3.75" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="SpawnSlice" contextType="">
      <ProceduralParams>
       <SliceToSpawn value="slices/Arenas/Events/Sandworm/Phase3/Sandworm_ArenaEncounter_Emerge_Explosion_AOE.dynamicslice"/>
       <DespawnOnExit value="false"/>
       <SliceDestructionCageAction value=""/>
       <UseAreaSpawner value="true"/>
       <SpawnOnClientsOnly value="false"/>
       <CanBeDisabledByEmoteFxSettings value="false"/>
       <TargetPosBlackboardKey value=""/>
       <SpawnCount value="1"/>
       <SpawnLocationOverrideIndex value="2"/>
       <Condition value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="3.4000001" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Named" contextType="NamedContext">
      <ProceduralParams>
       <Name value="Nameplate_On"/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="3.5" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-RangedAttack" contextType="RangedAttackContext">
      <ProceduralParams>
       <RangedAttackName value="Worm_Pellet"/>
       <ChargeValue value="0"/>
       <DamageTableRow value="Sandworm_Emerge"/>
       <FireJoint value="xform_C0_0_jnt"/>
       <PosOffset>
        <Element value="0"/>
        <Element value="0"/>
        <Element value="3"/>
       </PosOffset>
       <RotOffset>
        <Element value="0"/>
        <Element value="0"/>
        <Element value="0"/>
       </RotOffset>
       <UseJointTransformForOffsets value="true"/>
       <AccuracyBonus value="0"/>
       <SliceOverride value="slices/arenas/events/sandworm/phase3/sandworm_arenaencounter_wormpellet_projectile_rapid.dynamicslice"/>
       <ForwardSpawnInfo value="false"/>
       <UseAmmo value="false"/>
       <AIAimAtTarget value="true"/>
       <AIUseSelectedPositionAction value="false"/>
       <AILeadTarget value="false"/>
       <ProjectileSpeed value="25"/>
       <HitScanPredictionSpeed value="50"/>
       <AimJoint value=""/>
       <AIMissMinDistance value="0"/>
       <AIMissMaxDistance value="0.5"/>
       <AILeadTargetMaxAngle value="60"/>
       <AIAimMaxAngle value="90"/>
       <AIRandomlySelectTargets value="false"/>
       <AIUseAllAvailableTargets value="true"/>
       <AIUseTargetGroundPos value="false"/>
       <AIAddTargetOffset value="true"/>
       <AITargetOffset>
        <Element value="0"/>
        <Element value="0"/>
        <Element value="0"/>
       </AITargetOffset>
       <AIUseTargetFacingForOffset value="false"/>
       <Condition value=""/>
       <UseForwardFiringOffset value="false"/>
       <ForwardRotOffset>
        <Element value="0"/>
        <Element value="0"/>
        <Element value="0"/>
       </ForwardRotOffset>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="true"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="true"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="0.050000001"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="15"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="true"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value="Selected_Pos"/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
   </Fragment>
  </Sandworm_Emerge_With_Bombs>
  <Sandworm_Bite_R>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="sandworm_bite_r"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="2.25" StartTime="0" Duration="0.0015679598" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Sandworm_Bite"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="5"/>
       <OffsetZ value="2"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeSphere"/>
       <MeleeAttackShapeRadius value="4"/>
       <MeleeAttackCapsuleHalfHeight value="0"/>
       <MeleeAttackBoxDimensionsX value="10"/>
       <MeleeAttackBoxDimensionsY value="10"/>
       <MeleeAttackBoxDimensionsZ value="10"/>
       <JointName value="Head_C0_0_jnt"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="0"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="0"/>
       <AmmoSlotForScaling value="PaperdollSlotTypes::HEAD_SLOT"/>
       <ShapeAxesModifierCommands value=""/>
       <DisableLOSCheck value="false"/>
       <UseEndAsCenter value="false"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.54999995" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="false"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="false"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="1080"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="5"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="false"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
   </Fragment>
  </Sandworm_Bite_R>
  <Sandworm_Bite_L>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="sandworm_bite_l"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="2.25" StartTime="0" Duration="0.0015679598" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Sandworm_Bite"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="5"/>
       <OffsetZ value="2"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeSphere"/>
       <MeleeAttackShapeRadius value="4"/>
       <MeleeAttackCapsuleHalfHeight value="0"/>
       <MeleeAttackBoxDimensionsX value="10"/>
       <MeleeAttackBoxDimensionsY value="10"/>
       <MeleeAttackBoxDimensionsZ value="10"/>
       <JointName value="Head_C0_0_jnt"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="0"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="0"/>
       <AmmoSlotForScaling value="PaperdollSlotTypes::HEAD_SLOT"/>
       <ShapeAxesModifierCommands value=""/>
       <DisableLOSCheck value="false"/>
       <UseEndAsCenter value="false"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.54999995" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="false"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="false"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="1080"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="5"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="false"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
   </Fragment>
  </Sandworm_Bite_L>
  <BabySandworm_Submerge_Intro>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.5" CurveType="0"/>
     <Animation name="baby_sandworm_submerge_intro"/>
     <Blend ExitTime="-1" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="baby_sandworm_submerge_loop"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="1.55" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="DisableCollision" contextType="DisableCollisionContext">
      <ProceduralParams>
       <ModifyStaticCollision value="true"/>
       <ModifyActorCollision value="true"/>
       <ModifyPlayerToPlayerCollision value="false"/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Invulnerability" contextType="InvulnerabilityContext">
      <ProceduralParams>
       <ShowImmuneOnHit value="true"/>
       <ImmuneText value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Named" contextType="NamedContext">
      <ProceduralParams>
       <Name value="Nameplate_Off"/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
   </Fragment>
  </BabySandworm_Submerge_Intro>
  <BabySandworm_Submerge_Loop>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="baby_sandworm_submerge_loop" flags="Loop"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="DisableCollision" contextType="DisableCollisionContext">
      <ProceduralParams>
       <ModifyStaticCollision value="true"/>
       <ModifyActorCollision value="true"/>
       <ModifyPlayerToPlayerCollision value="false"/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Invulnerability" contextType="InvulnerabilityContext">
      <ProceduralParams>
       <ShowImmuneOnHit value="true"/>
       <ImmuneText value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.30000001" CurveType="0"/>
     <Procedural type="HideAttachment" contextType="">
      <ProceduralParams>
       <AttachmentName value="sandworm_mesh"/>
       <ForceVisibleOnExit value="true"/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
   </Fragment>
  </BabySandworm_Submerge_Loop>
  <BabySandworm_Submerge_Outro>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="baby_sandworm_submerge_end"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Named" contextType="NamedContext">
      <ProceduralParams>
       <Name value="Nameplate_On"/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="true"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="false"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="1080"/>
       <Radius value="20"/>
       <MaxAngle value="180"/>
       <Height value="5"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="true"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value=""/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.1" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
     <Blend ExitTime="0.625" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="true"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="true"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="0.2"/>
       <Radius value="20"/>
       <MaxAngle value="180"/>
       <Height value="5"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="true"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value=""/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="1.5749999" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0.22499999" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Sandworm_BodySweep_L"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeSphere"/>
       <MeleeAttackShapeRadius value="8"/>
       <MeleeAttackCapsuleHalfHeight value="0"/>
       <MeleeAttackBoxDimensionsX value="17"/>
       <MeleeAttackBoxDimensionsY value="2"/>
       <MeleeAttackBoxDimensionsZ value="10"/>
       <JointName value=""/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="0"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="0"/>
       <AmmoSlotForScaling value="PaperdollSlotTypes::HEAD_SLOT"/>
       <ShapeAxesModifierCommands value=""/>
       <DisableLOSCheck value="false"/>
       <UseEndAsCenter value="false"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.15000001" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk2"/>
       <DamageTableRow value="Sandworm_BodySweep_L"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="0"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeSphere"/>
       <MeleeAttackShapeRadius value="12"/>
       <MeleeAttackCapsuleHalfHeight value="0"/>
       <MeleeAttackBoxDimensionsX value="17"/>
       <MeleeAttackBoxDimensionsY value="2"/>
       <MeleeAttackBoxDimensionsZ value="10"/>
       <JointName value=""/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="0"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="0"/>
       <AmmoSlotForScaling value="PaperdollSlotTypes::HEAD_SLOT"/>
       <ShapeAxesModifierCommands value=""/>
       <DisableLOSCheck value="false"/>
       <UseEndAsCenter value="false"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.25" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
   </Fragment>
  </BabySandworm_Submerge_Outro>
  <Sandworm_Submerge_Loop>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="sandworm_hide_loop" flags="Loop"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="DisableCollision" contextType="DisableCollisionContext">
      <ProceduralParams>
       <ModifyStaticCollision value="true"/>
       <ModifyActorCollision value="false"/>
       <ModifyPlayerToPlayerCollision value="false"/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Invulnerability" contextType="InvulnerabilityContext">
      <ProceduralParams>
       <ShowImmuneOnHit value="false"/>
       <ImmuneText value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
   </Fragment>
  </Sandworm_Submerge_Loop>
  <Sandworm_Resonant_Roar_Ranged>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="3" Duration="0.40000001" CurveType="0"/>
     <Animation name="sandworm_spawn" speed="1.5"/>
     <Blend ExitTime="2.7" StartTime="0" Duration="0.85000002" CurveType="0"/>
     <Animation name="sandworm_taunt" speed="1.5"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="2.9152267" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="SpawnSlice" contextType="">
      <ProceduralParams>
       <SliceToSpawn value="slices/Arenas/Events/Sandworm/BASE_-_Angry_Earth_-_Desert_Scorpion_Slinger_Sandworm.dynamicslice"/>
       <DespawnOnExit value="false"/>
       <SliceDestructionCageAction value=""/>
       <UseAreaSpawner value="true"/>
       <SpawnOnClientsOnly value="false"/>
       <CanBeDisabledByEmoteFxSettings value="false"/>
       <TargetPosBlackboardKey value=""/>
       <SpawnCount value="1"/>
       <SpawnLocationOverrideIndex value="9"/>
       <Condition value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="2.9152267" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="SpawnSlice" contextType="">
      <ProceduralParams>
       <SliceToSpawn value="slices/Arenas/Events/Sandworm/BASE_-_Angry_Earth_-_Desert_Scorpion_Slinger_Sandworm.dynamicslice"/>
       <DespawnOnExit value="false"/>
       <SliceDestructionCageAction value=""/>
       <UseAreaSpawner value="true"/>
       <SpawnOnClientsOnly value="false"/>
       <CanBeDisabledByEmoteFxSettings value="false"/>
       <TargetPosBlackboardKey value=""/>
       <SpawnCount value="1"/>
       <SpawnLocationOverrideIndex value="10"/>
       <Condition value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="2.9152267" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="SpawnSlice" contextType="">
      <ProceduralParams>
       <SliceToSpawn value="slices/Arenas/Events/Sandworm/BASE_-_Angry_Earth_-_Desert_Scorpion_Slinger_Sandworm.dynamicslice"/>
       <DespawnOnExit value="false"/>
       <SliceDestructionCageAction value=""/>
       <UseAreaSpawner value="true"/>
       <SpawnOnClientsOnly value="false"/>
       <CanBeDisabledByEmoteFxSettings value="false"/>
       <TargetPosBlackboardKey value=""/>
       <SpawnCount value="1"/>
       <SpawnLocationOverrideIndex value="11"/>
       <Condition value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="2.9152267" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="SpawnSlice" contextType="">
      <ProceduralParams>
       <SliceToSpawn value="slices/Arenas/Events/Sandworm/BASE_-_Angry_Earth_-_Desert_Scorpion_Slinger_Sandworm.dynamicslice"/>
       <DespawnOnExit value="false"/>
       <SliceDestructionCageAction value=""/>
       <UseAreaSpawner value="true"/>
       <SpawnOnClientsOnly value="false"/>
       <CanBeDisabledByEmoteFxSettings value="false"/>
       <TargetPosBlackboardKey value=""/>
       <SpawnCount value="1"/>
       <SpawnLocationOverrideIndex value="12"/>
       <Condition value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="2.9152267" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="SpawnSlice" contextType="">
      <ProceduralParams>
       <SliceToSpawn value="slices/Arenas/Events/Sandworm/BASE_-_Angry_Earth_-_Desert_Scorpion_Slinger_Sandworm.dynamicslice"/>
       <DespawnOnExit value="false"/>
       <SliceDestructionCageAction value=""/>
       <UseAreaSpawner value="true"/>
       <SpawnOnClientsOnly value="false"/>
       <CanBeDisabledByEmoteFxSettings value="false"/>
       <TargetPosBlackboardKey value=""/>
       <SpawnCount value="1"/>
       <SpawnLocationOverrideIndex value="15"/>
       <Condition value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="2.9152267" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="SpawnSlice" contextType="">
      <ProceduralParams>
       <SliceToSpawn value="slices/Arenas/Events/Sandworm/BASE_-_Angry_Earth_-_Desert_Scorpion_Slinger_Sandworm.dynamicslice"/>
       <DespawnOnExit value="false"/>
       <SliceDestructionCageAction value=""/>
       <UseAreaSpawner value="true"/>
       <SpawnOnClientsOnly value="false"/>
       <CanBeDisabledByEmoteFxSettings value="false"/>
       <TargetPosBlackboardKey value=""/>
       <SpawnCount value="1"/>
       <SpawnLocationOverrideIndex value="16"/>
       <Condition value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="true"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="true"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="0.050000001"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="15"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="true"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value="Selected_Pos"/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="3.55" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="SpawnSlice" contextType="">
      <ProceduralParams>
       <SliceToSpawn value="slices/Arenas/Events/Sandworm/BASE_-_AngryEarth_-_SandElemental_Heavy_Sandworm.dynamicslice"/>
       <DespawnOnExit value="false"/>
       <SliceDestructionCageAction value=""/>
       <UseAreaSpawner value="true"/>
       <SpawnOnClientsOnly value="false"/>
       <CanBeDisabledByEmoteFxSettings value="false"/>
       <TargetPosBlackboardKey value=""/>
       <SpawnCount value="1"/>
       <SpawnLocationOverrideIndex value="23"/>
       <Condition value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="3.75" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="SpawnSlice" contextType="">
      <ProceduralParams>
       <SliceToSpawn value="slices/Arenas/Events/Sandworm/BASE_-_AngryEarth_-_SandElemental_Heavy_Sandworm.dynamicslice"/>
       <DespawnOnExit value="false"/>
       <SliceDestructionCageAction value=""/>
       <UseAreaSpawner value="true"/>
       <SpawnOnClientsOnly value="false"/>
       <CanBeDisabledByEmoteFxSettings value="false"/>
       <TargetPosBlackboardKey value=""/>
       <SpawnCount value="1"/>
       <SpawnLocationOverrideIndex value="24"/>
       <Condition value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="3.3348434" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="SpawnSlice" contextType="">
      <ProceduralParams>
       <SliceToSpawn value="slices/Arenas/Events/Sandworm/BASE_-_Angry_Earth_-_Sand_Elemental_Shaman_Sandworm.dynamicslice"/>
       <DespawnOnExit value="false"/>
       <SliceDestructionCageAction value=""/>
       <UseAreaSpawner value="true"/>
       <SpawnOnClientsOnly value="false"/>
       <CanBeDisabledByEmoteFxSettings value="false"/>
       <TargetPosBlackboardKey value=""/>
       <SpawnCount value="1"/>
       <SpawnLocationOverrideIndex value="0"/>
       <Condition value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="2.9152267" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="SpawnSlice" contextType="">
      <ProceduralParams>
       <SliceToSpawn value="slices/Arenas/Events/Sandworm/BASE_-_Angry_Earth_-_Sand_Elemental_Shaman_Sandworm.dynamicslice"/>
       <DespawnOnExit value="false"/>
       <SliceDestructionCageAction value=""/>
       <UseAreaSpawner value="true"/>
       <SpawnOnClientsOnly value="false"/>
       <CanBeDisabledByEmoteFxSettings value="false"/>
       <TargetPosBlackboardKey value=""/>
       <SpawnCount value="1"/>
       <SpawnLocationOverrideIndex value="5"/>
       <Condition value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="3.1822555" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="SpawnSlice" contextType="">
      <ProceduralParams>
       <SliceToSpawn value="slices/Arenas/Events/Sandworm/BASE_-_Angry_Earth_-_Sand_Elemental_Shaman_Sandworm.dynamicslice"/>
       <DespawnOnExit value="false"/>
       <SliceDestructionCageAction value=""/>
       <UseAreaSpawner value="true"/>
       <SpawnOnClientsOnly value="false"/>
       <CanBeDisabledByEmoteFxSettings value="false"/>
       <TargetPosBlackboardKey value=""/>
       <SpawnCount value="1"/>
       <SpawnLocationOverrideIndex value="6"/>
       <Condition value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="2.9152267" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="SpawnSlice" contextType="">
      <ProceduralParams>
       <SliceToSpawn value="slices/Arenas/Events/Sandworm/BASE_-_Angry_Earth_-_Sand_Elemental_Shaman_Sandworm.dynamicslice"/>
       <DespawnOnExit value="false"/>
       <SliceDestructionCageAction value=""/>
       <UseAreaSpawner value="true"/>
       <SpawnOnClientsOnly value="false"/>
       <CanBeDisabledByEmoteFxSettings value="false"/>
       <TargetPosBlackboardKey value=""/>
       <SpawnCount value="1"/>
       <SpawnLocationOverrideIndex value="1"/>
       <Condition value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
   </Fragment>
  </Sandworm_Resonant_Roar_Ranged>
  <Sandworm_Bite_Combo_LR>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="sandworm_bite_l"/>
     <Blend ExitTime="3.25" StartTime="1" Duration="0.69999999" CurveType="0"/>
     <Animation name="sandworm_bite_r"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="2.1900001" StartTime="0" Duration="0.0015679598" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Sandworm_Bite"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="6"/>
       <OffsetZ value="3"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeSphere"/>
       <MeleeAttackShapeRadius value="6"/>
       <MeleeAttackCapsuleHalfHeight value="0"/>
       <MeleeAttackBoxDimensionsX value="10"/>
       <MeleeAttackBoxDimensionsY value="10"/>
       <MeleeAttackBoxDimensionsZ value="10"/>
       <JointName value="Head_C0_0_jnt"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="0"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="0"/>
       <AmmoSlotForScaling value="PaperdollSlotTypes::HEAD_SLOT"/>
       <ShapeAxesModifierCommands value=""/>
       <DisableLOSCheck value="false"/>
       <UseEndAsCenter value="false"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.6099999" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="2.2750001" StartTime="0" Duration="0.0015679598" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Sandworm_Bite"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="-4"/>
       <OffsetY value="2.5"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeSphere"/>
       <MeleeAttackShapeRadius value="8"/>
       <MeleeAttackCapsuleHalfHeight value="0"/>
       <MeleeAttackBoxDimensionsX value="10"/>
       <MeleeAttackBoxDimensionsY value="10"/>
       <MeleeAttackBoxDimensionsZ value="10"/>
       <JointName value="xform_C0_0_jnt"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="0"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="0"/>
       <AmmoSlotForScaling value="PaperdollSlotTypes::HEAD_SLOT"/>
       <ShapeAxesModifierCommands value=""/>
       <DisableLOSCheck value="false"/>
       <UseEndAsCenter value="false"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.52499986" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="4.4000001" StartTime="0" Duration="0.0015679598" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk2"/>
       <DamageTableRow value="Sandworm_Bite"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="6"/>
       <OffsetZ value="3"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeSphere"/>
       <MeleeAttackShapeRadius value="6"/>
       <MeleeAttackCapsuleHalfHeight value="0"/>
       <MeleeAttackBoxDimensionsX value="10"/>
       <MeleeAttackBoxDimensionsY value="10"/>
       <MeleeAttackBoxDimensionsZ value="10"/>
       <JointName value="Head_C0_0_jnt"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="0"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="0"/>
       <AmmoSlotForScaling value="PaperdollSlotTypes::HEAD_SLOT"/>
       <ShapeAxesModifierCommands value=""/>
       <DisableLOSCheck value="false"/>
       <UseEndAsCenter value="false"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.5999999" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="4.5" StartTime="0" Duration="0.0015679598" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk2"/>
       <DamageTableRow value="Sandworm_Bite"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="4"/>
       <OffsetY value="2.5"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeSphere"/>
       <MeleeAttackShapeRadius value="8"/>
       <MeleeAttackCapsuleHalfHeight value="0"/>
       <MeleeAttackBoxDimensionsX value="10"/>
       <MeleeAttackBoxDimensionsY value="10"/>
       <MeleeAttackBoxDimensionsZ value="10"/>
       <JointName value="xform_C0_0_jnt"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="0"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="0"/>
       <AmmoSlotForScaling value="PaperdollSlotTypes::HEAD_SLOT"/>
       <ShapeAxesModifierCommands value=""/>
       <DisableLOSCheck value="false"/>
       <UseEndAsCenter value="false"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.5" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="false"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="false"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="1080"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="5"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="false"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
   </Fragment>
  </Sandworm_Bite_Combo_LR>
  <Sandworm_Bite_Combo_RL>
   <Fragment BlendOutDuration="0.2" Tags="">
    <AnimLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0.2" CurveType="0"/>
     <Animation name="sandworm_bite_r"/>
     <Blend ExitTime="3.25" StartTime="0.85000002" Duration="0.69999999" CurveType="0"/>
     <Animation name="sandworm_bite_l"/>
    </AnimLayer>
    <ProcLayer>
     <Blend ExitTime="2.25" StartTime="0" Duration="0.0015679598" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Sandworm_Bite"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="6"/>
       <OffsetZ value="3"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeSphere"/>
       <MeleeAttackShapeRadius value="6"/>
       <MeleeAttackCapsuleHalfHeight value="0"/>
       <MeleeAttackBoxDimensionsX value="10"/>
       <MeleeAttackBoxDimensionsY value="10"/>
       <MeleeAttackBoxDimensionsZ value="10"/>
       <JointName value="Head_C0_0_jnt"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="0"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="0"/>
       <AmmoSlotForScaling value="PaperdollSlotTypes::HEAD_SLOT"/>
       <ShapeAxesModifierCommands value=""/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="false"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.54999995" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="2.2750001" StartTime="0" Duration="0.0015679598" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk1"/>
       <DamageTableRow value="Sandworm_Bite"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="-4"/>
       <OffsetY value="2.5"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeSphere"/>
       <MeleeAttackShapeRadius value="8"/>
       <MeleeAttackCapsuleHalfHeight value="0"/>
       <MeleeAttackBoxDimensionsX value="10"/>
       <MeleeAttackBoxDimensionsY value="10"/>
       <MeleeAttackBoxDimensionsZ value="10"/>
       <JointName value="xform_C0_0_jnt"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="0"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="0"/>
       <AmmoSlotForScaling value="PaperdollSlotTypes::HEAD_SLOT"/>
       <ShapeAxesModifierCommands value=""/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="false"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.52499986" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="4.5" StartTime="0" Duration="0.0015679598" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk2"/>
       <DamageTableRow value="Sandworm_Bite"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="0"/>
       <OffsetY value="6"/>
       <OffsetZ value="3"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeSphere"/>
       <MeleeAttackShapeRadius value="6"/>
       <MeleeAttackCapsuleHalfHeight value="0"/>
       <MeleeAttackBoxDimensionsX value="10"/>
       <MeleeAttackBoxDimensionsY value="10"/>
       <MeleeAttackBoxDimensionsZ value="10"/>
       <JointName value="Head_C0_0_jnt"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="0"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="0"/>
       <AmmoSlotForScaling value="PaperdollSlotTypes::HEAD_SLOT"/>
       <ShapeAxesModifierCommands value=""/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="false"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.5250001" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="4.5999999" StartTime="0" Duration="0.0015679598" CurveType="0"/>
     <Procedural type="CAGE-Damage" contextType="DamageContext">
      <ProceduralParams>
       <DamageKey value="atk2"/>
       <DamageTableRow value="Sandworm_Bite"/>
       <DamageSelf value="false"/>
       <ScaleX value="1"/>
       <ScaleY value="1"/>
       <ScaleZ value="1"/>
       <OffsetX value="-4"/>
       <OffsetY value="2.5"/>
       <OffsetZ value="0"/>
       <MeleeAttackShapeCastType value="MeleeAttackShapeCastTypeSphere"/>
       <MeleeAttackShapeRadius value="8"/>
       <MeleeAttackCapsuleHalfHeight value="0"/>
       <MeleeAttackBoxDimensionsX value="10"/>
       <MeleeAttackBoxDimensionsY value="10"/>
       <MeleeAttackBoxDimensionsZ value="10"/>
       <JointName value="xform_C0_0_jnt"/>
       <UseOffhandWeapon value="false"/>
       <OverrideWeaponSlotAlias value="false"/>
       <xRotationOffset value="0"/>
       <yRotationOffset value="0"/>
       <zRotationOffset value="0"/>
       <AmmoSlotForScaling value="PaperdollSlotTypes::HEAD_SLOT"/>
       <ShapeAxesModifierCommands value=""/>
       <DisableLOSCheck value="true"/>
       <UseEndAsCenter value="false"/>
       <UseMaxEnvironmentImpactAngle value="true"/>
       <UseCameraPitch value="false"/>
       <takeDurability value="true"/>
       <takeDurabilityOnUse value="false"/>
       <Condition value=""/>
       <PulseLength value="0"/>
       <AffectAlliesOnly value="false"/>
       <IntervalLength value="0"/>
      </ProceduralParams>
     </Procedural>
     <Blend ExitTime="0.42500019" StartTime="0" Duration="0.2" CurveType="0"/>
     <Procedural type="" contextType=""/>
    </ProcLayer>
    <ProcLayer>
     <Blend ExitTime="0" StartTime="0" Duration="0" CurveType="0"/>
     <Procedural type="Homing" contextType="HomingContext">
      <ProceduralParams>
       <DrawDebug value="false"/>
       <LockInitialTargetPos value="false"/>
       <UseExponential value="false"/>
       <FallbackToInputDir value="false"/>
       <RepeatInitialInput value="true"/>
       <TurnRate value="1080"/>
       <Radius value="7"/>
       <MaxAngle value="180"/>
       <Height value="5"/>
       <RadiusWeight value="1"/>
       <AngleWeight value="1"/>
       <HeightWeight value="0"/>
       <MinConeWidth value="0"/>
       <MoveToTarget value="false"/>
       <MoveToDistance value="1"/>
       <MoveToDuration value="0.25"/>
       <MoveToVelocity value="0"/>
       <MaxMoveDistance value="0"/>
       <AllowRotationAfterReachingTargetAngle value="false"/>
       <AllowMovementAfterReachingTargetPos value="false"/>
       <AllowUpwardsMovement value="false"/>
       <UseRadiusforAITarget value="false"/>
       <CameraTargetLock value="false"/>
       <UseArc value="false"/>
       <AllowTargetSwitching value="true"/>
       <ArcLookAhead value="2"/>
       <ArcTargetAdjustZ value="0.5"/>
       <AITargetBlackboardPosition value=""/>
      </ProceduralParams>
     </Procedural>
    </ProcLayer>
   </Fragment>
  </Sandworm_Bite_Combo_RL>
 </FragmentList>
 <FragmentBlendList>
  <Blend from="Idle" to="Combat_Idle">
   <Variant from="" to="">
    <Fragment BlendOutDuration="0.2" selectTime="0" enterTime="0">
     <AnimLayer>
      <Blend ExitTime="0" StartTime="0" Duration="0.2" flags="TimeWarping" CurveType="0" terminal="1"/>
     </AnimLayer>
     <ProcLayer />
    </Fragment>
   </Variant>
  </Blend>
  <Blend from="Combat_Idle" to="Idle">
   <Variant from="" to="">
    <Fragment BlendOutDuration="0.2" selectTime="0" enterTime="0">
     <AnimLayer>
      <Blend ExitTime="0" StartTime="0" Duration="0.2" flags="TimeWarping" CurveType="0" terminal="1"/>
     </AnimLayer>
     <ProcLayer />
    </Fragment>
   </Variant>
  </Blend>
  <Blend from="Alert" to="Combat_Idle">
   <Variant from="" to="">
    <Fragment BlendOutDuration="0.2" selectTime="0" enterTime="0">
     <AnimLayer>
      <Blend ExitTime="0" StartTime="0" Duration="0.2" flags="TimeWarping" CurveType="0" terminal="1"/>
     </AnimLayer>
     <ProcLayer />
    </Fragment>
   </Variant>
  </Blend>
 </FragmentBlendList>
</AnimDB>
