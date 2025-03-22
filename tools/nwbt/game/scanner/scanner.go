package scanner

import (
	"nw-buddy/tools/game"
	"sync"
)

type Scanner struct {
	*game.Assets
	mu      sync.RWMutex
	results ScanResults
}

func (it *Scanner) Results() ScanResults {
	return it.results
}

func NewScanner(assets *game.Assets) (*Scanner, error) {
	return &Scanner{
		Assets: assets,
	}, nil
}
