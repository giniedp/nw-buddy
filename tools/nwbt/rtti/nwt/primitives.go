package nwt

import (
	"encoding/binary"
	"fmt"
	"math"
	"nw-buddy/tools/formats/azcs"
	"nw-buddy/tools/utils"
	"nw-buddy/tools/utils/buf"
	"reflect"
	"strconv"
	"strings"

	"github.com/gofrs/uuid"
)

var PRIMITIVES = map[string]reflect.Type{
	"03AAAB3F-5C47-5A66-9EBC-D5FA4DB353C9": reflect.TypeOf(AzString("")),

	"3AB0037F-AF8D-48CE-BCA0-A170D18B2C03": reflect.TypeOf(AzInt8(0)),  //, azrtti_typeid<char>());
	"58422C0E-1E47-4854-98E6-34098F6FE12D": reflect.TypeOf(AzInt8(0)),  //, azrtti_typeid<AZ::s8>());
	"B8A56D56-A10D-4DCE-9F63-405EE243DD3C": reflect.TypeOf(AzInt16(0)), //, azrtti_typeid<short>());
	"72039442-EB38-4D42-A1AD-CB68F7E0EEF6": reflect.TypeOf(AzInt32(0)), //, azrtti_typeid<int>());
	"8F24B9AD-7C51-46CF-B2F8-277356957325": reflect.TypeOf(AzInt64(0)), //, azrtti_typeid<long>());
	"70D8A282-A1EA-462D-9D04-51EDE81FAC2F": reflect.TypeOf(AzInt64(0)), //, azrtti_typeid<AZ::s64>());

	"72B9409A-7D1A-4831-9CFE-FCB3FADD3426": reflect.TypeOf(AzUInt8(0)),  //, azrtti_typeid<unsigned char>());
	"ECA0B403-C4F8-4B86-95FC-81688D046E40": reflect.TypeOf(AzUInt16(0)), //, azrtti_typeid<unsigned short>());
	"43DA906B-7DEF-4CA8-9790-854106D3F983": reflect.TypeOf(AzUInt32(0)), //, azrtti_typeid<unsigned int>());
	"5EC2D6F7-6859-400F-9215-C106F5B10E53": reflect.TypeOf(AzUInt64(0)), //, azrtti_typeid<unsigned long>());
	"D6597933-47CD-4FC8-B911-63F3E2B0993A": reflect.TypeOf(AzUInt64(0)), //, azrtti_typeid<AZ::u64>());

	"EA2C3E90-AFBE-44D4-A90D-FAAF79BAF93D": reflect.TypeOf(AzFloat32(0)),  //, azrtti_typeid<float>());
	"110C4B14-11A8-4E9D-8638-5051013A56AC": reflect.TypeOf(AzFloat64(0)),  //, azrtti_typeid<double>());
	"A0CA880C-AFE4-43CB-926C-59AC48496112": reflect.TypeOf(AzBool(false)), //, azrtti_typeid<bool>());
	"E152C105-A133-4D03-BBF8-3D4B2FBA3E2A": reflect.TypeOf(AzUuid("")),    //, azrtti_typeid<AZ::Uuid>());
	"77A19D40-8731-4D3C-9041-1B43047366A4": reflect.TypeOf(AzAsset{}),
	"5D9958E9-9F1E-4985-B532-FFFDE75FEDFD": reflect.TypeOf(AzTransform{}),
	"7894072A-9050-4F0F-901B-34B1A0D29417": reflect.TypeOf(AzColor{}),
	"3D80F623-C85C-4741-90D0-E4E66164E6BF": reflect.TypeOf(AzVec2{}),
	"8379EB7D-01FA-4538-B64B-A6543B4BE73D": reflect.TypeOf(AzVec3{}),
	"73103120-3DD3-4873-BAB3-9713FA2804FB": reflect.TypeOf(AzQuat{}),
	// technically not a primitive, but has simple enough structure. need custom json marshalling due to 64 bit
	// "6383F1D3-BB27-4E6B-A49A-6409B2059EAA": reflect.TypeOf(EntityId{}),
}

// unknown and unmapped primitives
// 3485f20a-98c0-5315-876b-21bcd23a7bc0, 16, 602
// cdadee50-c32a-5ac5-9422-c61083ef25ed, 8, 5143
// d71fb08f-8229-5a55-a084-15787bdb9764, 12, 12218
// 0638e28c-ab7b-4ba4-84ac-0353038e6fd, 36, 4 Amazon::Hub::ActorRef 4

