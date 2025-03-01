package str

import (
	"bytes"
	"fmt"
	"strings"
)

type Builder struct {
	buf    bytes.Buffer
	indent int
}

func NewBuilder() Builder {
	return Builder{}
}

// Append adds a string to the buffer ignoring indentation
func (it *Builder) Append(s string) *Builder {
	it.buf.WriteString(s)
	return it
}

// Line adds a string to the buffer with a newline character
func (it *Builder) Line(s string, a ...any) *Builder {
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

func (it *Builder) Indent() *Builder {
	it.indent++
	return it
}

func (it *Builder) Unindent() *Builder {
	it.indent--
	return it
}

func (it *Builder) String() string {
	return it.buf.String()
}
