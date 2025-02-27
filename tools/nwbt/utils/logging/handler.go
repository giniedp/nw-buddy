package logging

import (
	"log/slog"
	"nw-buddy/tools/utils/env"
	"os"
	"path"
	"time"

	"github.com/lmittmann/tint"
	"github.com/mattn/go-isatty"
)

var terminalHandler *slog.Logger

func DefaultTerminalHandler() *slog.Logger {
	if terminalHandler == nil {
		terminalHandler = NewHander(os.Stderr)
	}
	return terminalHandler
}

var fileHandler *slog.Logger

func DefaultFileHandler() *slog.Logger {
	if fileHandler == nil {
		fileHandler = NewHander(openLogfile(env.Logfile()))
	}
	return fileHandler
}

func NewHander(w *os.File) *slog.Logger {
	return slog.New(
		tint.NewHandler(w, &tint.Options{
			TimeFormat: time.TimeOnly,
			NoColor:    !isatty.IsTerminal(w.Fd()),
			Level:      slog.LevelDebug,
		}),
	)
}

func openLogfile(logfile string) *os.File {
	logdir := path.Dir(logfile)
	if err := os.MkdirAll(logdir, 0755); err != nil {
		slog.Error("failed to create log directory", "err", err)
		return os.Stderr
	}
	file, err := os.Create(logfile)
	if err != nil {
		slog.Error("failed to create log file", "err", err)
		return os.Stderr
	}
	return file
}