type AzDeserialize interface {
	Deserialize(*azcs.Element) error
}

type AzDeserializeXml interface {
	DeserializeXml(*azcs.XmlElement) error
}

type AzBool bool
type AzInt8 int8
type AzInt16 int16
type AzInt32 int32
type AzInt64 int64
type AzUInt8 uint8
type AzUInt16 uint16
type AzUInt32 uint32
type AzUInt64 uint64
type AzFloat32 float32
type AzFloat64 float64

type AzVec2 [2]AzFloat32
type AzVec3 [3]AzFloat32
type AzQuat [4]AzFloat32
type AzColor [4]AzFloat32

type AzTransform struct {
	Data []AzFloat32 `json:"data"`
}

type AzAsset struct {
	Guid  string `json:"guid"`
	Subid string `json:"subid"`
	Type  string `json:"type"`
	Hint  string `json:"hint"`
}

type AzUuid string
type AzString string
type AzUnknown []byte

// type EntityId struct {
// 	Id AzUInt64 `crc:"3208210256"`
// }

func (it *AzString) Deserialize(el *azcs.Element) error {
	*it = AzString(el.Data)
	return nil
}

func (it *AzString) DeserializeXml(el *azcs.XmlElement) error {
	*it = AzString(el.Value)
	return nil
}

func (it *AzUuid) Deserialize(el *azcs.Element) error {
	if len(el.Data) != 16 {
		return fmt.Errorf("data size must be 16, was %d", len(el.Data))
	}
	uuid, err := uuid.FromBytes(el.Data)
	if err != nil {
		return fmt.Errorf("UUID parse error: %v", err)
	}
	*it = AzUuid(uuid.String())
	return nil
}

func (it *AzUuid) DeserializeXml(el *azcs.XmlElement) error {
	*it = AzUuid(utils.ExtractUUID(el.Value))
	return nil
}

func (it *AzBool) Deserialize(el *azcs.Element) error {
	if len(el.Data) != 1 {
		return fmt.Errorf("data size must be 1, was%d", len(el.Data))
	}
	*it = el.Data[0] != 0
	return nil
}

func (it *AzBool) DeserializeXml(el *azcs.XmlElement) error {
	*it = el.Value == "true"
	return nil
}

func (it *AzInt8) Deserialize(el *azcs.Element) error {
	if len(el.Data) != 1 {
		return fmt.Errorf("data size must be 1, was%d", len(el.Data))
	}
	*it = AzInt8(el.Data[0])
	return nil
}

func (it *AzInt8) DeserializeXml(el *azcs.XmlElement) error {
	v, err := strconv.ParseInt(el.Value, 10, 8)
	if err != nil {
		return err
	}
	*it = AzInt8(v)
	return nil
}

func (it *AzInt16) Deserialize(el *azcs.Element) error {
	if len(el.Data) != 2 {
		return fmt.Errorf("data size must be 2, was%d", len(el.Data))
	}
	*it = AzInt16(binary.BigEndian.Uint16(el.Data))
	return nil
}

func (it *AzInt16) DeserializeXml(el *azcs.XmlElement) error {
	v, err := strconv.ParseInt(el.Value, 10, 16)
	if err != nil {
		return err
	}
	*it = AzInt16(v)
	return nil
}

func (it *AzInt32) Deserialize(el *azcs.Element) error {
	if len(el.Data) != 4 {
		return fmt.Errorf("data size must be 4, was%d", len(el.Data))
	}
	*it = AzInt32(binary.BigEndian.Uint32(el.Data))
	return nil
}

func (it *AzInt32) DeserializeXml(el *azcs.XmlElement) error {
	v, err := strconv.ParseInt(el.Value, 10, 32)
	if err != nil {
		return err
	}
	*it = AzInt32(v)
	return nil
}

func (it *AzInt64) Deserialize(el *azcs.Element) error {
	if len(el.Data) != 8 {
		return fmt.Errorf("data size must be 8, was%d", len(el.Data))
	}
	*it = AzInt64(binary.BigEndian.Uint64(el.Data))
	return nil
}

func (it *AzInt64) DeserializeXml(el *azcs.XmlElement) error {
	v, err := strconv.ParseInt(el.Value, 10, 64)
	if err != nil {
		return err
	}
	*it = AzInt64(v)
	return nil
}

