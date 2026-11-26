package browse

import (
	"bytes"
	"encoding/binary"
	"fmt"
	"log/slog"
	"nw-buddy/tools/formats/catalog"
	"regexp"
	"runtime"
	"slices"
	"strings"
	"sync"
)

// Datasheets is the metadata of the datasheet browser of nw-viewer: the datasheets grouped by family (the row type
// name in the sheet header, e.g. MasterItemDefinitions over 43 sheets) and what the string columns hold, inferred
// from their values. No table or file names are hardcoded, older game versions work the same.
type Datasheets struct {
	Families []*SheetFamily `json:"families"`
}

// SheetFamily is the sheets of one row type
type SheetFamily struct {
	Name string `json:"name"`
	// rows over all sheets
	Rows int `json:"rows"`
	// in ascending asset guid order, the order the game visits them
	Sheets []*SheetInfo `json:"sheets"`
	// the union of the sheets' columns by lowercase name, in order of appearance, the first spelling
	Columns []*SheetColumn `json:"columns"`
}

// SheetInfo is one datasheet file
type SheetInfo struct {
	Path string `json:"path"`
	// the sheet name of the header, e.g. "HouseItems"
	Name    string `json:"name"`
	Rows    int    `json:"rows"`
	Columns int    `json:"columns"`
}

// ColumnKind is what the cells of a string column hold, inferred from their values
type ColumnKind string

const (
	KindNone ColumnKind = ""
	// the first column of a sheet: the key the rows are found by
	KindKey ColumnKind = "key"
	// keys of other families (or the own one), see SheetColumn.Refs
	KindRef ColumnKind = "ref"
	// localization keys, "@name"
	KindLoc ColumnKind = "loc"
	// file paths, see SheetColumn.Exts
	KindAsset ColumnKind = "asset"
	// audio trigger names, Play_*
	KindAudio ColumnKind = "audio"
)

// SheetColumn is one column of a family
type SheetColumn struct {
	Name string `json:"name"`
	// 1 string, 2 number, 3 boolean (of the first sheet with it)
	Type int        `json:"type"`
	Kind ColumnKind `json:"kind,omitempty"`
	// KindRef: the referenced families, best match first
	Refs []string `json:"refs,omitempty"`
	// KindAsset: the file extensions, lowercase without the dot, most common first
	Exts []string `json:"exts,omitempty"`
}

const (
	// distinct values of a column read to infer its kind
	maxInferValues = 4000
	// share of the values that must fit a kind
	minKindRatio = 0.5
	// columns with few distinct values (enums) need more
	smallColumn       = 5
	minSmallKindRatio = 0.8
	minRefHits        = 2
	// a further referenced family must add this share of the values
	minRefAddRatio = 0.05
	// families that match this share of the best match are kept as targets too (shared keys)
	refTargetTolerance = 0.9
)

var (
	listSeparator = regexp.MustCompile(`[,;+]`)
	pathLike      = regexp.MustCompile(`^[^\s]*[/\\][^\s]*\.([A-Za-z0-9]{2,14})$`)
	audioLike     = regexp.MustCompile(`(?i)^(play|stop)_`)
)

// rawSheet reads cells straight from the file bytes. Ported from nw-viewer `src/formats/datasheet`.
type rawSheet struct {
	data    []byte
	name    string
	family  string
	cols    []rawColumn
	rows    int
	cells   int
	strings int
}

type rawColumn struct {
	name string
	typ  int
}

func readRawSheet(data []byte) (*rawSheet, error) {
	const headerSize = 0x5c
	if len(data) < headerSize {
		return nil, fmt.Errorf("%d bytes, the header has %d", len(data), headerSize)
	}
	u32 := func(at int) int { return int(binary.LittleEndian.Uint32(data[at:])) }
	version := u32(0)
	if version != 0x11 && version != 0x12 {
		return nil, fmt.Errorf("version 0x%x", version)
	}
	colCount := u32(0x44)
	rowCount := u32(0x48)
	sheet := &rawSheet{data: data, rows: rowCount}
	sheet.cells = headerSize + colCount*12
	sheet.strings = u32(0x38) + 0x3c
	if colCount > len(data)/12 || rowCount > len(data) || sheet.cells+rowCount*colCount*8 != sheet.strings || sheet.strings > len(data) {
		return nil, fmt.Errorf("bad layout: %d columns, %d rows in %d bytes", colCount, rowCount, len(data))
	}
	sheet.name = string(sheet.stringAt(u32(0x08)))
	sheet.family = string(sheet.stringAt(u32(0x10)))
	for i := range colCount {
		at := headerSize + i*12
		sheet.cols = append(sheet.cols, rawColumn{name: string(sheet.stringAt(u32(at + 4))), typ: u32(at + 8)})
	}
	return sheet, nil
}

