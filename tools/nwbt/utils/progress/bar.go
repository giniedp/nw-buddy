package progress

import (
	"fmt"
	"log/slog"
	"math"
	"sync"
	"sync/atomic"

	"github.com/vbauerster/mpb/v8"
	"github.com/vbauerster/mpb/v8/decor"
)

type ProgressBar interface {
	Add(int)
	Detail(string)
	Wait()
	Close()
}

// progressBar is one bar in its own container. A container renders until it is closed: an open one draws over the
// lines of the next bar, so every bar must be closed (Close or Wait).
type progressBar struct {
	prog   *mpb.Progress
	bar    *mpb.Bar
	detail atomic.Pointer[string]
	once   sync.Once
}

func (it *progressBar) Add(count int) {
	it.bar.IncrBy(count)
}

func (it *progressBar) Detail(detail string) {
	it.detail.Store(&detail)
}

// Wait waits until the bar reached its total, then closes the container
func (it *progressBar) Wait() {
	it.once.Do(func() {
		it.prog.Wait()
	})
}

// Close completes the bar where it is (a bar below its total is aborted) and closes the container. Closing twice is
// allowed.
func (it *progressBar) Close() {
	it.once.Do(func() {
		// SetTotal completes a bar created without total, Abort one created with a total (SetTotal ignores those)
		it.bar.SetTotal(-1, true)
		it.bar.Abort(false)
		it.prog.Wait()
	})
}

func Bar(count int, title string) ProgressBar {
	proc := mpb.New(mpb.WithWidth(32))
	progress := &progressBar{prog: proc}
	progress.bar = proc.New(
		int64(count),
		mpb.BarStyle(),
		mpb.PrependDecorators(
			decor.Name(formatDescription(title)),
		),
		mpb.AppendDecorators(
			percentage(decor.WCSyncSpaceR),
			decor.CountersNoUnit("%d/%d", decor.WCSyncSpaceR),
			decor.Elapsed(decor.ET_STYLE_MMSS, decor.WCSyncSpaceR),
			decor.Any(func(s decor.Statistics) string {
				if detail := progress.detail.Load(); detail != nil {
					return *detail
				}
				return ""
			}, decor.WCSyncSpaceR),
		),
	)
	return progress
}

func percentage(wcc ...decor.WC) decor.Decorator {
	f := func(s decor.Statistics) string {
		value := 0.0
		if s.Total > 0 {
			value = float64(s.Current) / float64(s.Total) * 100
		} else if s.Current > s.Total {
			value = 100
		}
		return fmt.Sprintf("%3d", int(math.Floor(value))) + "%"
	}
	return decor.Any(f, wcc...)
}

func formatDescription(description string) string {
	description = fmt.Sprintf("%20s", description)
	if len(description) > 20 {
		description = fmt.Sprintf("%s...", description[:17])
	}
	return description
}

type ProgressMessage struct {
	Err error
	Msg string
}

func Group(total int, title string, results <-chan ProgressMessage) ProgressBar {
	bar := Bar(total, title)
	go func() {
		for result := range results {
			bar.Add(1)
			if result.Err != nil {
				slog.Error(fmt.Sprintf("%s %v", result.Msg, result.Err))
			}
		}
	}()

	return bar
}
