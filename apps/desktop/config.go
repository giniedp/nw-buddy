package main

import (
	"encoding/json"
	"log/slog"
	"os"
	"path/filepath"
	"sync"
)

// Config is the state of the desktop app that outlives a run, stored in the user's config dir
type Config struct {
	Window  *WindowState `json:"window,omitempty"`
	GameDir string       `json:"gameDir,omitempty"`
}

// WindowState is the restored position and size of the main window
type WindowState struct {
	X         int  `json:"x"`
	Y         int  `json:"y"`
	Width     int  `json:"width"`
	Height    int  `json:"height"`
	Maximised bool `json:"maximised"`
}

// ConfigStore loads and saves the config file. Writes are serialized, a failed write is logged and ignored: the app
// works without a stored config.
type ConfigStore struct {
	path  string
	mutex sync.Mutex
	value Config
}

func NewConfigStore(dir string) *ConfigStore {
	store := &ConfigStore{path: filepath.Join(dir, "config.json")}
	data, err := os.ReadFile(store.path)
	if err == nil {
		if err := json.Unmarshal(data, &store.value); err != nil {
			slog.Warn("config not readable, using defaults", "file", store.path, "err", err)
		}
	}
	return store
}

// Get returns a copy of the config
func (s *ConfigStore) Get() Config {
	s.mutex.Lock()
	defer s.mutex.Unlock()
	return s.value
}

// Update changes the config and writes it
func (s *ConfigStore) Update(change func(config *Config)) {
	s.mutex.Lock()
	defer s.mutex.Unlock()
	change(&s.value)
	data, err := json.MarshalIndent(s.value, "", "  ")
	if err != nil {
		slog.Warn("config not encoded", "err", err)
		return
	}
	if err := os.MkdirAll(filepath.Dir(s.path), os.ModePerm); err != nil {
		slog.Warn("config dir not created", "err", err)
		return
	}
	if err := os.WriteFile(s.path, data, 0o644); err != nil {
		slog.Warn("config not written", "file", s.path, "err", err)
	}
}
