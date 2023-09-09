export async function getItemRotation(itemTags: string[]) {
  // const { BABYLON } = await loadBabylon()
  const { Quaternion, Matrix } = BABYLON

  if (isOnWall(itemTags)) {
    return Quaternion.FromRotationMatrix(Matrix.RotationYawPitchRoll(0, Math.PI / 2, 0))
  }
  if (isOnCeiling(itemTags)) {
    return Quaternion.FromRotationMatrix(Matrix.RotationYawPitchRoll(0, Math.PI, 0))
  }
  if (isOnFloor(itemTags) || isOnFurniture(itemTags)) {
    return Quaternion.FromRotationMatrix(Matrix.RotationYawPitchRoll(Math.PI, 0, 0))
  }
  if (isOneHanded(itemTags)) {
    return Quaternion.FromRotationMatrix(Matrix.RotationYawPitchRoll(-Math.PI / 2, Math.PI / 4, 0))
  }

  if (isTwoHanded(itemTags)) {
    if (isGreatSword(itemTags)) {
      return Quaternion.FromRotationMatrix(Matrix.RotationYawPitchRoll(-Math.PI / 2, -(3 / 4) * Math.PI, 0))
    } else if (isIceMagic(itemTags) || isVoidGauntlet(itemTags)) {
      //
    } else {
      return Quaternion.FromRotationMatrix(Matrix.RotationYawPitchRoll(-Math.PI / 2, Math.PI / 4, 0))
    }
  }

  if (isShield(itemTags)) {
    return Quaternion.FromRotationMatrix(Matrix.RotationYawPitchRoll(Math.PI / 2, -Math.PI / 2, 0))
  }
  if (isTool(itemTags) && !isInstrumentDrums(itemTags)) {
    if (isInstrument(itemTags)) {
      return Quaternion.FromRotationMatrix(Matrix.RotationYawPitchRoll(0, 0, Math.PI / 4))
    }
    return Quaternion.FromRotationMatrix(Matrix.RotationYawPitchRoll(-Math.PI / 2, Math.PI / 4, 0))
  }

  return Quaternion.Identity()
}

import { eqCaseInsensitive } from '~/utils/caseinsensitive-compare'

function isOneHanded(tags: string[]) {
  return hasTag(tags, 'EquippableMainHand')
}

function isTwoHanded(tags: string[]) {
  return hasTag(tags, 'EquippableTwoHand')
}

function isMelee(tags: string[]) {
  return hasTag(tags, 'Melee')
}

function isRanged(tags: string[]) {
  return hasTag(tags, 'Melee')
}

function isGreatSword(tags: string[]) {
  return hasTag(tags, 'GreatSword')
}
function isIceMagic(tags: string[]) {
  return hasTag(tags, 'IceMagic')
}

function isVoidGauntlet(tags: string[]) {
  return hasTag(tags, 'VoidGauntlet')
}

function isMagic(tags: string[]) {
  return hasTag(tags, 'Magic')
}

function isShield(tags: string[]) {
  return hasTag(tags, 'EquippableOffHand')
}

function isTool(tags: string[]) {
  return hasTag(tags, 'EquippableTool')
}

function isOnWall(tags: string[]) {
  return hasTag(tags, 'OnWall')
}

function isOnCeiling(tags: string[]) {
  return hasTag(tags, 'OnCeiling')
}

function isOnFloor(tags: string[]) {
  return hasTag(tags, 'OnFloor')
}
function isOnFurniture(tags: string[]) {
  return hasTag(tags, 'OnFurniture')
}
function isInstrument(tags: string[]) {
  return (
    hasTag(tags, 'InstrumentFlute') ||
    hasTag(tags, 'InstrumentGuitar') ||
    hasTag(tags, 'InstrumentMandolin') ||
    hasTag(tags, 'InstrumentUprightBass') ||
    hasTag(tags, 'InstrumentDrums')
  )
}

function isInstrumentDrums(tags: string[]) {
  return hasTag(tags, 'InstrumentDrums')
}

function hasTag(tags: string[], name: string) {
  return !!tags?.some((it) => eqCaseInsensitive(it, name))
}
