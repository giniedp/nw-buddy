package utils

import (
	"fmt"
)

func Must[T any](obj T, err error) T {
	if err != nil {
		panic(err)
	}
	return obj
}

func Must1[T any](err error) {
	if err != nil {
		panic(err)
	}
}

func HandleRecover(err *error, msg ...string) {
	if e := ToErr(*err, msg...); e != nil {
		*err = e
		return
	}
	if e := ToErr(recover(), msg...); e != nil {
		*err = e
		return
	}
}

func ToErr(err any, msg ...string) error {
	if err == nil {
		return nil
	}
	message := ""
	if len(msg) > 0 {
		message = msg[0] + ": "
	}
	switch e := err.(type) {
	case error:
		return fmt.Errorf("%s%w", message, e)
	default:
		return fmt.Errorf("%s%v", message, e)
	}
}
