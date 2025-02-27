package str

import (
	"slices"
	"strings"
	"unicode/utf8"
)

type SuffixArray struct {
	list [][2]string
}

func NewSuffixArray(list []string) *SuffixArray {
	res := &SuffixArray{}
	res.list = make([][2]string, len(list))
	for i, s := range list {
		res.list[i] = [2]string{s, reverse(s)}
	}
	slices.SortFunc(res.list, func(i, j [2]string) int {
		return strings.Compare(i[1], j[1])
	})
	return res
}

func reverse(s string) string {
	o := make([]rune, utf8.RuneCountInString(s))
	i := len(o)
	for _, c := range s {
		i--
		o[i] = c
	}
	return string(o)
}

func (sa *SuffixArray) Lookup(s string) (string, bool) {
	found, ok := slices.BinarySearchFunc(sa.list, reverse(s), func(i [2]string, target string) int {
		if strings.HasPrefix(i[1], target) {
			return 0
		}
		return strings.Compare(i[1], target)
	})
	if ok {
		return sa.list[found][0], true
	}
	return "", false
}
