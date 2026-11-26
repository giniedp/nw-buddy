//go:build !windows

package utils

import (
	"runtime"

	"github.com/ebitengine/purego"
)

// oodleNames are the shared Oodle libraries nwbt looks for. The user supplies one (NW_OODLE or the PATH): the Oodle
// SDK ships only static libraries, the Windows DLLs don't load here
var oodleNames = oodleNamesOf(runtime.GOOS)

func oodleNamesOf(goos string) []string {
	if goos == "darwin" {
		return []string{"liboo2coremac64.dylib"}
	}
	return []string{"liboo2corelinux64.so.9", "liboo2corelinux64.so.8", "liboo2corelinux64.so"}
}

func loadLibrary(name string) (uintptr, error) {
	return purego.Dlopen(name, purego.RTLD_NOW|purego.RTLD_GLOBAL)
}
