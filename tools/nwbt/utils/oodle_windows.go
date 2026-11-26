package utils

import "golang.org/x/sys/windows"

// oodleNames are the Oodle DLLs nwbt looks for
var oodleNames = []string{
	"oo2core_9_win64.dll",
	"oo2core_8_win64.dll",
}

func loadLibrary(name string) (uintptr, error) {
	handle, err := windows.LoadLibrary(name)
	return uintptr(handle), err
}
