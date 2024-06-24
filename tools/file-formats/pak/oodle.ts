import { Library } from 'ffi-napi'
import path from 'node:path'
import { platform } from 'process'
import { refType, types } from 'ref-napi'

function oodlePathWin(libDir?: string) {
  const LIB_NAME = 'oo2core_8_win64.dll'
  libDir = libDir || LIB_NAME
  if (libDir && !libDir.match(/\.dll$/i)) {
    libDir = path.join(libDir, LIB_NAME)
  }
  return libDir
}

function oodlePathLinux(libDir?: string) {
  const LIB_NAME = 'liblinoodle.so'
  libDir = libDir || LIB_NAME
  if (libDir && !libDir.match(/\.so$/i)) {
    libDir = path.join(libDir, LIB_NAME)
  }
  return libDir
}

function oodlePath(libDir?: string) {
  if (platform === 'win32') {
    return oodlePathWin(libDir)
  }
  if (platform === 'linux') {
    return oodlePathLinux(libDir)
  }
  throw new Error(`${platform} not supported`)
}

export function oodleLibrary(libDir?: string): { OodleLZ_Decompress: Function } {
  return Library(oodlePath(libDir), {
    OodleLZ_Decompress: [
      'void',
      [
        refType(types.void),
        'int',
        refType(types.void),
        'int',
        'int',
        'int',
        'int',
        'void *',
        'void *',
        'void *',
        'void *',
        'void *',
        'void *',
        'int',
      ],
    ],
  })
}