func (it *AzUInt8) Deserialize(el *azcs.Element) error {
	if len(el.Data) != 1 {
		return fmt.Errorf("data size must be 1, was%d", len(el.Data))
	}

	*it = AzUInt8(el.Data[0])
	return nil
}

func (it *AzUInt8) DeserializeXml(el *azcs.XmlElement) error {
	v, err := strconv.ParseUint(el.Value, 10, 8)
	if err != nil {
		return err
	}
	*it = AzUInt8(v)
	return nil
}

func (it *AzUInt16) Deserialize(el *azcs.Element) error {
	if len(el.Data) != 2 {
		return fmt.Errorf("data size must be 2, was%d", len(el.Data))
	}
	*it = AzUInt16(binary.BigEndian.Uint16(el.Data))
	return nil
}

func (it *AzUInt16) DeserializeXml(el *azcs.XmlElement) error {
	v, err := strconv.ParseUint(el.Value, 10, 16)
	if err != nil {
		return err
	}
	*it = AzUInt16(v)
	return nil
}

func (it *AzUInt32) Deserialize(el *azcs.Element) error {
	if len(el.Data) != 4 {
		return fmt.Errorf("data size must be 4, was%d", len(el.Data))
	}
	*it = AzUInt32(binary.BigEndian.Uint32(el.Data))
	return nil
}

func (it *AzUInt32) DeserializeXml(el *azcs.XmlElement) error {
	v, err := strconv.ParseUint(el.Value, 10, 32)
	if err != nil {
		return err
	}
	*it = AzUInt32(v)
	return nil
}

func (it *AzUInt64) Deserialize(el *azcs.Element) error {
	if len(el.Data) != 8 {
		return fmt.Errorf("data size must be 8, was%d", len(el.Data))
	}
	*it = AzUInt64(binary.BigEndian.Uint64(el.Data))
	return nil
}

func (it *AzUInt64) DeserializeXml(el *azcs.XmlElement) error {
	v, err := strconv.ParseUint(el.Value, 10, 64)
	if err != nil {
		return err
	}
	*it = AzUInt64(v)
	return nil
}

func (v AzUInt64) MarshalJSON() ([]byte, error) {
	// mainly for entity ids which are 64 bit and loos precision in js world
	s := fmt.Sprintf("%d", v)
	return []byte(`"` + s + `"`), nil
}

func (it *AzFloat32) Deserialize(el *azcs.Element) error {
	if len(el.Data) != 4 {
		return fmt.Errorf("data size must be 4, was%d", len(el.Data))
	}
	bits := binary.BigEndian.Uint32(el.Data)
	*it = AzFloat32(math.Float32frombits(bits))
	return nil
}

func (it *AzFloat32) DeserializeXml(el *azcs.XmlElement) error {
	v, err := strconv.ParseFloat(el.Value, 32)
	if err != nil {
		return err
	}
	*it = AzFloat32(v)
	return nil
}

func (v AzFloat32) MarshalJSON() ([]byte, error) {
	f64 := float64(v)
	var s string
	switch {
	case math.IsInf(f64, 1):
		s = "+Inf"
	case math.IsInf(f64, -1):
		s = "-Inf"
	case math.IsNaN(f64):
		s = "NaN"
	default:
		s = strconv.FormatFloat(f64, 'f', -1, 64)
		return []byte(s), nil
	}
	return []byte(`"` + s + `"`), nil
}

func (it *AzFloat64) Deserialize(el *azcs.Element) error {
	if len(el.Data) != 8 {
		return fmt.Errorf("data size must be 8, was%d", len(el.Data))
	}
	bits := binary.BigEndian.Uint64(el.Data)
	*it = AzFloat64(math.Float64frombits(bits))
	return nil
}

func (it *AzFloat64) DeserializeXml(el *azcs.XmlElement) error {
	v, err := strconv.ParseFloat(el.Value, 64)
	if err != nil {
		return err
	}
	*it = AzFloat64(v)
	return nil
}

func (v AzFloat64) MarshalJSON() ([]byte, error) {
	f64 := float64(v)
	var s string
	switch {
	case math.IsInf(f64, 1):
		s = "+Inf"
	case math.IsInf(f64, -1):
		s = "-Inf"
	case math.IsNaN(f64):
		s = "NaN"
	default:
		s = strconv.FormatFloat(f64, 'f', -1, 64)
		return []byte(s), nil
	}
	return []byte(`"` + s + `"`), nil
}

