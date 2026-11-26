package main

import (
	"context"

	"github.com/wailsapp/wails/v3/pkg/application"
)

// DesktopService is bound to the page (`main.DesktopService.<Method>` in `@wailsio/runtime` Call.ByName). The window
// controls go through the runtime's Window API directly.
type DesktopService struct {
	app     *application.App
	config  *ConfigStore
	sidecar *Sidecar
	// restart starts nwbt again with the current config
	restart func()
}

// ServiceStartup starts nwbt when the app starts. Wails runs it in the primary instance only.
func (s *DesktopService) ServiceStartup(ctx context.Context, options application.ServiceOptions) error {
	if s.sidecar.State().URL == "" {
		s.restart()
	}
	return nil
}

// Nwbt returns the url of the nwbt server of the app, or why it does not run
func (s *DesktopService) Nwbt() NwbtState {
	return s.sidecar.State()
}

// GameDir returns the New World folder nwbt reads, empty when it is not set
func (s *DesktopService) GameDir() string {
	return s.config.Get().GameDir
}

// PickGameDir asks for the New World folder. A valid folder is stored and nwbt restarts with it. Returns the stored
// folder, unchanged when the dialog is cancelled or the folder has no game files.
func (s *DesktopService) PickGameDir() (string, error) {
	dir, err := s.app.Dialog.OpenFile().
		SetTitle("New World installation folder").
		CanChooseDirectories(true).
		CanChooseFiles(false).
		SetDirectory(s.config.Get().GameDir).
		PromptForSingleSelection()
	if err != nil || dir == "" {
		return s.GameDir(), err
	}
	if !isGameDir(dir) {
		s.app.Dialog.Warning().
			SetTitle("Not a New World folder").
			SetMessage("The folder has no 'assets' folder with the game files: " + dir).
			Show()
		return s.GameDir(), nil
	}
	s.config.Update(func(config *Config) {
		config.GameDir = dir
	})
	s.restart()
	return dir, nil
}
