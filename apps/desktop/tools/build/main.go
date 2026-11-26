// Builds the desktop app (apps/desktop, Wails v3, Windows) into dist/desktop. Run from the repository root:
//
//	go -C apps/desktop run ./tools/build             release exe: dist/desktop/nw-buddy.exe (production tag, no console)
//	go -C apps/desktop run ./tools/build -package    release exe plus nw-data.zip (dist/web-standalone/browser), bin/ (nwbt)
//	                                                 and the files of templates/ (nw-buddy-tools.bat, .env, README.md)
//	go -C apps/desktop run ./tools/build -package -exclude=a/b,c
//	                                                 nw-data.zip without these folders or files (default: defaultExcludes)
//	go -C apps/desktop run ./tools/build -dev -run -- [args]
//	                                                 dev exe dist/desktop/nw-buddy-dev.exe, started with the args after --
//	                                                 (e.g. -dev-server http://localhost:4200)
//
// Each build writes rsrc_windows_amd64.syso (icon, version information, see resources.go), which go build links into
// the exe. The module is not part of the repository's go.work (Wails needs Go >= 1.26, nwbt stays on its version):
// apps/desktop/go.work makes it a workspace of its own.
package main

import (
	"archive/zip"
	"compress/flate"
	"errors"
	"flag"
	"fmt"
	"io"
	"io/fs"
	"log"
	"os"
	"os/exec"
	"path"
	"path/filepath"
	"strings"
)

// nwbtFiles are the files nwbt looks up in its working directory (PATH lookups of utils/*.go, the rtti tables of
// serve). nwbt serve exits without a viewer (`viewerRoots`), so its zip goes along. nwbt.exe and viewer.zip are not
// in git, `pnpm build:desktop` builds them fresh (`pnpm nwbt:build`, `pnpm viewer:build`).
var nwbtFiles = []string{
	"tools/bin/nwbt.exe",
	"tools/bin/viewer.zip",
	"tools/bin/cLuaDecompiler.exe",
	"tools/bin/oo2core_8_win64.dll",
	"tools/bin/oo2core_9_win64.dll",
	"tools/nwbt/rtti/nwt/nwt-crc.json",
	"tools/nwbt/rtti/nwt/nwt-types.json",
}

// defaultExcludes are left out of nw-data.zip, paths relative to the web build: the map tiles (21k files, 1.6 GB)
var defaultExcludes = []string{
	"nw-data/lyshineui/worldtiles",
}

// storedExtensions are compressed formats already, nw-data.zip stores them as they are
var storedExtensions = map[string]bool{
	".png":   true,
	".jpg":   true,
	".jpeg":  true,
	".webp":  true,
	".gif":   true,
	".ktx2":  true,
	".woff":  true,
	".woff2": true,
	".mp3":   true,
	".ogg":   true,
	".zip":   true,
	".gz":    true,
	".br":    true,
}

func main() {
	log.SetFlags(0)
	dev := flag.Bool("dev", false, "build the dev exe nw-buddy-dev.exe (console, -dev-server support)")
	pack := flag.Bool("package", false, "package nw-data.zip, bin/ (nwbt), nw-buddy-tools.bat, .env and README.md next to the exe")
	run := flag.Bool("run", false, "start the exe after the build, with the arguments after --")
	exclude := flag.String("exclude", strings.Join(defaultExcludes, ","), "comma separated folders or files left out of nw-data.zip, relative to the web build (empty: none)")
	flag.Parse()

	root, err := repositoryRoot()
	if err != nil {
		log.Fatal(err)
	}
	outDir := filepath.Join(root, "dist", "desktop")

	exe := filepath.Join(outDir, "nw-buddy.exe")
	args := []string{"build", "-tags", "production", "-trimpath", "-ldflags", "-s -w -H windowsgui", "-o", exe, "."}
	if *dev {
		exe = filepath.Join(outDir, "nw-buddy-dev.exe")
		args = []string{"build", "-o", exe, "."}
	}
	moduleDir := filepath.Join(root, "apps", "desktop")
	if err := writeResources(root, moduleDir); err != nil {
		log.Fatal(err)
	}
	if err := command(moduleDir, "go", args...).Run(); err != nil {
		log.Fatal(err)
	}
	log.Println("built", relative(root, exe))

	if *pack {
		if err := packageApp(root, outDir, splitList(*exclude)); err != nil {
			log.Fatal(err)
		}
	}

	if *run {
		// the working directory is the repository: the exe takes what is missing next to it (web, nwbt) from there
		err := command(root, exe, flag.Args()...).Run()
		var exit *exec.ExitError
		if errors.As(err, &exit) {
			os.Exit(exit.ExitCode())
		}
		if err != nil {
			log.Fatal(err)
		}
	}
}

// templates are copied next to the exe: published name -> file in apps/desktop/templates. `.env` is git-ignored, so its
// template has another name.
var templates = map[string]string{
	"nw-buddy-tools.bat": "nw-buddy-tools.bat",
	".env":               ".env.template",
	"README.md":          "README.md",
}

