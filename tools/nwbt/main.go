package main

import (
	"log/slog"
	"nw-buddy/tools/commands"
	"nw-buddy/tools/utils/logging"
	"os"
	"runtime/debug"
)

func init() {
	slog.SetDefault(logging.DefaultTerminalHandler())
}

func main() {
	defer func() {
		if err := recover(); err != nil {
			slog.Error("Unexpected error occurred", "error", err)
			debug.PrintStack()
			os.Exit(1)
		}
	}()

	if err := commands.Execute(); err != nil {
		panic(err)
	}
}
