package utils

import (
	"bytes"
	"fmt"
)

type StringBuilder struct {
	buf bytes.Buffer
}

func NewStringBuilder() StringBuilder {
	return StringBuilder{}
}

func (it *StringBuilder) Append(s string) *StringBuilder {
	it.buf.WriteString(s)
	return it
}

func (it *StringBuilder) Appendf(s string, a ...any) *StringBuilder {
	it.buf.WriteString(fmt.Sprintf(s, a...))
	return it
}

func (it *StringBuilder) Appendln(s string) *StringBuilder {
	it.buf.WriteString(s)
	it.buf.WriteString("\n")
	return it
}

func (it *StringBuilder) String() string {
	return it.buf.String()
}
