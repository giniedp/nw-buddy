export type ExpressionConstant = 'ConsumablePotency' | 'Potency' | 'perkMultiplier' | 'attributePerkMultiplier'

export type ExpressionResource =
  | 'AffixStatDataTable'
  | 'Afflictions'
  | 'ArtifactsAbilityTable'
  | 'AttributeThresholdAbilityTable'
  | 'BlunderbussAbilityTable'
  | 'BowAbilityTable'
  | 'ConsumableItemDefinitions'
  | 'DamageTable'
  | 'FireMagicAbilityTable'
  | 'FlailAbilityTable'
  | 'GlobalAbilityTable'
  | 'GreatAxeAbilityTable'
  | 'GreatswordAbilityTable'
  | 'HatchetAbilityTable'
  | 'HouseItems'
  | 'IceMagicAbilityTable'
  | 'LifeMagicAbilityTable'
  | 'LootLimits'
  | 'ManaCosts_Player'
  | 'MusketAbilityTable'
  | 'PerksAbilityTable'
  | 'RapierAbilityTable'
  | 'SpearAbilityTable'
  | 'SpellDataTable_Bow'
  | 'SpellDataTable_FireMagic'
  | 'SpellDataTable_Flail'
  | 'SpellDataTable_Global'
  | 'SpellDataTable_GreatAxe'
  | 'SpellDataTable_Greatsword'
  | 'SpellDataTable_Hatchet'
  | 'SpellDataTable_IceMagic'
  | 'SpellDataTable_LifeMagic'
  | 'SpellDataTable_Musket'
  | 'SpellDataTable_Runes'
  | 'SpellDataTable_Sword'
  | 'SpellDataTable_VoidGauntlet'
  | 'SpellDataTable_WarHammer'
  | 'StaminaCosts_Player'
  | 'SwordAbilityTable'
  | 'Type_AbilityData'
  | 'Type_AffixStatData'
  | 'Type_DamageData'
  | 'Type_StatusEffectData'
  | 'Vitals_Player'
  | 'VoidGauntletAbilityTable'
  | 'WarHammerAbilityTable'

