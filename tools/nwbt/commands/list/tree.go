package list

import (
	"fmt"
	"io"
	"io/fs"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils/maps"
	"slices"
	"strings"
	"time"

	"github.com/dustin/go-humanize"
)

func ToTree(files []nwfs.File) *Node {
	tree := NewNode("")
	for _, file := range files {
		tree.Add(file.Path(), file.Stat())
	}
	return tree
}

type Node struct {
	Name        string
	Files       []fs.FileInfo
	Folders     *maps.Dict[*Node]
	byteCount   *int
	fileCount   *int
	folderCount *int
}

func NewNode(name string) *Node {
	return &Node{
		Name:    name,
		Files:   make([]fs.FileInfo, 0),
		Folders: maps.NewDict[*Node](),
	}
}

func (n *Node) Add(file string, info fs.FileInfo) {
	n.byteCount = nil
	n.fileCount = nil
	n.folderCount = nil
	if !strings.ContainsRune(file, '/') {
		n.Files = append(n.Files, info)
		return
	}
	tokens := strings.SplitN(file, "/", 2)
	if !n.Folders.Has(tokens[0]) {
		n.Folders.Store(tokens[0], NewNode(tokens[0]))
	}
	n.Folders.Get(tokens[0]).Add(tokens[1], info)
}

func (n *Node) Sort() {
	slices.SortStableFunc(n.Files, func(a, b fs.FileInfo) int {
		return strings.Compare(a.Name(), b.Name())
	})
	n.Folders.SortFunc(func(a, b string) int {
		return strings.Compare(a, b)
	})
	for _, node := range n.Folders.Iter() {
		node.Sort()
	}
}

func (n *Node) FolderCount() int {
	if n.folderCount != nil {
		return *n.folderCount
	}
	c := n.Folders.Len()
	for _, node := range n.Folders.Iter() {
		c += node.FolderCount()
	}
	n.folderCount = &c
	return c
}

func (n *Node) FileCount() int {
	if n.fileCount != nil {
		return *n.fileCount
	}
	c := len(n.Files)
	for _, node := range n.Folders.Iter() {
		c += node.FileCount()
	}
	n.fileCount = &c
	return c
}

func (n *Node) ByteCount() int {
	if n.byteCount != nil {
		return *n.byteCount
	}
	c := 0
	for _, file := range n.Files {
		c += int(file.Size())
	}
	for _, node := range n.Folders.Iter() {
		c += node.ByteCount()
	}
	n.byteCount = &c
	return c
}

func (n *Node) MaxNameSize() int {
	c := 0
	for _, file := range n.Files {
		c = max(c, len(file.Name()))
	}
	for _, node := range n.Folders.Iter() {
		c = max(c, len(node.Name))
	}
	return c
}

type PrintContext struct {
	Prefix     string
	Depth      int
	MaxDepth   int
	MaxEntries int
	IsLast     bool
	Symbols    [4]string
}

func (n *Node) Print(w io.Writer, ctx PrintContext) {
	prefix := ctx.Prefix
	symbol := ""
	if ctx.Depth > 0 {
		symbol = ctx.Symbols[1] // "├─"
	}
	if ctx.IsLast {
		symbol = ctx.Symbols[2] // "└─"
	}

	fmt.Fprintf(w, "%s%s%s", prefix, symbol, n.Name)
	if ctx.Depth >= ctx.MaxDepth {
		fmt.Fprintf(w, "\t%4d Files\t%4d Folders\t%10s\t\t\n", n.FileCount(), n.FolderCount(), humanize.Bytes(uint64(n.ByteCount())))
		return
	} else {
		fmt.Fprintf(w, "\t%4d Files\t%4d Folders\t%10s\t\t\n", len(n.Files), n.Folders.Len(), humanize.Bytes(uint64(n.ByteCount())))
	}

	total := len(n.Files) + n.Folders.Len()
	c := 0
	i := 0

	if ctx.Depth > 0 {
		prefix = ctx.Prefix + ctx.Symbols[0] // "│ "
	}
	if ctx.IsLast {
		prefix = ctx.Prefix + ctx.Symbols[3] // "  "
	}
	for _, node := range n.Folders.Iter() {
		isLast := i == n.Folders.Len()-1 && len(n.Files) == 0
		nodeContext := ctx
		nodeContext.Prefix = prefix
		nodeContext.Depth = ctx.Depth + 1
		nodeContext.IsLast = isLast
		node.Print(w, nodeContext)
		i++
		c++
		if !isLast && c >= ctx.MaxEntries {
			left := max(0, total-c)
			if left > 0 {
				fmt.Fprintf(w, "%s... %d more\t\t\t\t\t\n", prefix, left)
			}
			return
		}
	}
	i = 0
	for _, file := range n.Files {
		isLast := i == len(n.Files)-1
		symbol = ctx.Symbols[1] // "├─"
		if isLast {
			symbol = ctx.Symbols[2] // "└─"
		}
		fmt.Fprintf(w, "%s%s%s\t\t\t%10s\t%s\t%s\n", prefix, symbol, file.Name(), humanize.Bytes(uint64(file.Size())), file.ModTime().Format(time.DateOnly), file.ModTime().Format(time.TimeOnly))

		i++
		c++
		if !isLast && c >= ctx.MaxEntries {
			left := max(0, total-c)
			if left > 0 {
				fmt.Fprintf(w, "%s... %d more\t\t\t\t\t\n", prefix, left)
			}
			return
		}
	}
}
