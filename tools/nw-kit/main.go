package main

import (
	"fmt"
	"log/slog"
	"nw-buddy/tools/nw-kit/commands"
	"nw-buddy/tools/nw-kit/utils/env"
	"nw-buddy/tools/nw-kit/utils/logging"
	"os"
	"runtime/debug"

	"runtime/pprof"
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
	cpuprof, _ := os.Create("cpu.prof")
	pprof.StartCPUProfile(cpuprof)
	defer pprof.StopCPUProfile()

	err := commands.Execute()
	if err != nil {
		panic(err)
	}
}
