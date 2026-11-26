package main

import (
	"encoding/json"
	"image"
	_ "image/png"
	"os"
	"path/filepath"
	"regexp"
	"strconv"

	"github.com/tc-hib/winres"
	"github.com/tc-hib/winres/version"
)

// appIcon is the source of the exe's icon, resized to the usual icon sizes
const appIcon = "apps/web/assets/icons/favicon.512x512.png"

// appIconID is the resource ID that Wails loads the window icon from (webview_window_windows.go: "App icon ID is 3").
// Explorer shows the first icon group of the exe, the only one here.
const appIconID = 3

// writeResources writes the Windows resources of the exe (icon, version information) into a .syso in the module
// directory, which `go build` links into the exe
func writeResources(root string, moduleDir string) error {
	rs := winres.ResourceSet{}

	file, err := os.Open(filepath.Join(root, appIcon))
	if err != nil {
		return err
	}
	defer file.Close()
	img, _, err := image.Decode(file)
	if err != nil {
		return err
	}
	icon, err := winres.NewIconFromResizedImage(img, nil)
	if err != nil {
		return err
	}
	if err := rs.SetIcon(winres.ID(appIconID), icon); err != nil {
		return err
	}

	appVersion, err := packageVersion(root)
	if err != nil {
		return err
	}
	info := version.Info{}
	info.SetFileVersion(appVersion)
	info.SetProductVersion(appVersion)
	// FileDescription is the process name in the task manager
	if err := info.Set(version.LangDefault, version.FileDescription, "New World Buddy"); err != nil {
		return err
	}
	if err := info.Set(version.LangDefault, version.ProductName, "New World Buddy"); err != nil {
		return err
	}
	rs.SetVersionInfo(info)

	out, err := os.Create(filepath.Join(moduleDir, "rsrc_windows_amd64.syso"))
	if err != nil {
		return err
	}
	if err := rs.WriteObject(out, winres.ArchAMD64); err != nil {
		out.Close()
		return err
	}
	return out.Close()
}

// packageVersion reads the version of the repository's package.json as a Windows version (e.g. 10.0.4-0 -> 10.0.4.0)
func packageVersion(root string) (string, error) {
	data, err := os.ReadFile(filepath.Join(root, "package.json"))
	if err != nil {
		return "", err
	}
	var pkg struct {
		Version string `json:"version"`
	}
	if err := json.Unmarshal(data, &pkg); err != nil {
		return "", err
	}
	parts := regexp.MustCompile(`\d+`).FindAllString(pkg.Version, 4)
	result := ""
	for i, part := range parts {
		if i > 0 {
			result += "."
		}
		number, _ := strconv.Atoi(part)
		result += strconv.Itoa(number)
	}
	return result, nil
}
