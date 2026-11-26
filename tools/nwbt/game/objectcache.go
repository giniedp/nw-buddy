package game

import (
	"container/list"
	"sync"
)

// ObjectCacheBudget is the budget of the parsed object stream cache, measured in uncompressed source file bytes.
// Parsed trees are several times larger than their source. Set it before the assets are initialized.
var ObjectCacheBudget int64 = 64 << 20

// minObjectWeight is charged for empty files and failed loads, so they are cached too
const minObjectWeight = 1 << 10

// objectCache is an LRU of parsed object streams with a byte budget. Shared slices and prefabs (small, requested
// often) stay cached, large one-shot files such as region capitals are evicted soon after use. Before, every parsed
// file was kept for the lifetime of the process.
type objectCache struct {
	mu     sync.Mutex
	budget int64
	used   int64
	order  *list.List // front = most recently used
	items  map[string]*list.Element
}

type objectCacheEntry struct {
	key    string
	value  any
	weight int64
}

func newObjectCache(budget int64) *objectCache {
	return &objectCache{
		budget: budget,
		order:  list.New(),
		items:  make(map[string]*list.Element),
	}
}

func (c *objectCache) Load(key string) (any, bool) {
	c.mu.Lock()
	defer c.mu.Unlock()
	el, ok := c.items[key]
	if !ok {
		return nil, false
	}
	c.order.MoveToFront(el)
	return el.Value.(*objectCacheEntry).value, true
}

func (c *objectCache) Store(key string, value any, weight int64) {
	weight = max(weight, minObjectWeight)
	c.mu.Lock()
	defer c.mu.Unlock()
	if weight > c.budget {
		return // larger than the whole cache, would only evict everything else
	}
	if el, ok := c.items[key]; ok {
		entry := el.Value.(*objectCacheEntry)
		c.used += weight - entry.weight
		entry.value = value
		entry.weight = weight
		c.order.MoveToFront(el)
	} else {
		c.items[key] = c.order.PushFront(&objectCacheEntry{key: key, value: value, weight: weight})
		c.used += weight
	}
	for c.used > c.budget {
		el := c.order.Back()
		entry := el.Value.(*objectCacheEntry)
		c.order.Remove(el)
		delete(c.items, entry.key)
		c.used -= entry.weight
	}
}

// Stats returns the number of entries and the used budget in bytes
func (c *objectCache) Stats() (count int, used int64) {
	c.mu.Lock()
	defer c.mu.Unlock()
	return len(c.items), c.used
}
