package progress

import (
	"errors"
	"sync/atomic"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

func TestRunTasksCompletesAllTasks(t *testing.T) {
	var done atomic.Int32
	var consumed atomic.Int32
	RunTasks(TasksConfig[int, string]{
		Description:   "test",
		Tasks:         []int{1, 2, 3},
		ProducerCount: 8,
		Producer: func(input int) (string, error) {
			time.Sleep(50 * time.Millisecond)
			done.Add(1)
			return "task", nil
		},
		ConsumerCount: 2,
		Consumer: func(value string, err error) (string, error) {
			consumed.Add(1)
			return value, err
		},
	})
	require.Equal(t, int32(3), done.Load())
	require.Equal(t, int32(3), consumed.Load())
}

func TestRunTasksRecoversPanics(t *testing.T) {
	var errs atomic.Int32
	RunTasks(TasksConfig[int, string]{
		Description:   "test",
		Tasks:         []int{1, 2, 3, 4},
		ProducerCount: 2,
		Producer: func(input int) (string, error) {
			switch input {
			case 1:
				panic("producer")
			case 2:
				return "", errors.New("failed")
			}
			return "ok", nil
		},
		Consumer: func(value string, err error) (string, error) {
			if err != nil {
				errs.Add(1)
			}
			if value == "ok" {
				panic("consumer")
			}
			return value, err
		},
	})
	require.Equal(t, int32(2), errs.Load())
}

func TestBarCloseBelowTotal(t *testing.T) {
	bar := Bar(10, "test")
	bar.Add(3)
	finished := make(chan struct{})
	go func() {
		bar.Close()
		bar.Close()
		close(finished)
	}()
	select {
	case <-finished:
	case <-time.After(5 * time.Second):
		t.Fatal("Close blocked on a bar below its total")
	}
}
