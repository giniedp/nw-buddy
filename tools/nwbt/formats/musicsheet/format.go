// Package musicsheet reads the music sheets of the musical performances (`.musicsheetc`, sharedassets/musicsheets).
//
// The layout follows new-world-tools music/sheet (MIT, github.com/new-world-tools/new-world-tools), the difficulty
// names the game's Javelin::MusicSheetAsset::SheetType enum.
// All 655 files of the game parse to their last byte.
//
//	u8  difficulty  SheetType: 0 Unknown, 1 Easy, 2 Medium, 3 Hard (the file names agree, `extreme` sheets are 3)
//	u32 note count
//	per note, 6 bytes:
//	  u8  key    1 w, 2 a, 3 s, 4 d, 5 space, 6 left mouse, 7 right mouse; 0x11 on guitar sheets (unknown input)
//	  i8  track  -2..2, written as 1..5 like new-world-tools
//	  f32 time   seconds. The notes are in file order: 13 files have one note earlier than the one before.
package musicsheet

import (
	"fmt"
	"nw-buddy/tools/nwfs"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/buf"
)

type Sheet struct {
	Difficulty string `json:"difficulty"`
	NoteCount  uint32 `json:"noteCount"`
	Notes      []Note `json:"notes"`
}

type Note struct {
	// key name, or the byte as hex (`0x11`) for a key without a name
	Key   string  `json:"key"`
	Track int     `json:"track"`
	Time  float32 `json:"time"`
}

var difficultyNames = []string{"Unknown", "Easy", "Medium", "Hard"}

var keyNames = map[uint8]string{
	0x01: "w",
	0x02: "a",
	0x03: "s",
	0x04: "d",
	0x05: "space",
	0x06: "lmb",
	0x07: "rmb",
}

func Load(f nwfs.File) (*Sheet, error) {
	data, err := f.Read()
	if err != nil {
		return nil, err
	}
	return Parse(data)
}

func Parse(data []byte) (res *Sheet, err error) {
	defer utils.HandleRecover(&err)

	r := buf.NewReaderLE(data)
	res = &Sheet{}
	difficulty := r.MustReadUint8()
	res.Difficulty = fmt.Sprintf("%d", difficulty)
	if int(difficulty) < len(difficultyNames) {
		res.Difficulty = difficultyNames[difficulty]
	}
	res.NoteCount = r.MustReadUint32()
	if remaining := r.Len() - r.Pos(); int64(res.NoteCount)*6 != int64(remaining) {
		return nil, fmt.Errorf("music sheet: %d notes need %d bytes, %d left", res.NoteCount, res.NoteCount*6, remaining)
	}
	res.Notes = make([]Note, res.NoteCount)
	for i := range res.Notes {
		key := r.MustReadUint8()
		name, ok := keyNames[key]
		if !ok {
			name = fmt.Sprintf("0x%02x", key)
		}
		res.Notes[i] = Note{
			Key:   name,
			Track: int(r.MustReadInt8()) + 3,
			Time:  r.MustReadFloat32(),
		}
	}
	return res, nil
}
