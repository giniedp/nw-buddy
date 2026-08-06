//go:build !windows

package utils

import "errors"

// The Oodle runtime ships only as a windows DLL (oo2core_*_win64.dll) and is
// loaded through the win32 loader, so packed .pak archives cannot be read on
// other platforms. Use an unpacked asset directory instead.
func (it *oodle) Load() error {
	return errors.New("Oodle is only supported on windows")
}
