package main

import (
	"context"
	"fmt"

	"github.com/wailsapp/wails/v3/pkg/application"
)

// DesktopService is bound to the page (`main.DesktopService.<Method>` in `@wailsio/runtime` Call.ByName). The window
// controls go through the runtime's Window API directly.
type DesktopService struct {
	app    *application.App
	config *ConfigStore
	// env names the New World folder, for the app and nwbt
	env     EnvFile
	sidecar *Sidecar
	// restart starts nwbt again with the folder of the `.env`
	restart func()
}

// ServiceStartup starts nwbt when the app starts. Wails runs it in the primary instance only.
func (s *DesktopService) ServiceStartup(ctx context.Context, options application.ServiceOptions) error {
	if s.sidecar.State().URL == "" {
		s.restart()
	}
	return nil
}

// Nwbt returns the url of the nwbt server of the app, or why it does not run, and the New World folder of the `.env`
func (s *DesktopService) Nwbt() NwbtState {
	state := s.sidecar.State()
	state.Folder = readGameFolder(s.env)
	return state
}

// PickGameDir asks for the New World folder. A valid folder is written to the `.env` and nwbt restarts with it.
// Returns the folder of the `.env`, unchanged when the dialog is cancelled or the folder has no game files.
func (s *DesktopService) PickGameDir() (string, error) {
	current := readGameFolder(s.env)
	dir, err := s.app.Dialog.OpenFile().
		SetTitle("New World installation folder").
		CanChooseDirectories(true).
		CanChooseFiles(false).
		SetDirectory(current.Dir).
		PromptForSingleSelection()
	if err != nil || dir == "" {
		return current.Dir, err
	}
	if !isGameDir(dir) {
		s.app.Dialog.Warning().
			SetTitle("Not a New World folder").
			SetMessage("The folder has no 'assets' folder with the game files: " + dir).
			Show()
		return current.Dir, nil
	}
	return dir, s.SetGameDir(dir)
}

// FindGameDir looks for New World in the Steam libraries on the user's request, empty if it is not found. Nothing is
// stored: the page asks the user and then calls SetGameDir.
func (s *DesktopService) FindGameDir() string {
	return findGameDir()
}

// SetGameDir writes the New World folder to the `.env` and restarts nwbt with it
func (s *DesktopService) SetGameDir(dir string) error {
	if !isGameDir(dir) {
		return fmt.Errorf("not a New World folder, it has no 'assets' folder: %s", dir)
	}
	if err := s.env.Ensure(); err != nil {
		return err
	}
	if err := s.env.SetGameDir(dir); err != nil {
		return err
	}
	s.restart()
	return nil
}

// Retry starts nwbt again with the folder of the `.env`, e.g. after the user edited the file or connected the drive
func (s *DesktopService) Retry() {
	s.restart()
}
