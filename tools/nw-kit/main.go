package main

import (
	"fmt"
	"log/slog"
	"nw-buddy/tools/nw-kit/commands"
	"nw-buddy/tools/nw-kit/utils"
	"os"
	"runtime/debug"
	"time"

	"github.com/lmittmann/tint"
	"github.com/mattn/go-isatty"
)

func init() {
	w := os.Stderr
	slog.SetDefault(slog.New(
		tint.NewHandler(w, &tint.Options{
			TimeFormat: time.TimeOnly,
			NoColor:    !isatty.IsTerminal(w.Fd()),
			Level:      slog.LevelDebug,
		}),
	))
	utils.PrintEnvStatus()
}

func main() {
	defer func() {
		if err := recover(); err != nil {
			slog.Error(fmt.Sprintf("%v\n", err))
			debug.PrintStack()
			os.Exit(1)
		}
	}()

	err := commands.Execute()
	if err != nil {
		panic(err)
	}
}
