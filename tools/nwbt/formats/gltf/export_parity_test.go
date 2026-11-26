package gltf_test

// Geometry parity of the exporter against baseline glbs of a previous exporter.
//
//	GLTF_BASELINE_DIR=<dir with <name>.<yup|zup>.glb> GLTF_SAMPLES=<cgf-sample.json> go test ./formats/gltf -run TestExportParity -v
//
// Compares every triangle corner: old primitives have own vertex arrays with rebased indices, new primitives share
// the vertex accessors of their mesh and keep the absolute indices.

import (
	"bytes"
	"encoding/binary"
	"fmt"
	gomath "math"
	"os"
	"path"
	"sort"
	"strings"
	"testing"

	"github.com/qmuntal/gltf"
)

type parityStat struct {
	corners  int
	bad      int
	maxDiff  float64
	skipped  int // corners where the old value was invalid (zero/NaN normal)
	missing  int // attribute missing on one side
	examples []string
}

func (s *parityStat) add(diff float64, tol float64, example func() string) {
	s.corners++
	if diff > s.maxDiff || gomath.IsNaN(diff) {
		s.maxDiff = diff
	}
	if diff > tol || gomath.IsNaN(diff) {
		s.bad++
		if len(s.examples) < 3 {
			s.examples = append(s.examples, example())
		}
	}
}

