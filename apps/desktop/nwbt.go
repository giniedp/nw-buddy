package main

import (
	"fmt"
	"log/slog"
	"net"
	"os"
	"os/exec"
	"path/filepath"
	"sync"
	"syscall"
	"unsafe"

	"golang.org/x/sys/windows"
)

// NwbtOptions configure the nwbt child process
type NwbtOptions struct {
	// Exe is nwbt.exe
	Exe string
	// WorkDir is the working directory of nwbt. nwbt finds its tools (oodle, cLuaDecompiler, the rtti tables) there,
	// and loads a `.env` from it if there is one.
	WorkDir string
	// GameDir is the New World installation, empty to let nwbt read it from its `.env`
	GameDir string
	// DataDir holds nwbt's temp, cache and models folders
	DataDir string
	// LogFile receives nwbt's output
	LogFile string
}

// NwbtState is what the page knows about nwbt
type NwbtState struct {
	// URL of the running server, empty when it is not running
	URL string `json:"url"`
	// Error why it is not running, empty while it runs or starts
	Error string `json:"error"`
}

// Sidecar runs nwbt as a child process on a free loopback port. The child is in a job object that kills it when the
// app exits, also when the app crashes.
type Sidecar struct {
	mutex sync.Mutex
	job   windows.Handle
	cmd   *exec.Cmd
	state NwbtState
	// fixed is the url of an nwbt started outside of the app (-nwbt-url): no child process
	fixed string
}

func NewSidecar() *Sidecar {
	sidecar := &Sidecar{}
	job, err := newKillOnCloseJob()
	if err != nil {
		slog.Warn("job object not created, nwbt may outlive a crashed app", "err", err)
	}
	sidecar.job = job
	return sidecar
}

// UseExternal points to an nwbt that runs outside of the app, e.g. `pnpm dev:nwbt` during development
func (s *Sidecar) UseExternal(url string) {
	s.mutex.Lock()
	defer s.mutex.Unlock()
	s.fixed = url
	s.state = NwbtState{URL: url}
}

// State returns the url of the running nwbt, or why it does not run
func (s *Sidecar) State() NwbtState {
	s.mutex.Lock()
	defer s.mutex.Unlock()
	return s.state
}

// Start stops a running child and starts nwbt with the options
func (s *Sidecar) Start(options NwbtOptions) {
	s.mutex.Lock()
	defer s.mutex.Unlock()
	if s.fixed != "" {
		return
	}
	s.stopLocked()
	if err := s.startLocked(options); err != nil {
		slog.Error("nwbt not started", "err", err)
		s.state = NwbtState{Error: err.Error()}
	}
}

// Stop ends the child process
func (s *Sidecar) Stop() {
	s.mutex.Lock()
	defer s.mutex.Unlock()
	s.stopLocked()
}

func (s *Sidecar) startLocked(options NwbtOptions) error {
	if _, err := os.Stat(options.Exe); err != nil {
		return fmt.Errorf("nwbt not found at %s", options.Exe)
	}
	port, err := freePort()
	if err != nil {
		return fmt.Errorf("no free port: %w", err)
	}
	// nwbt takes forward slashes, it mangles backslash paths ("s:\steam" becomes "s:/s:steam")
	dir := func(parts ...string) string {
		return filepath.ToSlash(filepath.Join(parts...))
	}
	args := []string{
		"serve",
		"--host", "127.0.0.1",
		"--port", fmt.Sprint(port),
		"--tls-port", "0",
		"--temp", dir(options.DataDir, "temp"),
		"--cache", dir(options.DataDir, "cache"),
		"--models", dir(options.DataDir, "models"),
	}
	if options.GameDir != "" {
		args = append(args, "--game", dir(options.GameDir))
	}
	if err := os.MkdirAll(filepath.Dir(options.LogFile), os.ModePerm); err != nil {
		return err
	}
	logFile, err := os.Create(options.LogFile)
	if err != nil {
		return err
	}
	cmd := exec.Command(options.Exe, args...)
	cmd.Dir = options.WorkDir
	// nwbt looks up its tools and rtti tables in PATH. Its own PATH append of the working directory (env.AppendToPATH)
	// lacks the separator, so the working directory goes in front here.
	cmd.Env = append(os.Environ(), "PATH="+options.WorkDir+string(os.PathListSeparator)+os.Getenv("PATH"))
	cmd.Stdout = logFile
	cmd.Stderr = logFile
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true, CreationFlags: windows.CREATE_NO_WINDOW}
	if err := cmd.Start(); err != nil {
		logFile.Close()
		return err
	}
	if s.job != 0 {
		if err := assignToJob(s.job, cmd.Process.Pid); err != nil {
			slog.Warn("nwbt not added to the job object", "err", err)
		}
	}
	url := fmt.Sprintf("http://127.0.0.1:%d", port)
	slog.Info("nwbt started", "url", url, "pid", cmd.Process.Pid, "log", options.LogFile)
	s.cmd = cmd
	s.state = NwbtState{URL: url}
	go func() {
		err := cmd.Wait()
		logFile.Close()
		s.mutex.Lock()
		defer s.mutex.Unlock()
		// a newer child may have replaced this one
		if s.cmd != cmd {
			return
		}
		s.cmd = nil
		reason := "nwbt exited"
		if err != nil {
			reason = fmt.Sprintf("nwbt exited: %v", err)
		}
		slog.Warn(reason, "log", options.LogFile)
		s.state = NwbtState{Error: fmt.Sprintf("%s, see %s", reason, options.LogFile)}
	}()
	return nil
}

func (s *Sidecar) stopLocked() {
	if s.cmd == nil {
		return
	}
	cmd := s.cmd
	s.cmd = nil
	s.state = NwbtState{}
	if err := cmd.Process.Kill(); err != nil {
		slog.Warn("nwbt not stopped", "err", err)
	}
}

func freePort() (int, error) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		return 0, err
	}
	defer listener.Close()
	return listener.Addr().(*net.TCPAddr).Port, nil
}

func newKillOnCloseJob() (windows.Handle, error) {
	job, err := windows.CreateJobObject(nil, nil)
	if err != nil {
		return 0, err
	}
	info := windows.JOBOBJECT_EXTENDED_LIMIT_INFORMATION{
		BasicLimitInformation: windows.JOBOBJECT_BASIC_LIMIT_INFORMATION{
			LimitFlags: windows.JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE,
		},
	}
	_, err = windows.SetInformationJobObject(
		job,
		windows.JobObjectExtendedLimitInformation,
		uintptr(unsafe.Pointer(&info)),
		uint32(unsafe.Sizeof(info)),
	)
	if err != nil {
		windows.CloseHandle(job)
		return 0, err
	}
	return job, nil
}

func assignToJob(job windows.Handle, pid int) error {
	process, err := windows.OpenProcess(windows.PROCESS_SET_QUOTA|windows.PROCESS_TERMINATE, false, uint32(pid))
	if err != nil {
		return err
	}
	defer windows.CloseHandle(process)
	return windows.AssignProcessToJobObject(job, process)
}