func (it *AzVec2) Deserialize(el *azcs.Element) error {
	if len(el.Data) != 8 {
		return fmt.Errorf("data size must be 8, was%d", len(el.Data))
	}
	it[0] = AzFloat32(math.Float32frombits(binary.BigEndian.Uint32(el.Data[:4])))
	it[1] = AzFloat32(math.Float32frombits(binary.BigEndian.Uint32(el.Data[4:])))
	return nil
}

func (it *AzVec2) DeserializeXml(el *azcs.XmlElement) error {
	if len(el.Elements) == 3 {
		for _, el := range el.Elements {
			var v AzFloat32
			if err := v.DeserializeXml(el); err != nil {
				return err
			}
			switch el.Name {
			case "x":
				it[0] = v
			case "y":
				it[1] = v
			default:
				return fmt.Errorf("unexpected element name %s", el.Name)
			}
		}
		return nil
	}
	tokens := strings.Split(el.Value, " ")
	if len(tokens) != 2 {
		return fmt.Errorf("element must have 2 numeric values, has%d", len(el.Elements))
	}
	for i, token := range tokens {
		v, err := strconv.ParseFloat(token, 32)
		if err != nil {
			return err
		}
		it[i] = AzFloat32(v)
	}
	return nil
}

func (it *AzVec3) Deserialize(el *azcs.Element) error {
	if len(el.Data) != 12 {
		return fmt.Errorf("data size must be 12, was %d", len(el.Data))
	}
	it[0] = AzFloat32(math.Float32frombits(binary.BigEndian.Uint32(el.Data[:4])))
	it[1] = AzFloat32(math.Float32frombits(binary.BigEndian.Uint32(el.Data[4:8])))
	it[2] = AzFloat32(math.Float32frombits(binary.BigEndian.Uint32(el.Data[8:])))
	return nil
}

func (it *AzVec3) DeserializeXml(el *azcs.XmlElement) error {
	tokens := strings.Split(el.Value, " ")
	if len(tokens) != 3 {
		return fmt.Errorf("element must have 3 numeric values, has%d", len(el.Elements))
	}
	for i, token := range tokens {
		v, err := strconv.ParseFloat(token, 32)
		if err != nil {
			return err
		}
		it[i] = AzFloat32(v)
	}
	return nil
}

func (it *AzQuat) Deserialize(el *azcs.Element) error {
	if len(el.Data) != 16 {
		return fmt.Errorf("data size must be 16, was %d", len(el.Data))
	}
	it[0] = AzFloat32(math.Float32frombits(binary.BigEndian.Uint32(el.Data[:4])))
	it[1] = AzFloat32(math.Float32frombits(binary.BigEndian.Uint32(el.Data[4:8])))
	it[2] = AzFloat32(math.Float32frombits(binary.BigEndian.Uint32(el.Data[8:12])))
	it[3] = AzFloat32(math.Float32frombits(binary.BigEndian.Uint32(el.Data[12:])))
	return nil
}

func (it *AzQuat) DeserializeXml(el *azcs.XmlElement) error {
	tokens := strings.Split(el.Value, " ")
	if len(tokens) != 4 {
		return fmt.Errorf("element must have 4 numeric values, has%d", len(el.Elements))
	}
	for i, token := range tokens {
		v, err := strconv.ParseFloat(token, 32)
		if err != nil {
			return err
		}
		it[i] = AzFloat32(v)
	}
	return nil
}

func (it *AzColor) Deserialize(el *azcs.Element) error {
	if len(el.Data) != 16 {
		return fmt.Errorf("data size must be 16, was %d", len(el.Data))
	}
	it[0] = AzFloat32(math.Float32frombits(binary.BigEndian.Uint32(el.Data[:4])))
	it[1] = AzFloat32(math.Float32frombits(binary.BigEndian.Uint32(el.Data[4:8])))
	it[2] = AzFloat32(math.Float32frombits(binary.BigEndian.Uint32(el.Data[8:12])))
	it[3] = AzFloat32(math.Float32frombits(binary.BigEndian.Uint32(el.Data[12:])))
	return nil
}

