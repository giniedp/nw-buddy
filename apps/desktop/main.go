// The nw-buddy desktop app (Windows): the Angular standalone build in a WebView2 window (Wails v3), with nwbt as a
// child process for the /pak tools. See apps/viewer/tmp/wails/exploration.md for the decisions.
//
// Layout of a packaged app:
//
//	nw-buddy.exe
//	nw-data.zip   the Angular standalone build (dist/web-standalone/browser), served from the archive
//	bin/          nwbt.exe, viewer.zip and the files nwbt looks up in its working directory (cLuaDecompiler,
//	              oodle, nwt-crc.json, nwt-types.json). The app runs nwbt in bin/
//	nw-buddy-tools.bat  runs bin/nwbt.exe manually, in the app folder
//	.env          names the game folder, for the app and nw-buddy-tools.bat. Created from templates/.env.template when
//	              missing, the app writes the folder the user chooses
//	README.md
//	data/         written by the app: config.json, the WebView2 profile (local storage, IndexedDB), nwbt's caches and
//	              log. When the app folder is not writable, the user's config and cache folders are used (datadir.go)
//
// tools/build builds and packages the app. During development, what is missing next to the exe comes from the
// repository: dist/web-standalone/browser (a folder), and tools/bin/nwbt.exe (`pnpm nwbt:build`, not in git) with the
// repository root as working directory. The repository's `.env` names the game folder then.
// -dev-server http://localhost:4200 (or FRONTEND_DEVSERVER_URL) serves the page from `ng serve` instead of the build
// (not in builds with the `production` tag).
package main

import (
	"flag"
	"log"
	"log/slog"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/wailsapp/wails/v3/pkg/application"
	"github.com/wailsapp/wails/v3/pkg/events"
)

// appName names the user folders of the app (config, WebView2 profile, nwbt caches) when it is not portable
const appName = "nw-buddy-desktop"

func main() {
	webPath := flag.String("web", "", "the Angular standalone build, a folder or .zip, default: nw-data.zip next to the exe, else the repository build")
	nwbtExe := flag.String("nwbt", "", "nwbt.exe, default: bin/nwbt.exe next to the exe, else the repository's tools/bin/nwbt.exe")
	nwbtURL := flag.String("nwbt-url", "", "use an nwbt that runs outside of the app (e.g. pnpm dev:nwbt) instead of starting one")
	cdpPort := flag.String("cdp", "", "WebView2 remote debugging port, for automated checks")
	devServer := flag.String("dev-server", "", "serve the page from this dev server (ng serve) instead of the build")
	flag.Parse()
	if *devServer != "" {
		// read by the Wails asset server
		os.Setenv("FRONTEND_DEVSERVER_URL", *devServer)
	}

	exeDir := executableDir()
	repo := findRepository()
	packaged := true
	if *webPath == "" {
		*webPath = filepath.Join(exeDir, "nw-data.zip")
		if !exists(*webPath) && repo != "" {
			*webPath = filepath.Join(repo, "dist", "web-standalone", "browser")
			packaged = false
		}
	}
	web, err := openWeb(*webPath)
	if err != nil {
		log.Fatal(err)
	}
	nwbtDir := ""
	if *nwbtExe == "" {
		*nwbtExe = filepath.Join(exeDir, "bin", "nwbt.exe")
		nwbtDir = filepath.Dir(*nwbtExe)
		if !exists(*nwbtExe) && repo != "" {
			*nwbtExe = filepath.Join(repo, "tools", "bin", "nwbt.exe")
			nwbtDir = repo
			packaged = false
		}
	} else {
		nwbtDir = filepath.Dir(*nwbtExe)
	}
	if os.Getenv("FRONTEND_DEVSERVER_URL") != "" {
		packaged = false
	}

	dirs := resolveDataDirs(exeDir, packaged)
	dataDir := dirs.Data
	config := NewConfigStore(dirs.Config)
	// the one place of the game folder: the .env next to the exe (nw-buddy-tools.bat), the repository's in development
	env := EnvFile{Path: filepath.Join(exeDir, ".env")}
	if !packaged && repo != "" {
		env.Path = filepath.Join(repo, ".env")
	}

	sidecar := NewSidecar()
	startNwbt := func() {
		folder := readGameFolder(env)
		if folder.Problem != "" {
			// the page shows the problem and offers to choose the folder
			slog.Warn("nwbt not started", "problem", folder.Problem, "dir", folder.Dir, "env", folder.EnvFile, "err", folder.Error)
			sidecar.Stop()
			return
		}
		sidecar.Start(NwbtOptions{
			Exe:     *nwbtExe,
			WorkDir: nwbtDir,
			GameDir: folder.Dir,
			DataDir: filepath.Join(dataDir, "nwbt"),
			LogFile: filepath.Join(dataDir, "nwbt.log"),
		})
	}
	if *nwbtURL != "" {
		sidecar.UseExternal(*nwbtURL)
	}

	if packaged {
		if exe, err := os.Executable(); err == nil {
			registerDeepLinks(exe)
		}
	}

	browserArgs := []string{}
	if *cdpPort != "" {
		browserArgs = append(browserArgs, "--remote-debugging-port="+*cdpPort)
	}
	// nwbt starts with the service (ServiceStartup): only in the instance that stays, a second instance hands its
	// arguments over and exits before
	service := &DesktopService{config: config, env: env, sidecar: sidecar, restart: startNwbt}
	var window *application.WebviewWindow
	app := application.New(application.Options{
		Name:        "New World Buddy",
		Description: "New World Buddy",
		Services:    []application.Service{application.NewService(service)},
		Assets: application.AssetOptions{
			Handler:    nwbtProxy(sidecar, spaHandler(web)),
			Middleware: crossOriginIsolation,
		},
		SingleInstance: &application.SingleInstanceOptions{
			UniqueID: "de.nw-buddy.desktop",
			OnSecondInstanceLaunch: func(data application.SecondInstanceData) {
				if window == nil {
					return
				}
				window.Restore()
				window.Focus()
				if path := deepLinkPath(data.Args); path != "" {
					window.EmitEvent("desktop:open-path", path)
				}
			},
		},
		Windows: application.WindowsOptions{
			WebviewUserDataPath:   filepath.Join(dataDir, "webview2"),
			AdditionalBrowserArgs: browserArgs,
		},
		OnShutdown: sidecar.Stop,
	})
	service.app = app

	options := application.WebviewWindowOptions{
		Name:      "main",
		Title:     "New World Buddy",
		Width:     1600,
		Height:    1000,
		MinWidth:  800,
		MinHeight: 600,
		Frameless: true,
		// the title bar is part of the page: `app-region: drag` (apps/web/app/desktop)
		Windows:          application.WindowsWindow{NonClientRegionSupport: true},
		BackgroundColour: application.NewRGB(0, 0, 0),
		URL:              deepLinkPath(os.Args[1:]),
	}
	if state := config.Get().Window; state != nil && state.Width > 0 && state.Height > 0 {
		options.InitialPosition = application.WindowXY
		options.X = state.X
		options.Y = state.Y
		options.Width = state.Width
		options.Height = state.Height
		if state.Maximised {
			options.StartState = application.WindowStateMaximised
		}
	}
	window = app.Window.NewWithOptions(options)
	trackWindowState(window, config)

	if err := app.Run(); err != nil {
		log.Fatal(err)
	}
}

