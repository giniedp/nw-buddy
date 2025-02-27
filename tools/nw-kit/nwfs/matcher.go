package nwfs

import (
	"regexp"

	"github.com/gobwas/glob"
)

func CompileGlob(patterns ...string) (func(string) bool, error) {
	includes := make([]glob.Glob, 0)
	excludes := make([]glob.Glob, 0)
	for _, pattern := range patterns {
		if len(pattern) > 0 && pattern[0] == '!' {
			glb, err := glob.Compile(pattern[1:], '/')
			if err != nil {
				return nil, err
			}
			excludes = append(excludes, glb)
			continue
		}

		glb, err := glob.Compile(pattern, '/')
		if err != nil {
			return nil, err
		}
		includes = append(includes, glb)
	}
	match := func(path string) bool {
		for _, matcher := range excludes {
			if matcher.Match(path) {
				return false
			}
		}
		if len(includes) == 0 {
			return true
		}
		for _, matcher := range includes {
			if matcher.Match(path) {
				return true
			}
		}
		return false
	}
	return match, nil
}

func CompileRegexp(patterns ...string) (func(string) bool, error) {
	includes := make([]*regexp.Regexp, 0)
	excludes := make([]*regexp.Regexp, 0)
	for _, pattern := range patterns {
		if len(pattern) > 0 && pattern[0] == '!' {
			re, err := regexp.Compile(pattern[1:])
			if err != nil {
				return nil, err
			}
			excludes = append(excludes, re)
			continue
		}

		re, err := regexp.Compile(pattern)
		if err != nil {
			return nil, err
		}
		includes = append(includes, re)
	}
	match := func(path string) bool {
		for _, matcher := range excludes {
			if matcher.MatchString(path) {
				return false
			}
		}
		for _, matcher := range includes {
			if !matcher.MatchString(path) {
				return false
			}
		}
		return true
	}
	return match, nil
}