func (it *AzColor) DeserializeXml(el *azcs.XmlElement) error {
	tokens := strings.Split(el.Value, " ")
	if len(tokens) != 4 {
		return fmt.Errorf("element must have 4 numeric values, has%d", len(el.Elements))
	}
	for i, token := range tokens {
		v, err := strconv.ParseFloat(token, 32)
		if err != nil {
			return err
		}
		it[i] = AzFloat32(v)
	}
	return nil
}

func (it *AzAsset) Deserialize(el *azcs.Element) error {
	r := buf.NewReaderBE(el.Data)
	b, err := r.ReadBytes(16)
	if err != nil {
		return fmt.Errorf("failed to read guid: %v", err)
	}
	guid, err := uuid.FromBytes(b)
	if err != nil {
		return fmt.Errorf("failed to parse guid: %v", err)
	}

	b, err = r.ReadBytes(16)
	if err != nil {
		return fmt.Errorf("failed to read subid: %v", err)
	}
	subid, err := uuid.FromBytes(b)
	if err != nil {
		return fmt.Errorf("failed to parse subid: %v", err)
	}

	b, err = r.ReadBytes(16)
	if err != nil {
		return fmt.Errorf("failed to read typeid: %v", err)
	}
	typeId, err := uuid.FromBytes(b)
	if err != nil {
		return fmt.Errorf("failed to parse subid: %v", err)
	}

	l, err := r.ReadUint64()
	if err != nil {
		return fmt.Errorf("failed to read hint length: %v", err)
	}
	hint := ""
	if l > 0 {
		b, err = r.ReadBytes(int(l))
		if err != nil {
			return fmt.Errorf("failed to read hint: %v", err)
		}
		hint = string(b)
	}

	it.Guid = strings.ToUpper(guid.String())
	it.Subid = strings.ToUpper(subid.String())
	it.Type = strings.ToUpper(typeId.String())
	it.Hint = hint
	return nil
}

func (it *AzAsset) DeserializeXml(el *azcs.XmlElement) error {
	tokens := strings.Split(el.Value, ",")
	for _, token := range tokens {
		if !strings.Contains(token, "=") {
			return fmt.Errorf("expected token to contain '=': %s", token)
		}
		parts := strings.SplitN(token, "=", 2)
		key := strings.TrimSpace(parts[0])
		value := strings.TrimSpace(parts[1])
		switch key {
		case "id":
			it.Guid = strings.ToUpper(utils.ExtractUUID(value))
		case "type":
			it.Type = strings.ToUpper(utils.ExtractUUID(value))
		case "hint":
			it.Hint = value
		case "subid":
			it.Subid = strings.ToUpper(utils.ExtractUUID(value))
		}
	}

	return nil
}

func (it *AzTransform) Deserialize(el *azcs.Element) error {
	if len(el.Data)%4 != 0 {
		return fmt.Errorf("expected data to be multiple of 4: %d", len(el.Data))
	}
	res := make([]AzFloat32, 0)
	for i := 0; i < len(el.Data); i += 4 {
		bits := binary.BigEndian.Uint32(el.Data[i : i+4])
		res = append(res, AzFloat32(math.Float32frombits(bits)))
	}
	it.Data = res
	return nil
}

func (it *AzTransform) DeserializeXml(el *azcs.XmlElement) error {
	tokens := strings.Split(el.Value, " ")
	if len(tokens)%4 != 0 {
		return fmt.Errorf("expected data to be multiple of 4: %d", len(el.Elements))
	}
	res := make([]AzFloat32, len(tokens))
	for i, token := range tokens {
		v, err := strconv.ParseFloat(token, 32)
		if err != nil {
			return err
		}
		res[i] = AzFloat32(v)
	}
	it.Data = res
	return nil
}

// func (it *EntityId) Deserialize(el *azcs.Element) error {
// 	if len(el.Elements) != 1 {
// 		return fmt.Errorf("expected one child element but found: %d", len(el.Elements))
// 	}
// 	return it.Id.Deserialize(el.Elements[0])
// }

// func (it *EntityId) DeserializeXml(el *azcs.XmlElement) error {
// 	if len(el.Elements) != 1 {
// 		return fmt.Errorf("expected one child element but found: %d", len(el.Elements))
// 	}
// 	return it.Id.DeserializeXml(el.Elements[0])
// }

// func (v EntityId) MarshalJSON() ([]byte, error) {
// 	strId := fmt.Sprintf("%d", v.Id)
// 	return []byte(`"` + strId + `"`), nil
// }
