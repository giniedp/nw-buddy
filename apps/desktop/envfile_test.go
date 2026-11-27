package main

import (
	"os"
	"path/filepath"
	"testing"
)

func writeEnv(t *testing.T, content string) EnvFile {
	t.Helper()
	path := filepath.Join(t.TempDir(), ".env")
	if content != "" {
		if err := os.WriteFile(path, []byte(content), 0o644); err != nil {
			t.Fatal(err)
		}
	}
	return EnvFile{Path: path}
}

func readEnv(t *testing.T, env EnvFile) string {
	t.Helper()
	data, err := os.ReadFile(env.Path)
	if err != nil {
		t.Fatal(err)
	}
	return string(data)
}

func TestEnsureCreatesTheTemplate(t *testing.T) {
	env := writeEnv(t, "")
	if err := env.Ensure(); err != nil {
		t.Fatal(err)
	}
	if readEnv(t, env) != string(envTemplate) {
		t.Fatal("not the template")
	}
	dir, err := env.GameDir()
	if err != nil || dir != "" {
		t.Fatalf("game dir %q, %v: the template names none", dir, err)
	}
}

func TestSetGameDirUncommentsTheTemplateLine(t *testing.T) {
	env := writeEnv(t, "# comment\n# NW_GAME=C:/example\nNW_TOOLS_HOST=localhost\n")
	if err := env.SetGameDir(`D:\Steam\steamapps\common\New World`); err != nil {
		t.Fatal(err)
	}
	want := "# comment\nNW_GAME=D:/Steam/steamapps/common/New World\nNW_TOOLS_HOST=localhost\n"
	if got := readEnv(t, env); got != want {
		t.Fatalf("got\n%s\nwant\n%s", got, want)
	}
	dir, _ := env.GameDir()
	if dir != filepath.FromSlash("D:/Steam/steamapps/common/New World") {
		t.Fatalf("game dir %q", dir)
	}
}

func TestSetGameDirReplacesAndAppends(t *testing.T) {
	env := writeEnv(t, "NW_GAME=\"C:/old\"\r\nOTHER=1\r\n")
	if err := env.SetGameDir("C:/new"); err != nil {
		t.Fatal(err)
	}
	if got := readEnv(t, env); got != "NW_GAME=C:/new\r\nOTHER=1\r\n" {
		t.Fatalf("got %q", got)
	}

	appended := writeEnv(t, "OTHER=1\n")
	if err := appended.SetGameDir("C:/game"); err != nil {
		t.Fatal(err)
	}
	if got := readEnv(t, appended); got != "OTHER=1\nNW_GAME=C:/game\n" {
		t.Fatalf("got %q", got)
	}
}

func TestGameDirIsOnlyNwGame(t *testing.T) {
	// the workspace keys are nwbt's, the app reads and writes NW_GAME only
	env := writeEnv(t, "NW_GAME_LIVE=C:/live\n")
	if dir, _ := env.GameDir(); dir != "" {
		t.Fatalf("game dir %q", dir)
	}
	if err := env.SetGameDir("C:/game"); err != nil {
		t.Fatal(err)
	}
	if got := readEnv(t, env); got != "NW_GAME_LIVE=C:/live\nNW_GAME=C:/game\n" {
		t.Fatalf("got %q", got)
	}
}
