package utils

import (
	"fmt"
	"log/slog"
	"os"
	"sync"
	"time"

	"github.com/schollz/progressbar/v3"
)

func Progress(count int, description string, detail int) *progressbar.ProgressBar {
	description = fmt.Sprintf("%20s", description)
	if len(description) > 20 {
		description = fmt.Sprintf("%17s...", description[:20])
	}
	options := []progressbar.Option{
		progressbar.OptionSetDescription(description),
		progressbar.OptionShowTotalBytes(true),
		progressbar.OptionThrottle(16 * time.Millisecond),
		progressbar.OptionShowCount(),
		progressbar.OptionSpinnerType(14),
		progressbar.OptionSetWriter(os.Stdout),
		progressbar.OptionSetElapsedTime(true),
		progressbar.OptionShowElapsedTimeOnFinish(),
		progressbar.OptionUseANSICodes(true),
		progressbar.OptionOnCompletion(func() {
			fmt.Fprint(os.Stdout, "\n")
		}),
		// progressbar.OptionShowDescriptionAtLineEnd(),
	}
	if detail > 0 {
		options = append(options, progressbar.OptionSetMaxDetailRow(detail))
	}
	if count >= 0 {
		options = append(options,
			progressbar.OptionShowIts(),
			progressbar.OptionSetPredictTime(true),
		)
	}
	bar := progressbar.NewOptions(count, options...)
	bar.AddDetail("")
	return bar
}

func ProgressBytes(count int, description string, detail int) *progressbar.ProgressBar {
	description = fmt.Sprintf("%20s", description)
	if len(description) > 20 {
		description = fmt.Sprintf("%17s...", description[:20])
	}
	options := []progressbar.Option{
		progressbar.OptionSetDescription(description),
		progressbar.OptionShowTotalBytes(true),
		progressbar.OptionThrottle(100 * time.Millisecond),
		progressbar.OptionShowCount(),
		progressbar.OptionSetMaxDetailRow(detail),
		progressbar.OptionSpinnerType(14),
		progressbar.OptionSetWriter(os.Stdout),
		progressbar.OptionSetElapsedTime(true),
		progressbar.OptionShowElapsedTimeOnFinish(),
		progressbar.OptionUseANSICodes(true),
		// progressbar.OptionOnCompletion(func() {
		// 	for i := 0; i < detail; i++ {
		// 		fmt.Fprintln(os.Stdout, strconv.Itoa(i))
		// 	}
		// }),
	}

	if count >= 0 {
		options = append(options,
			progressbar.OptionShowIts(),
			progressbar.OptionShowBytes(true),
			progressbar.OptionSetPredictTime(true),
		)
	}
	return progressbar.NewOptions(count, options...)
}

type ProgressMessage struct {
	Err error
	Msg string
}

func ProgressGroup(total int, title string, results <-chan ProgressMessage) *sync.WaitGroup {
	wg := sync.WaitGroup{}
	wg.Add(total)
	go func() {
		bar := Progress(total, title, 5)
		for result := range results {
			wg.Done()
			bar.Add(1)
			bar.AddDetail(result.Msg)
			if result.Err != nil {
				slog.Error(fmt.Sprintf("%s %v", result.Msg, result.Err))
			}
		}
		bar.Close()
	}()

	return &wg
}
