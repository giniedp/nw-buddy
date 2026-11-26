package level

import (
	"bytes"
	"encoding/binary"
	"nw-buddy/tools/utils/json"
	"nw-buddy/tools/utils/progress"
	"runtime"
	"slices"
)

// RegionCapitalsBinHeader is the header of the capitals.bin layout, see EncodeCapitalsBin
type RegionCapitalsBinHeader struct {
	Capitals map[string][]CapitalRuntimeData `json:"capitals"` // keyed by layer name
	Chunks   map[string][]ChunkRuntimeData   `json:"chunks"`   // keyed by layer name
	// keyed by asset UUID_SUBID, [offset, length] of the slice JSON relative to the start of the slice bodies
	Slices map[string][2]int `json:"slices"`
}

// EncodeCapitalsBin writes the capitals data in a layout the client can decode slice by slice:
//
//	u32 little endian | header JSON (RegionCapitalsBinHeader) | slice JSONs back to back
//
// Each slice body is the JSON of one ViewerSlice, the same as the values of RegionCapitalsData.Slices in capitals.json.
// The client parses the header up front and a slice only when it is first used.
func EncodeCapitalsBin(data *RegionCapitalsData) ([]byte, error) {
	keys := make([]string, 0, len(data.Slices))
	for key := range data.Slices {
		keys = append(keys, key)
	}
	slices.Sort(keys)

	bodies := make([][]byte, len(keys))
	err := progress.Concurrent(uint(runtime.GOMAXPROCS(0)), keys, func(key string, i int) error {
		body, err := json.MarshalJSON(data.Slices[key])
		bodies[i] = body
		return err
	})
	if err != nil {
		return nil, err
	}

	header := RegionCapitalsBinHeader{
		Capitals: data.Capitals,
		Chunks:   data.Chunks,
		Slices:   make(map[string][2]int, len(keys)),
	}
	bodySize := 0
	for i, key := range keys {
		header.Slices[key] = [2]int{bodySize, len(bodies[i])}
		bodySize += len(bodies[i])
	}
	headerData, err := json.MarshalJSON(header)
	if err != nil {
		return nil, err
	}

	out := bytes.NewBuffer(make([]byte, 0, 4+len(headerData)+bodySize))
	binary.Write(out, binary.LittleEndian, uint32(len(headerData)))
	out.Write(headerData)
	for _, body := range bodies {
		out.Write(body)
	}
	return out.Bytes(), nil
}
