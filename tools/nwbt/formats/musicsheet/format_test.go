package musicsheet

import (
	"encoding/binary"
	"math"
	"testing"
)

func note(key byte, track int8, time float32) []byte {
	b := []byte{key, byte(track), 0, 0, 0, 0}
	binary.LittleEndian.PutUint32(b[2:], math.Float32bits(time))
	return b
}

func sheet(difficulty byte, notes ...[]byte) []byte {
	data := []byte{difficulty, 0, 0, 0, 0}
	binary.LittleEndian.PutUint32(data[1:], uint32(len(notes)))
	for _, n := range notes {
		data = append(data, n...)
	}
	return data
}

func TestParse(t *testing.T) {
	res, err := Parse(sheet(3, note(0x01, -2, 0.5), note(0x05, 2, 1.25), note(0x11, 0, 2)))
	if err != nil {
		t.Fatal(err)
	}
	if res.Difficulty != "Hard" || res.NoteCount != 3 {
		t.Fatalf("header: %+v", res)
	}
	want := []Note{{"w", 1, 0.5}, {"space", 5, 1.25}, {"0x11", 3, 2}}
	for i, n := range want {
		if res.Notes[i] != n {
			t.Errorf("note %d: got %+v, want %+v", i, res.Notes[i], n)
		}
	}
}

func TestParseRejectsWrongLength(t *testing.T) {
	data := sheet(1, note(0x01, 0, 0))
	if _, err := Parse(data[:len(data)-1]); err == nil {
		t.Error("a cut note must fail")
	}
	if _, err := Parse(append(data, 0)); err == nil {
		t.Error("trailing bytes must fail")
	}
}

func TestParseUnknownDifficulty(t *testing.T) {
	res, err := Parse(sheet(7))
	if err != nil {
		t.Fatal(err)
	}
	if res.Difficulty != "7" || len(res.Notes) != 0 {
		t.Errorf("got %+v", res)
	}
}