func (s *rawSheet) stringAt(offset int) []byte {
	start := s.strings + offset
	if start >= len(s.data) {
		return nil
	}
	end := bytes.IndexByte(s.data[start:], 0)
	if end < 0 {
		return nil
	}
	return s.data[start : start+end]
}

// cellOffset is the string offset of a string cell
func (s *rawSheet) cellOffset(row, col int) int {
	return int(binary.LittleEndian.Uint32(s.data[s.cells+(row*len(s.cols)+col)*8+4:]))
}

// BuildDatasheets reads every datasheet of the index (by its catalog type format, not by path) and infers the
// kinds of the string columns. The file bytes are released after the scan, only the result stays.
func (index *Index) BuildDatasheets() *Datasheets {
	type entry struct {
		path  string
		guid  string
		sheet *rawSheet
	}
	entries := []*entry{}
	for i := range index.files {
		file, typ, asset := index.File(i)
		if typ.Format != catalog.FormatDatasheet {
			continue
		}
		guid := ""
		if asset != nil {
			guid = strings.ToLower(asset.Guid)
		}
		entries = append(entries, &entry{path: file.Path(), guid: guid})
	}

	// read in parallel, the pak reads decompress
	jobs := make(chan *entry)
	wg := sync.WaitGroup{}
	for range runtime.NumCPU() {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for it := range jobs {
				i, _ := index.Lookup(it.path)
				data, err := index.files[i].Read()
				if err != nil {
					slog.Warn("datasheet not read", "file", it.path, "err", err)
					continue
				}
				sheet, err := readRawSheet(data)
				if err != nil {
					slog.Warn("datasheet not parsed", "file", it.path, "err", err)
					continue
				}
				it.sheet = sheet
			}
		}()
	}
	for _, it := range entries {
		jobs <- it
	}
	close(jobs)
	wg.Wait()

	// families, sheets in guid order (stable: equal guids keep the path order)
	byName := map[string]*SheetFamily{}
	sheetsOf := map[*SheetFamily][]*rawSheet{}
	order := []*SheetFamily{}
	slices.SortStableFunc(entries, func(a, b *entry) int { return strings.Compare(a.guid, b.guid) })
	for _, it := range entries {
		if it.sheet == nil {
			continue
		}
		family := byName[it.sheet.family]
		if family == nil {
			family = &SheetFamily{Name: it.sheet.family}
			byName[it.sheet.family] = family
			order = append(order, family)
		}
		family.Sheets = append(family.Sheets, &SheetInfo{
			Path:    it.path,
			Name:    it.sheet.name,
			Rows:    it.sheet.rows,
			Columns: len(it.sheet.cols),
		})
		family.Rows += it.sheet.rows
		sheetsOf[family] = append(sheetsOf[family], it.sheet)
	}
	slices.SortFunc(order, func(a, b *SheetFamily) int { return strings.Compare(strings.ToLower(a.Name), strings.ToLower(b.Name)) })

	// keys: the lowercase first cells of each family
	keys := map[*SheetFamily]map[string]struct{}{}
	for _, family := range order {
		set := map[string]struct{}{}
		for _, sheet := range sheetsOf[family] {
			if len(sheet.cols) == 0 || sheet.cols[0].typ != 1 {
				continue
			}
			for row := range sheet.rows {
				if value := sheet.stringAt(sheet.cellOffset(row, 0)); len(value) > 0 {
					set[strings.ToLower(string(value))] = struct{}{}
				}
			}
		}
		keys[family] = set
	}

	for _, family := range order {
		family.Columns = inferColumns(sheetsOf[family], order, keys)
	}
	return &Datasheets{Families: order}
}