func TestExportParity(t *testing.T) {
	dir := os.Getenv("GLTF_BASELINE_DIR")
	if dir == "" {
		t.Skip("GLTF_BASELINE_DIR is not set")
	}
	samples := loadExportSamples(t)
	total := map[string]*parityStat{}
	structural := []string{}
	for _, s := range samples {
		for _, yup := range []bool{true, false} {
			suffix := ".zup.glb"
			if yup {
				suffix = ".yup.glb"
			}
			oldDoc, err := gltf.Open(path.Join(dir, s.name+suffix))
			if err != nil {
				t.Logf("%s%s: no baseline: %v", s.name, suffix, err)
				continue
			}
			w := &countWriter{keep: true}
			if err := exportSampleGlb(s, yup, w); err != nil {
				t.Errorf("%s: %v", s.name, err)
				continue
			}
			newDoc := &gltf.Document{}
			if err := gltf.NewDecoder(bytes.NewReader(w.data)).Decode(newDoc); err != nil {
				t.Fatalf("%s: decode: %v", s.name, err)
			}
			for _, msg := range compareDocs(oldDoc, newDoc, s.name+suffix, total) {
				structural = append(structural, msg)
			}
		}
	}

	keys := make([]string, 0, len(total))
	for k := range total {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	for _, k := range keys {
		st := total[k]
		t.Logf("%-10s corners %10d  bad %8d  max %.3g  skipped(old invalid) %d  missing %d", k, st.corners, st.bad, st.maxDiff, st.skipped, st.missing)
		for _, ex := range st.examples {
			t.Logf("    %s", ex)
		}
	}
	for _, msg := range structural {
		t.Log(msg)
	}
	for _, k := range []string{"POSITION", "TEXCOORD_0", "COLOR_0", "JOINTS_0", "WEIGHTS_0"} {
		if st := total[k]; st != nil && st.bad > 0 {
			t.Errorf("%s: %d corners differ", k, st.bad)
		}
	}
	if len(structural) > 0 {
		t.Errorf("%d structural differences", len(structural))
	}
}

func compareDocs(oldDoc, newDoc *gltf.Document, name string, total map[string]*parityStat) []string {
	msgs := []string{}
	// meshes are matched by node name: the new exporter skips physics meshes (`*_phys`, …) like the engine
	newByName := map[string]int{}
	for _, n := range newDoc.Nodes {
		if n.Mesh != nil {
			if _, ok := newByName[n.Name]; !ok {
				newByName[n.Name] = *n.Mesh
			}
		}
	}
	seen := map[int]bool{}
	for _, n := range oldDoc.Nodes {
		if n.Mesh == nil || seen[*n.Mesh] {
			continue
		}
		seen[*n.Mesh] = true
		mi := *n.Mesh
		nmi, ok := newByName[n.Name]
		if !ok {
			lower := strings.ToLower(n.Name)
			if strings.HasSuffix(lower, "_phys") || strings.Contains(lower, "physicsproxy") || strings.Contains(lower, "$collision") {
				total["(dropped physics meshes)"] = addCount(total["(dropped physics meshes)"])
			} else {
				msgs = append(msgs, fmt.Sprintf("%s: mesh of node %q missing", name, n.Name))
			}
			continue
		}
		om, nm := oldDoc.Meshes[mi], newDoc.Meshes[nmi]
		if len(om.Primitives) != len(nm.Primitives) {
			msgs = append(msgs, fmt.Sprintf("%s: mesh %d primitives %d vs %d", name, mi, len(om.Primitives), len(nm.Primitives)))
			continue
		}
		for pi := range om.Primitives {
			op, np := om.Primitives[pi], nm.Primitives[pi]
			oi := readAttr(oldDoc, *op.Indices)
			ni := readAttr(newDoc, *np.Indices)
			if len(oi) != len(ni) {
				msgs = append(msgs, fmt.Sprintf("%s: mesh %d prim %d indices %d vs %d", name, mi, pi, len(oi), len(ni)))
				continue
			}
			for attr, oa := range op.Attributes {
				st := total[attr]
				if st == nil {
					st = &parityStat{}
					total[attr] = st
				}
				na, ok := np.Attributes[attr]
				if attr == "COLOR_0" && !ok {
					// colors of shaders that don't tint are the app attribute _COLOR_0
					na, ok = np.Attributes["_COLOR_0"]
				}
				// opaque tinting primitives read an RGB view of the colors, the alpha is still in the buffer
				rgbOnly := attr == "COLOR_0" && ok && newDoc.Accessors[na].Type == gltf.AccessorVec3
				if attr == "TEXCOORD_0" && hasSecondTexcoordSet(newDoc, np) {
					// the old exporter let texcoord set 1 overwrite set 0, it is TEXCOORD_1 now
					na, ok = np.Attributes["TEXCOORD_1"]
				}
				if !ok {
					st.missing++
					continue
				}
				ov, nv := readAttr(oldDoc, oa), readAttr(newDoc, na)
				for c := range oi {
					a, b := ov[int(oi[c][0])], nv[int(ni[c][0])]
					if rgbOnly {
						b[3] = a[3]
					}
					diff, valid := attrDiff(attr, a, b)
					if !valid {
						st.skipped++
						continue
					}
					st.add(diff, attrTolerance(attr, a), func() string {
						return fmt.Sprintf("%s mesh %d prim %d corner %d: old %v new %v", name, mi, pi, c, a, b)
					})
				}
			}
			for attr := range np.Attributes {
				// added by the new exporter: TEXCOORD_1, _COLOR_0, and TANGENT of qtangent meshes (writeQTangentFrame)
				if _, ok := op.Attributes[attr]; !ok && attr != "TEXCOORD_1" && attr != "_COLOR_0" && attr != "TANGENT" {
					msgs = append(msgs, fmt.Sprintf("%s: mesh %d prim %d new attribute %s", name, mi, pi, attr))
				}
			}
		}
	}
	return msgs
}

func addCount(s *parityStat) *parityStat {
	if s == nil {
		s = &parityStat{}
	}
	s.corners++
	return s
}

func hasSecondTexcoordSet(doc *gltf.Document, p *gltf.Primitive) bool {
	_, ok := p.Attributes["TEXCOORD_1"]
	return ok
}

func attrTolerance(attr string, v [4]float64) float64 {
	switch {
	case attr == "POSITION":
		m := max(1, gomath.Abs(v[0]), gomath.Abs(v[1]), gomath.Abs(v[2]))
		return 1e-6 * m
	case strings.HasPrefix(attr, "TEXCOORD"):
		return 1e-6
	case attr == "NORMAL" || attr == "TANGENT":
		return 2e-3
	default:
		return 0
	}
}

// attrDiff returns the largest component difference; directions are compared normalized,
// corners with an invalid old direction (zero length, NaN) are reported as not valid
func attrDiff(attr string, a, b [4]float64) (float64, bool) {
	switch attr {
	case "NORMAL", "TANGENT":
		la := gomath.Sqrt(a[0]*a[0] + a[1]*a[1] + a[2]*a[2])
		lb := gomath.Sqrt(b[0]*b[0] + b[1]*b[1] + b[2]*b[2])
		if !(la > 0.5) {
			return 0, false
		}
		d := 0.0
		for i := range 3 {
			d = max(d, gomath.Abs(a[i]/la-b[i]/lb))
		}
		if attr == "TANGENT" && (a[3] < 0) != (b[3] < 0) {
			d = max(d, 2)
		}
		return d, true
	}
	d := 0.0
	for i := range 4 {
		if gomath.IsNaN(a[i]) || gomath.IsInf(a[i], 0) {
			// invalid source value, the new exporter writes 0 (glTF forbids non-finite values)
			return 0, false
		}
		d = max(d, gomath.Abs(a[i]-b[i]))
	}
	return d, true
}

// readAttr decodes an accessor into vec4 values (normalized integers → float), honoring the view stride
func readAttr(doc *gltf.Document, index int) [][4]float64 {
	acc := doc.Accessors[index]
	view := doc.BufferViews[*acc.BufferView]
	data := doc.Buffers[view.Buffer].Data
	comps := acc.Type.Components()
	size := acc.ComponentType.ByteSize()
	stride := view.ByteStride
	if stride == 0 {
		stride = comps * size
	}
	out := make([][4]float64, acc.Count)
	for i := range acc.Count {
		off := view.ByteOffset + acc.ByteOffset + i*stride
		for c := range comps {
			b := data[off+c*size:]
			var v float64
			switch acc.ComponentType {
			case gltf.ComponentFloat:
				v = float64(gomath.Float32frombits(binary.LittleEndian.Uint32(b)))
			case gltf.ComponentUint:
				v = float64(binary.LittleEndian.Uint32(b))
			case gltf.ComponentUshort:
				v = float64(binary.LittleEndian.Uint16(b))
				if acc.Normalized {
					v /= 65535
				}
			case gltf.ComponentShort:
				v = float64(int16(binary.LittleEndian.Uint16(b)))
				if acc.Normalized {
					v = max(-1, v/32767)
				}
			case gltf.ComponentUbyte:
				v = float64(b[0])
				if acc.Normalized {
					v /= 255
				}
			case gltf.ComponentByte:
				v = float64(int8(b[0]))
				if acc.Normalized {
					v = max(-1, v/127)
				}
			}
			out[i][c] = v
		}
	}
	return out
}
