package main

import (
	"fmt"
	"log/slog"
	"nw-buddy/tools/commands"
	"nw-buddy/tools/utils/env"
	"nw-buddy/tools/utils/logging"
	"os"
	"runtime/debug"
)

func init() {
	slog.SetDefault(logging.DefaultTerminalHandler())
	env.PrintStatus()
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
