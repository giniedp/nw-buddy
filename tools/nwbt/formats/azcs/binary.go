package azcs

import (
	"bytes"
	"fmt"
	"io"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/buf"
	"strings"

	"github.com/gofrs/uuid"
)

type Flags uint8

const (
	SIZE_MASK   = 0b0111
	IS_ROOT     = 1 << 3
	HAS_DATA    = 1 << 4
	HAS_SIZE    = 1 << 5
	HAS_NAME    = 1 << 6
	HAS_VERSION = 1 << 7
)

var (
	magicV1 = []byte{0, 0, 0, 0, 1}
	magicV2 = []byte{0, 0, 0, 0, 2}
	magicV3 = []byte{0, 0, 0, 0, 3}
)

func (f Flags) IsEmpty() bool {
	return f == 0
}

func (f Flags) IsRoot() bool {
	return f&IS_ROOT == IS_ROOT
}

func (f Flags) HasData() bool {
	return f&HAS_DATA == HAS_DATA
}

func (f Flags) HasSize() bool {
	return f&HAS_SIZE == HAS_SIZE
}

func (f Flags) HasName() bool {
	return f&HAS_NAME == HAS_NAME
}

func (f Flags) HasVersion() bool {
	return f&HAS_VERSION == HAS_VERSION
}

func (f Flags) ToSize() int {
	return int(f) & SIZE_MASK
}

type Object struct {
	Version  uint32
	Elements []*Element
}

type Element struct {
	Flags    Flags
	NameCrc  uint32
	Version  uint8
	Type     string
	Type2    string
	Data     []byte
	Elements []*Element
}

func IsBinaryObjectStream(data []byte) bool {
	return len(data) >= len(magicV1) && bytes.HasPrefix(data, magicV1) || bytes.HasPrefix(data, magicV2) || bytes.HasPrefix(data, magicV3)
}

func Load(f nwfs.File) (*Object, error) {
	data, err := f.Read()
	if err != nil {
		return nil, err
	}
	return Parse(data)
}

func Read(r io.Reader) (*Object, error) {
	data, err := io.ReadAll(r)
	if err != nil {
		return nil, err
	}
	return Parse(data)
}

func Parse(data []byte) (res *Object, err error) {
	return read(buf.NewReaderBE(data))
}

func read(r *buf.Reader) (res *Object, err error) {
	defer utils.HandleRecover(&err)

	if r.MustReadByte() != 0 {
		return nil, fmt.Errorf("invalid object")
	}

	res = &Object{}
	res.Version = r.MustReadUint32()
	res.Elements = utils.Must(readElements(r, res))
	return res, nil
}

func readElements(r *buf.Reader, o *Object) (res []*Element, err error) {
	list := make([]*Element, 0)
	for {
		element, err := nextElement(r, o)
		if err != nil {
			return nil, err
		}
		if element == nil {
			break
		}
		list = append(list, element)
	}
	return list, nil
}

func nextElement(r *buf.Reader, o *Object) (res *Element, err error) {
	defer utils.HandleRecover(&err)

	flags := Flags(r.MustReadByte())
	if flags.IsEmpty() {
		return nil, nil
	}
	res = &Element{
		Flags: flags,
	}
	if flags.HasName() {
		res.NameCrc = r.MustReadUint32()
	}
	if flags.HasVersion() {
		res.Version = r.MustReadByte()
	}
	res.Type = utils.Must(uuid.FromBytes(r.MustReadBytes(16))).String()
	if o.Version == 2 {
		res.Type2 = utils.Must(uuid.FromBytes(r.MustReadBytes(16))).String()
	}
	res.Type = strings.ToUpper(res.Type)
	res.Type2 = strings.ToUpper(res.Type2)

	if flags.HasData() {
		size := flags.ToSize()
		if flags.HasSize() {
			switch size {
			case 1:
				size = int(r.MustReadByte())
			case 2:
				size = int(r.MustReadUint16())
			case 4:
				size = int(r.MustReadUint32())
			default:
				return nil, fmt.Errorf("invalid size field %d (at: %#08x)", size, r.Pos())
			}
		}
		if size > 0 {
			res.Data = r.MustReadBytes(size)
		}
	}
	res.Elements = utils.Must(readElements(r, o))
	return res, nil
}

type WalkNode struct {
	Parent  *WalkNode
	Element *Element
	Index   int
	Depth   int
	Data    any
}

type WalkFn func(node *WalkNode) bool

func (e *Object) Walk(fn WalkFn) bool {
	for i, el := range e.Elements {
		node := &WalkNode{Element: el, Index: i, Depth: 0}
		if !el.walk(node, fn) {
			return false
		}
	}
	return true
}

func (e *Element) walk(node *WalkNode, fn WalkFn) bool {
	if !fn(node) {
		return false
	}
	for i, el := range e.Elements {
		next := &WalkNode{Parent: node, Element: el, Index: i, Depth: node.Depth + 1}
		if !el.walk(next, fn) {
			return false
		}
	}
	return true
}
