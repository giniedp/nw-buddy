package progress

import (
	"fmt"
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

func RunTasks[T any, O any](spec TasksConfig[T, O]) {
	type proxy struct {
		value O
		err   error
	}

	cInput := make(chan T)
	cOutput := make(chan *proxy)
	cDone := make(chan ProgressMessage)

	for range max(1, spec.ProducerCount) {
		go func() {
			for task := range cInput {
				out, err := spec.Producer(task)
				cOutput <- &proxy{out, err}
			}
		}()
	}

	for range max(1, spec.ConsumerCount) {
		go func() {
			for task := range cOutput {
				if spec.Consumer == nil {
					cDone <- ProgressMessage{Msg: fmt.Sprintf("%v", task.value), Err: task.err}
				} else {
					msg, err := spec.Consumer(task.value, task.err)
					cDone <- ProgressMessage{Msg: msg, Err: err}
				}
			}
		}()
	}

	bar := Group(len(spec.Tasks), spec.Description, cDone)
	for _, task := range spec.Tasks {
		cInput <- task
	}
	bar.Wait()

	close(cInput)
	close(cOutput)
	close(cDone)
}
