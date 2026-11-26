package nwfs

import (
	"fmt"
	"io/fs"
	"sync"
	"testing"
	"time"
)

type testFile struct {
	path string
}

func (f *testFile) Archive() Archive      { return nil }
func (f *testFile) Package() string       { return "" }
func (f *testFile) Path() string          { return f.path }
func (f *testFile) Read() ([]byte, error) { return []byte(f.path), nil }
func (f *testFile) Stat() fs.FileInfo     { return nil }

// Concurrent first use of Lookup/ReadFile/Glob used to deadlock: the lazy index was built under a
// write lock while other calls held (re-entrant) read locks.
func TestBaseFSConcurrentFirstUse(t *testing.T) {
	for round := 0; round < 20; round++ {
		d := &baseFS{}
		for i := 0; i < 2000; i++ {
			d.files = append(d.files, &testFile{path: fmt.Sprintf("dir/file_%d.dds", i)})
		}
		d.initSuffix()

		done := make(chan struct{})
		go func() {
			var wg sync.WaitGroup
			for g := 0; g < 64; g++ {
				wg.Add(1)
				go func(g int) {
					defer wg.Done()
					p := fmt.Sprintf("dir/file_%d.dds", g)
					switch g % 4 {
					case 0:
						if _, ok := d.Lookup(p); !ok {
							t.Errorf("lookup %s failed", p)
						}
					case 1:
						if data, err := d.ReadFile(p); err != nil || string(data) != p {
							t.Errorf("read %s failed: %v", p, err)
						}
					case 2:
						if _, ok := d.LookupBySuffix(fmt.Sprintf("file_%d.dds", g)); !ok {
							t.Errorf("suffix lookup %s failed", p)
						}
					case 3:
						if res, err := d.Glob("dir/*.dds"); err != nil || len(res) != 2000 {
							t.Errorf("glob failed: %d %v", len(res), err)
						}
					}
				}(g)
			}
			wg.Wait()
			close(done)
		}()
		select {
		case <-done:
		case <-time.After(10 * time.Second):
			t.Fatal("deadlock: concurrent first use did not finish")
		}
	}
}