export type ExpressionVariable =
  | '$movement.jump$'
  | '$movement.walk$'
  | '$player.mount_dash$'
  | '$player.mount_summon$'
  | '$player.social_align$'
  | 'Amount'
  | 'Button'
  | 'ConsumablePotency'
  | 'GuildName'
  | 'ItemName'
  | 'LocalPlayerName'
  | 'Num'
  | 'NumSeconds'
  | 'Number'
  | 'POITags'
  | 'PlayerName'
  | 'Playername'
  | 'Potency'
  | 'Rank'
  | 'Reason'
  | 'TeleportSeconds'
  | 'TerritoryID'
  | 'Weight'
  | 'abilityName'
  | 'absorption'
  | 'accountProbationTimeRequired'
  | 'acres'
  | 'action'
  | 'actionName'
  | 'addedQuantity'
  | 'additional'
  | 'allowed'
  | 'ally'
  | 'allyColor'
  | 'amount'
  | 'amount1'
  | 'amount2'
  | 'areaName'
  | 'attackerOrDefenderSide'
  | 'attackingGuildName'
  | 'attribute'
  | 'attribute1'
  | 'attribute2'
  | 'attributeMax'
  | 'attributeName'
  | 'attributePoints'
  | 'attributePointsText'
  | 'attributeValue'
  | 'availablePoints'
  | 'azoth'
  | 'azothcost'
  | 'balance'
  | 'base'
  | 'baseGearScore'
  | 'baseValue'
  | 'beginHour'
  | 'bonus'
  | 'bonus2'
  | 'bonusPct'
  | 'bonusXpString'
  | 'boostModifier'
  | 'boostXpColor'
  | 'boostXpString'
  | 'bracketLevels'
  | 'bufferTime'
  | 'button_hint'
  | 'bxp'
  | 'category'
  | 'chapterTitle'
  | 'characterName'
  | 'characterProbationTimeRequired'
  | 'characters'
  | 'checkpoint'
  | 'claimName'
  | 'coin'
  | 'coinAmount'
  | 'coinImage'
  | 'color'
  | 'colorAttributeMax'
  | 'colorBonus'
  | 'colorCheckpoint'
  | 'colorHex'
  | 'colorHex1'
  | 'colorHex2'
  | 'colorProgress'
  | 'companyName'
  | 'competingEffect'
  | 'completionPercent'
  | 'cooldown'
  | 'cooldownDuraction'
  | 'cooldownTime'
  | 'cooldownTimeInfluence'
  | 'cooldownTimeWar'
  | 'cost'
  | 'count'
  | 'counterAttackColor'
  | 'craftable'
  | 'craftingStation'
  | 'craftingStationIcon'
  | 'creator'
  | 'creatorColor'
  | 'crimeList'
  | 'current'
  | 'currentPage'
  | 'currentPercent'
  | 'currentPlayers'
  | 'currentProgression'
  | 'currentProject'
  | 'currentRank'
  | 'currentTopicId'
  | 'currentValue'
  | 'damageAmount'
  | 'damageName'
  | 'damageType'
  | 'data'
  | 'date'
  | 'dateColor'
  | 'dateandtime'
  | 'day'
  | 'dayOfWeek'
  | 'days'
  | 'defendingColorHex'
  | 'defendingGuildName'
  | 'defense'
  | 'denominator'
  | 'denominatorColor'
  | 'description'
  | 'destinationName'
  | 'destinationWorldName'
  | 'difficulty'
  | 'discountPercent'
  | 'displayName'
  | 'distance'
  | 'distanceKilometers'
  | 'distanceMeters'
  | 'duration'
  | 'effect1'
  | 'effect2'
  | 'effect3'
  | 'end'
  | 'endDate'
  | 'endHour'
  | 'endTime'
  | 'enemy'
  | 'enemyColor'
  | 'entitlementRequirements'
  | 'error'
  | 'expansion'
  | 'expansionName'
  | 'expansion_name'
  | 'expedition'
  | 'expertiseName'
  | 'faction'
  | 'factionName'
  | 'factionRep'
  | 'factionTokens'
  | 'factionname'
  | 'fee'
  | 'filter'
  | 'filtered'
  | 'firstCycle'
  | 'fortName'
  | 'friendCount'
  | 'friendCountInFaction'
  | 'fromPlayerName'
  | 'frontEndContinue'
  | 'fuelremaining'
  | 'gatheringType'
  | 'gearScaling'
  | 'gearScore'
  | 'gearscore'
  | 'gearscoreMax'
  | 'gearscoreMin'
  | 'gemPerkName'
  | 'generator'
  | 'gmRankName'
  | 'gold'
  | 'groupIndex'
  | 'groupNumber'
  | 'groupSize'
  | 'groupSizeRequirement'
  | 'guild1'
  | 'guild2'
  | 'guildMasterRankName'
  | 'guildName'
  | 'have'
  | 'headerColor'
  | 'highNumber'
  | 'highlightColor'
  | 'hour'
  | 'hours'
  | 'hoursNeeded'
  | 'houseName'
  | 'icon'
  | 'included'
  | 'index'
  | 'infinityImage'
  | 'info'
  | 'instrument'
  | 'interactionName'
  | 'interactionText'
  | 'item'
  | 'itemAmount'
  | 'itemClassName'
  | 'itemColor'
  | 'itemCount'
  | 'itemName'
  | 'itemname'
  | 'key'
  | 'keyName'
  | 'keybind'
  | 'label'
  | 'lastOnlineTime'
  | 'level'
  | 'levelColor'
  | 'levelNum'
  | 'levelRequirement'
  | 'lightPluralOrSingle'
  | 'list'
  | 'lobbyCount'
  | 'location'
  | 'locationOne'
  | 'locationTwo'
  | 'loreTitle'
  | 'lowNumber'
  | 'magic'
  | 'maintWindow'
  | 'masteryName'
  | 'masteryPoints'
  | 'matchname'
  | 'material'
  | 'max'
  | 'maxAmount'
  | 'maxCharacter'
  | 'maxColor'
  | 'maxCount'
  | 'maxCount/100'
  | 'maxDistance'
  | 'maxFriends'
  | 'maxGatherLevel'
  | 'maxLevel'
  | 'maxPercent'
  | 'maxPlayers'
  | 'maxProgression'
  | 'maxRaidSize'
  | 'maxRank'
  | 'maxRosterMembers'
  | 'maxSlots'
  | 'maxValue'
  | 'maximum'
  | 'memberName'
  | 'members'
  | 'message'
  | 'milestone'
  | 'min'
  | 'minGroupSize'
  | 'minLevel'
  | 'minPlayers'
  | 'minValue'
  | 'minutes'
  | 'missionCount'
  | 'mode'
  | 'modifier'
  | 'modifierColor'
  | 'modifierOperator'
  | 'moneyText'
  | 'monstername'
  | 'month'
  | 'name'
  | 'name1'
  | 'name2'
  | 'name3'
  | 'name4'
  | 'name5'
  | 'need'
  | 'neededValue'
  | 'newAction'
  | 'newGeneral'
  | 'newPerkName'
  | 'newRank'
  | 'newRankName'
  | 'nextLevel'
  | 'nextRank'
  | 'nonCompanyNumber'
  | 'nonCompanyTotal'
  | 'num'
  | 'num1'
  | 'num2'
  | 'num3'
  | 'numAccepted'
  | 'numBuyOrders'
  | 'numCharacter'
  | 'numClaims'
  | 'numCompleted'
  | 'numHours'
  | 'numInvites'
  | 'numItems'
  | 'numItemsToRemove'
  | 'numLights'
  | 'numMembers'
  | 'numMinutes'
  | 'numOrders'
  | 'numOtherOutposts'
  | 'numPets'
  | 'numSellOrders'
  | 'numStorage'
  | 'numTotal'
  | 'numWars'
  | 'numWarsText'
  | 'number'
  | 'numberHigh'
  | 'numberLow'
  | 'numerator'
  | 'numeratorColor'
  | 'numplayers'
  | 'objective'
  | 'objectiveColor'
  | 'objectiveName'
  | 'oldAction'
  | 'oldActions'
  | 'oldGeneral'
  | 'onlineMembers'
  | 'onlineMembersInRank'
  | 'operator'
  | 'otherCycle'
  | 'outpostName'
  | 'owned'
  | 'ownershipPermissionType'
  | 'param0'
  | 'parent'
  | 'pendingValue'
  | 'percent'
  | 'percentComplete'
  | 'percentage'
  | 'performer'
  | 'period'
  | 'period1'
  | 'period2'
  | 'period3'
  | 'perkMultiplier'
  | 'perkName'
  | 'perkNameA'
  | 'perkNameB'
  | 'permissionsText'
  | 'petPluralOrSingle'
  | 'phase'
  | 'phaseColorHex'
  | 'pingType'
  | 'pitchValue'
  | 'player'
  | 'playerColor'
  | 'playerCount'
  | 'playerName'
  | 'playerTitle'
  | 'playername'
  | 'players'
  | 'playtimeNeeded'
  | 'poiName'
  | 'points'
  | 'preference'
  | 'price'
  | 'priceTotal'
  | 'product'
  | 'progressionName'
  | 'promotee'
  | 'promoter'
  | 'protectionDuration'
  | 'qtyHave'
  | 'qtyNeeded'
  | 'quantity'
  | 'questName'
  | 'radius'
  | 'rango'
  | 'rank'
  | 'rankName'
  | 'rankNumber'
  | 'rateValue'
  | 'reason'
  | 'recipient'
  | 'refund'
  | 'releaseName'
  | 'remaining'
  | 'remainingSelections'
  | 'repairLevel'
  | 'repairName'
  | 'required'
  | 'requiredLevel'
  | 'requirement'
  | 'resolutionPhaseColor'
  | 'resourceName'
  | 'resources'
  | 'restedModifier'
  | 'restedXpColor'
  | 'restedXpRemaining'
  | 'restedXpString'
  | 'resultEndIndex'
  | 'resultStartIndex'
  | 'reward'
  | 'rewardId'
  | 'role'
  | 'roleColor'
  | 'rotation'
  | 'rotationType'
  | 'scaleFactor'
  | 'scheduleAdjustmentType'
  | 'score'
  | 'scoreColor'
  | 'sec'
  | 'secRemaining'
  | 'seconds'
  | 'secondsTillTeleport'
  | 'selectedPerkName'
  | 'settlement'
  | 'settlementName'
  | 'sheet'
  | 'sheetname'
  | 'siegeType'
  | 'siegeType2'
  | 'siegeWindow'
  | 'situationReversedColor'
  | 'skill'
  | 'skillLevel'
  | 'skillLoc'
  | 'skillName'
  | 'skillreq'
  | 'skinName'
  | 'slot'
  | 'songName'
  | 'songname'
  | 'sortOption'
  | 'sourcePlayerName'
  | 'sourceType'
  | 'standing'
  | 'standingName'
  | 'standingRank'
  | 'standingTokens'
  | 'standingValue'
  | 'start'
  | 'startDate'
  | 'startTime'
  | 'stat'
  | 'statValue'
  | 'station'
  | 'stationName'
  | 'storagePluralOrSingle'
  | 'structure'
  | 'structureState'
  | 'subHeaderColor'
  | 'subheaderColor'
  | 'subtype'
  | 'tagName'
  | 'targetAmount'
  | 'targetGearScore'
  | 'targetName'
  | 'targetPlayerName'
  | 'tax'
  | 'team'
  | 'teamColor'
  | 'territory'
  | 'territoryID'
  | 'territoryName'
  | 'territoryNamee'
  | 'territoryText'
  | 'text'
  | 'textColor'
  | 'threshold'
  | 'tier'
  | 'tierName'
  | 'tierRequired'
  | 'tierString'
  | 'tiername'
  | 'time'
  | 'timeLeft'
  | 'timeRemaining'
  | 'timeRemainingShorthand'
  | 'timeType'
  | 'timeValue'
  | 'timeZone'
  | 'timedRaceCount'
  | 'timeremaining'
  | 'timezone'
  | 'title'
  | 'toggleChatComponent'
  | 'toggleGENA'
  | 'toggleMenuComponent'
  | 'toggleMicrophone'
  | 'total'
  | 'totalAutoSelections'
  | 'totalBonusXpColor'
  | 'totalMembersInRank'
  | 'totalPages'
  | 'totalRestedXP'
  | 'totalResults'
  | 'totalXP'
  | 'totalXpBonus'
  | 'towerName'
  | 'tradeskillPoints'
  | 'tradeskillPointsText'
  | 'transcribedMessage'
  | 'type'
  | 'type1'
  | 'type2'
  | 'type3'
  | 'units'
  | 'upgradeCount'
  | 'upgradeItemName'
  | 'usedColor'
  | 'usedSlots'
  | 'val'
  | 'value'
  | 'viewers'
  | 'volumeValue'
  | 'warType'
  | 'warning'
  | 'world'
  | 'worldName'
  | 'worldSetName'
  | 'worldset'
  | 'xp'
  | 'xpToLevel'
  | 'xpToNextLevel'
  | 'year'