// trackWindowState stores the window's position, size and maximised state, so the next start restores them. The
// bounds are those of the normal window: a maximised window keeps the bounds it had before.
func trackWindowState(window *application.WebviewWindow, config *ConfigStore) {
	var mutex sync.Mutex
	var timer *time.Timer
	save := func(*application.WindowEvent) {
		mutex.Lock()
		defer mutex.Unlock()
		if timer != nil {
			timer.Stop()
		}
		timer = time.AfterFunc(500*time.Millisecond, func() {
			maximised := window.IsMaximised()
			if window.IsMinimised() {
				return
			}
			bounds := window.Bounds()
			config.Update(func(config *Config) {
				state := config.Window
				if state == nil {
					state = &WindowState{}
					config.Window = state
				}
				state.Maximised = maximised
				if !maximised {
					state.X, state.Y, state.Width, state.Height = bounds.X, bounds.Y, bounds.Width, bounds.Height
				}
			})
		})
	}
	for _, event := range []events.WindowEventType{
		events.Common.WindowDidMove,
		events.Common.WindowDidResize,
		events.Common.WindowMaximise,
		events.Common.WindowUnMaximise,
	} {
		window.OnWindowEvent(event, save)
	}
}

func executableDir() string {
	exe, err := os.Executable()
	if err != nil {
		return "."
	}
	return filepath.Dir(exe)
}

// findRepository walks up from the working directory to the nw-buddy repository root, empty outside of it
func findRepository() string {
	dir, err := os.Getwd()
	if err != nil {
		return ""
	}
	for {
		if exists(filepath.Join(dir, "tools", "nwbt")) && exists(filepath.Join(dir, "apps", "web")) {
			return dir
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			return ""
		}
		dir = parent
	}
}

func userDir(base func() (string, error)) string {
	dir, err := base()
	if err != nil {
		dir = os.TempDir()
	}
	return filepath.Join(dir, appName)
}

func exists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}
