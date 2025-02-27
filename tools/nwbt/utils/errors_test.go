package utils_test

import (
	"fmt"
	"nw-buddy/tools/utils"
)

func thisPasses() (err error) {
	defer utils.HandleRecover(&err)
	return nil
}

func ExampleHandleRecover_noError() {
	err := thisPasses()
	fmt.Println(err)
	// Output: <nil>
}

func thisErrors() (err error) {
	defer utils.HandleRecover(&err)
	return fmt.Errorf("this is an error")
}

func ExampleHandleRecover_withError() {
	err := thisErrors()
	fmt.Println(err)
	// Output: this is an error
}

func thisPanics() (err error) {
	defer utils.HandleRecover(&err)
	panic("this is a panic")
}

func ExampleHandleRecover_withPanic() {
	err := thisPanics()
	fmt.Println(err)
	// Output: this is a panic
}
