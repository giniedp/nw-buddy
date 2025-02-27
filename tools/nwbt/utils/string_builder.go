package utils

import (
	"bytes"
	"fmt"
	"strings"
)

type StringBuilder struct {
	buf    bytes.Buffer
	indent int
}

func NewStringBuilder() StringBuilder {
	return StringBuilder{}
}

// Append adds a string to the buffer ignoring indentation
func (it *StringBuilder) Append(s string) *StringBuilder {
	it.buf.WriteString(s)
	return it
}

// Line adds a string to the buffer with a newline character
func (it *StringBuilder) Line(s string, a ...any) *StringBuilder {
	if it.indent > 0 {
		it.buf.WriteString(strings.Repeat("  ", it.indent))
	}
	if len(a) == 0 {
		it.buf.WriteString(s)
	} else {
		it.buf.WriteString(fmt.Sprintf(s, a...))
	}
	it.buf.WriteString("\n")
	return it
}

func (it *StringBuilder) Indent() *StringBuilder {
	it.indent++
	return it
}

func (it *StringBuilder) Unindent() *StringBuilder {
	it.indent--
	return it
}

func (it *StringBuilder) String() string {
	return it.buf.String()
}
