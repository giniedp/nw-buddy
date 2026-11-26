package main

import (
	"fmt"
	"log/slog"
	"strings"

	"golang.org/x/sys/windows/registry"
)

// deepLinkScheme opens nw-buddy pages from links outside of the app: `nw-buddy://items/123` shows `/items/123`
const deepLinkScheme = "nw-buddy"

// registerDeepLinks makes Windows open `nw-buddy://` links with this exe, for the current user (no admin rights).
// A link starts a second instance, which hands it to the running app (single instance) and exits.
func registerDeepLinks(exe string) {
	key, _, err := registry.CreateKey(registry.CURRENT_USER, `Software\Classes\`+deepLinkScheme, registry.SET_VALUE)
	if err != nil {
		slog.Warn("deep links not registered", "err", err)
		return
	}
	defer key.Close()
	key.SetStringValue("", "URL:New World Buddy")
	key.SetStringValue("URL Protocol", "")
	command, _, err := registry.CreateKey(key, `shell\open\command`, registry.SET_VALUE)
	if err != nil {
		slog.Warn("deep links not registered", "err", err)
		return
	}
	defer command.Close()
	command.SetStringValue("", fmt.Sprintf(`"%s" "%%1"`, exe))
}

// deepLinkPath is the app route of the first `nw-buddy://` argument, empty if there is none
func deepLinkPath(args []string) string {
	for _, arg := range args {
		if rest, ok := strings.CutPrefix(arg, deepLinkScheme+"://"); ok {
			return "/" + strings.TrimLeft(rest, "/")
		}
	}
	return ""
}