// inferColumns builds the column union of a family and the kinds of its string columns
func inferColumns(sheets []*rawSheet, families []*SheetFamily, keys map[*SheetFamily]map[string]struct{}) []*SheetColumn {
	columns := []*SheetColumn{}
	byName := map[string]int{}
	values := []map[string]struct{}{}
	// the first column of each sheet holds its keys, sheets of a family may start with different columns
	keyColumns := map[int]bool{}
	for _, sheet := range sheets {
		for col, raw := range sheet.cols {
			lower := strings.ToLower(raw.name)
			ci, ok := byName[lower]
			if !ok {
				ci = len(columns)
				byName[lower] = ci
				columns = append(columns, &SheetColumn{Name: raw.name, Type: raw.typ})
				values = append(values, map[string]struct{}{})
			}
			if col == 0 {
				keyColumns[ci] = true
			}
			if raw.typ != 1 {
				continue
			}
			set := values[ci]
			seen := map[int]struct{}{}
			for row := 0; row < sheet.rows && len(set) < maxInferValues; row++ {
				offset := sheet.cellOffset(row, col)
				if _, ok := seen[offset]; ok {
					continue
				}
				seen[offset] = struct{}{}
				if value := sheet.stringAt(offset); len(value) > 0 {
					set[string(value)] = struct{}{}
				}
			}
		}
	}
	for ci, column := range columns {
		if keyColumns[ci] {
			column.Kind = KindKey
			continue
		}
		if column.Type != 1 || len(values[ci]) == 0 {
			continue
		}
		inferKind(column, values[ci], families, keys)
	}
	return columns
}

func inferKind(column *SheetColumn, values map[string]struct{}, families []*SheetFamily, keys map[*SheetFamily]map[string]struct{}) {
	minRatio := minKindRatio
	if len(values) < smallColumn {
		minRatio = minSmallKindRatio
	}
	parts := []string{}
	loc := 0
	for value := range values {
		if strings.HasPrefix(value, "@") {
			loc++
		}
		for _, part := range listSeparator.Split(value, -1) {
			if part = strings.TrimSpace(part); part != "" {
				parts = append(parts, part)
			}
		}
	}
	if float64(loc)/float64(len(values)) >= minRatio {
		column.Kind = KindLoc
		return
	}
	if len(parts) == 0 {
		return
	}

	exts := map[string]int{}
	assets, audio := 0, 0
	for _, part := range parts {
		if m := pathLike.FindStringSubmatch(part); m != nil {
			assets++
			exts[strings.ToLower(m[1])]++
		}
		if audioLike.MatchString(part) {
			audio++
		}
	}
	if float64(assets)/float64(len(parts)) >= minRatio {
		column.Kind = KindAsset
		for ext := range exts {
			column.Exts = append(column.Exts, ext)
		}
		slices.SortFunc(column.Exts, func(a, b string) int { return exts[b] - exts[a] })
		return
	}
	if float64(audio)/float64(len(parts)) >= minRatio {
		column.Kind = KindAudio
		return
	}

	// the values each family has as keys
	type hit struct {
		family *SheetFamily
		values []bool
	}
	hits := []*hit{}
	lower := make([]string, len(parts))
	for i, part := range parts {
		lower[i] = strings.ToLower(part)
	}
	for _, family := range families {
		set := keys[family]
		if len(set) == 0 {
			continue
		}
		values := make([]bool, len(lower))
		count := 0
		for i, part := range lower {
			if _, ok := set[part]; ok {
				values[i] = true
				count++
			}
		}
		if count >= minRefHits {
			hits = append(hits, &hit{family, values})
		}
	}

	// A column may name the rows of several families (ItemStatsRef: weapon, armor and consumable items), picked
	// greedily by the values they add. Families share keys (an ability id is also a progression point id, an item's
	// ItemStatsRef its own ItemID), so the families that match about as well as the best one are kept too; the
	// client links every family that has a value. Best match first.
	covered := make([]bool, len(lower))
	coveredCount := 0
	minAdd := max(minRefHits, int(float64(len(lower))*minRefAddRatio))
	picked := map[*hit]bool{}
	for {
		var best *hit
		bestAdd := 0
		for _, it := range hits {
			add := 0
			for i, v := range it.values {
				if v && !covered[i] {
					add++
				}
			}
			if add > bestAdd {
				best, bestAdd = it, add
			}
		}
		if best == nil || bestAdd < minAdd {
			break
		}
		for i, v := range best.values {
			if v && !covered[i] {
				covered[i] = true
				coveredCount++
			}
		}
		picked[best] = true
	}
	if len(picked) == 0 || float64(coveredCount)/float64(len(lower)) < minRatio {
		return
	}
	count := map[*hit]int{}
	bestCount := 0
	for _, it := range hits {
		for _, v := range it.values {
			if v {
				count[it]++
			}
		}
		bestCount = max(bestCount, count[it])
	}
	for _, it := range hits {
		if float64(count[it]) >= float64(bestCount)*refTargetTolerance {
			picked[it] = true
		}
	}
	targets := []*hit{}
	for _, it := range hits {
		if picked[it] {
			targets = append(targets, it)
		}
	}
	slices.SortStableFunc(targets, func(a, b *hit) int { return count[b] - count[a] })
	column.Kind = KindRef
	for _, it := range targets {
		column.Refs = append(column.Refs, it.family.Name)
	}
}
