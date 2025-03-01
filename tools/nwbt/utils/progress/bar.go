package progress

import (
	"fmt"
	"log/slog"
	"math"
	"time"

	"github.com/vbauerster/mpb/v8"
	"github.com/vbauerster/mpb/v8/decor"
)

type ProgressBar interface {
	Add(int)
	Detail(string)
	Wait()
	Close()
}

type progressBar struct {
	prog  *mpb.Progress
	bar   *mpb.Bar
	msg   func(v string)
	count int
}

func (it *progressBar) Add(count int) {
	it.count += count
	it.bar.IncrBy(count)
}
func (it *progressBar) Detail(detail string) {
	it.msg(detail)
}
func (it *progressBar) Wait() {
	it.prog.Wait()
}
func (it *progressBar) Close() {
	it.bar.SetTotal(int64(it.count), true)
	time.Sleep(100 * time.Millisecond)
	it.prog.Wait()
}

func Bar(count int, title string) ProgressBar {
	title = formatDescription(title)

	msg := ""
	proc := mpb.New(mpb.WithWidth(32))
	bar := proc.New(
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
				return msg
			}, decor.WCSyncSpaceR),
		),
	)

	progress := &progressBar{proc, bar, func(v string) {
		msg = v
	}, 0}

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
