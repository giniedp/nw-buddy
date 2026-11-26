package progress

import (
	"context"
	"fmt"
	"log/slog"
	"runtime/debug"
	"sync"
	"sync/atomic"

	"golang.org/x/sync/errgroup"
)

type TasksConfig[T any, O any] struct {
	Description   string
	Tasks         []T
	ProducerCount int
	Producer      func(input T) (O, error)
	ConsumerCount int
	Consumer      func(value O, err error) (string, error)
	DetailSize    int
}

// RunTasks runs the producers and consumers on the tasks and returns when all are done. The bar shows the last
// message (the consumer's, or the producer's value) and the number of failed tasks. A panic of a producer or
// consumer fails its task, the others go on.
func RunTasks[T any, O any](spec TasksConfig[T, O]) {
	if len(spec.Tasks) == 0 {
		return
	}
	type proxy struct {
		value O
		err   error
	}

	bar := Bar(len(spec.Tasks), spec.Description)
	cInput := make(chan T)
	cOutput := make(chan proxy)
	var failed atomic.Int64

	var producers sync.WaitGroup
	for range max(1, spec.ProducerCount) {
		producers.Add(1)
		go func() {
			defer producers.Done()
			for task := range cInput {
				out, err := produce(spec.Producer, task)
				cOutput <- proxy{out, err}
			}
		}()
	}

	var consumers sync.WaitGroup
	for range max(1, spec.ConsumerCount) {
		consumers.Add(1)
		go func() {
			defer consumers.Done()
			for task := range cOutput {
				msg, err := consume(spec.Consumer, task.value, task.err)
				if err != nil {
					failed.Add(1)
					slog.Error("task failed", "task", msg, "err", err)
				}
				if count := failed.Load(); count > 0 {
					msg = fmt.Sprintf("%d failed %s", count, msg)
				}
				bar.Detail(msg)
				bar.Add(1)
			}
		}()
	}

	for _, task := range spec.Tasks {
		cInput <- task
	}
	close(cInput)
	producers.Wait()
	close(cOutput)
	consumers.Wait()
	bar.Close()
	if count := failed.Load(); count > 0 {
		slog.Warn("tasks failed", "description", spec.Description, "failed", count, "total", len(spec.Tasks))
	}
}

func produce[T any, O any](producer func(input T) (O, error), task T) (out O, err error) {
	defer recoverTask(&err)
	return producer(task)
}

func consume[O any](consumer func(value O, err error) (string, error), value O, valueErr error) (msg string, err error) {
	defer recoverTask(&err)
	if consumer == nil {
		// only a string value is a message, other values may be large (blobs)
		text, _ := any(value).(string)
		return text, valueErr
	}
	return consumer(value, valueErr)
}

func recoverTask(err *error) {
	if r := recover(); r != nil {
		*err = fmt.Errorf("panic: %v\n%s", r, debug.Stack())
	}
}

func Concurrent[T any](worker uint, tasks []T, handler func(input T, index int) error) error {
	if len(tasks) == 0 {
		return nil
	}
	group, ctx := errgroup.WithContext(context.Background())
	group.SetLimit(int(worker))
	for i, task := range tasks {
		group.Go(func() error {
			select {
			case <-ctx.Done():
				return ctx.Err()
			default:
				return handler(task, i)
			}
		})
	}
	return group.Wait()
}