// packageApp puts nw-data.zip (the Angular standalone build without the excluded paths), bin/ (nwbt) and the templates next
// to the exe
func packageApp(root string, outDir string, excludes []string) error {
	web := filepath.Join(root, "dist", "web-standalone", "browser")
	if !exists(filepath.Join(web, "index.html")) {
		return fmt.Errorf("missing %s - run pnpm build:web-standalone first", relative(root, web))
	}
	// earlier packages had the build as a folder
	if err := os.RemoveAll(filepath.Join(outDir, "web")); err != nil {
		return err
	}
	webZip := filepath.Join(outDir, "nw-data.zip")
	files, size, err := writeZip(web, webZip, excludes)
	if err != nil {
		return err
	}
	if info, err := os.Stat(webZip); err == nil {
		log.Printf("zipped %d files, %d MB -> %s (%d MB), excluded: %s", files, size>>20, relative(root, webZip), info.Size()>>20, strings.Join(excludes, ", "))
	}

	// earlier packages had nwbt in nwbt/
	if err := os.RemoveAll(filepath.Join(outDir, "nwbt")); err != nil {
		return err
	}
	// nw-buddy-tools.bat runs nwbt in outDir, which adds `<working dir>/bin` to its PATH: the helper programs and the rtti tables
	// are found there, viewer.zip next to nwbt.exe
	binDir := filepath.Join(outDir, "bin")
	if err := os.RemoveAll(binDir); err != nil {
		return err
	}
	if err := os.MkdirAll(binDir, 0o755); err != nil {
		return err
	}
	for _, file := range nwbtFiles {
		if err := copyFile(filepath.Join(root, file), filepath.Join(binDir, filepath.Base(file))); err != nil {
			return fmt.Errorf("%w (nwbt.exe and viewer.zip: pnpm nwbt:build, pnpm viewer:build)", err)
		}
	}

	for name, template := range templates {
		data, err := os.ReadFile(filepath.Join(root, "apps", "desktop", "templates", template))
		if err != nil {
			return err
		}
		// files for Windows users: CRLF line endings
		text := strings.ReplaceAll(strings.ReplaceAll(string(data), "\r\n", "\n"), "\n", "\r\n")
		if err := os.WriteFile(filepath.Join(outDir, name), []byte(text), 0o644); err != nil {
			return err
		}
	}
	log.Println("packaged", relative(root, outDir), "(nw-buddy.exe, nw-data.zip, bin/, nw-buddy-tools.bat, .env, README.md)")
	// the portable app writes its data there: local storage, config and caches of whoever ran it
	if exists(filepath.Join(outDir, "data")) {
		log.Println("warning:", relative(root, filepath.Join(outDir, "data")), "is the data of a local run, leave it out of the release")
	}
	return nil
}

// writeZip zips the files of dir (no sourcemaps, no excluded paths) into file, with paths relative to dir. Returns the
// number of files and their total size.
func writeZip(dir string, file string, excludes []string) (int, int64, error) {
	excluded := map[string]bool{}
	for _, exclude := range excludes {
		excluded[path.Clean(filepath.ToSlash(exclude))] = true
	}
	tmp := file + ".tmp"
	out, err := os.Create(tmp)
	if err != nil {
		return 0, 0, err
	}
	defer os.Remove(tmp)

	writer := zip.NewWriter(out)
	writer.RegisterCompressor(zip.Deflate, func(w io.Writer) (io.WriteCloser, error) {
		return flate.NewWriter(w, flate.BestSpeed)
	})
	files := 0
	size := int64(0)
	err = filepath.WalkDir(dir, func(file string, entry fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		rel, err := filepath.Rel(dir, file)
		if err != nil {
			return err
		}
		name := filepath.ToSlash(rel)
		if excluded[name] {
			if entry.IsDir() {
				return filepath.SkipDir
			}
			return nil
		}
		if entry.IsDir() || strings.HasSuffix(name, ".map") {
			return nil
		}
		info, err := entry.Info()
		if err != nil {
			return err
		}
		header, err := zip.FileInfoHeader(info)
		if err != nil {
			return err
		}
		header.Name = name
		header.Method = zip.Deflate
		if storedExtensions[strings.ToLower(path.Ext(name))] {
			header.Method = zip.Store
		}
		w, err := writer.CreateHeader(header)
		if err != nil {
			return err
		}
		in, err := os.Open(file)
		if err != nil {
			return err
		}
		defer in.Close()
		n, err := io.Copy(w, in)
		files++
		size += n
		return err
	})
	if err == nil {
		err = writer.Close()
	}
	if closeErr := out.Close(); err == nil {
		err = closeErr
	}
	if err != nil {
		return 0, 0, err
	}
	return files, size, os.Rename(tmp, file)
}

// repositoryRoot walks up from the working directory to the nw-buddy repository root
func repositoryRoot() (string, error) {
	dir, err := os.Getwd()
	if err != nil {
		return "", err
	}
	for {
		if exists(filepath.Join(dir, "apps", "desktop", "go.mod")) {
			return dir, nil
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			return "", errors.New("not inside the nw-buddy repository")
		}
		dir = parent
	}
}

// splitList splits a comma separated list, without empty items
func splitList(list string) []string {
	items := []string{}
	for _, item := range strings.Split(list, ",") {
		if item = strings.TrimSpace(item); item != "" {
			items = append(items, item)
		}
	}
	return items
}

func command(dir string, name string, args ...string) *exec.Cmd {
	cmd := exec.Command(name, args...)
	cmd.Dir = dir
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd
}

func copyFile(src string, dst string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()
	out, err := os.Create(dst)
	if err != nil {
		return err
	}
	if _, err := io.Copy(out, in); err != nil {
		out.Close()
		return err
	}
	return out.Close()
}

func relative(root string, path string) string {
	if rel, err := filepath.Rel(root, path); err == nil {
		return filepath.ToSlash(rel)
	}
	return path
}

func exists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}
