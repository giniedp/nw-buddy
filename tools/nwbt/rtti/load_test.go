package rtti_test

import (
	"encoding/binary"
	"math"
	"nw-buddy/tools/formats/azcs"
	"nw-buddy/tools/rtti"
	"nw-buddy/tools/rtti/nwt"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestLoad_AzString(t *testing.T) {
	types := []string{
		"03aaab3f-5c47-5a66-9ebc-d5fa4db353c9",
	}
	values := []string{"foo", "bar", "baz"}
	for _, tName := range types {
		for _, value := range values {
			el := azcs.Element{}
			el.Type = tName
			el.Data = []byte(value)
			v, err := rtti.Load(&el)
			assert.NoError(t, err)
			assert.Equal(t, nwt.AzString(value), v)
		}
	}
}

func TestLoad_AzBool(t *testing.T) {
	types := []string{
		"a0ca880c-afe4-43cb-926c-59ac48496112",
	}
	values := []bool{true, false}
	for _, tName := range types {
		for _, value := range values {
			el := azcs.Element{}
			el.Type = tName
			if value {
				el.Data = []byte{1}
			} else {
				el.Data = []byte{0}
			}
			v, err := rtti.Load(&el)
			assert.NoError(t, err)
			assert.Equal(t, nwt.AzBool(value), v)
		}
	}
}

func TestLoad_AzInt8(t *testing.T) {
	types := []string{
		"3ab0037f-af8d-48ce-bca0-a170d18b2c03",
		"58422c0e-1e47-4854-98e6-34098f6fe12d",
	}
	values := []int8{
		math.MinInt8,
		0,
		123,
		math.MaxInt8,
	}
	for _, tName := range types {
		for _, value := range values {
			el := azcs.Element{}
			el.Type = tName
			el.Data = []byte{byte(value)}
			v, err := rtti.Load(&el)
			assert.NoError(t, err)
			assert.Equal(t, nwt.AzInt8(value), v)
		}
	}
}

func TestLoad_AzInt16(t *testing.T) {
	types := []string{
		"b8a56d56-a10d-4dce-9f63-405ee243dd3c",
	}
	values := []int16{
		math.MinInt16, 0, 1234, math.MaxInt16,
	}
	for _, tName := range types {
		for _, value := range values {
			el := azcs.Element{}
			el.Type = tName
			el.Data = binary.BigEndian.AppendUint16([]byte{}, uint16(value))
			v, err := rtti.Load(&el)
			assert.NoError(t, err)
			assert.Equal(t, nwt.AzInt16(value), v)
		}
	}
}

func TestLoad_AzInt32(t *testing.T) {
	types := []string{
		"72039442-eb38-4d42-a1ad-cb68f7e0eef6",
	}
	values := []int32{
		math.MinInt32, 0, 1234, math.MaxInt32,
	}
	for _, tName := range types {
		for _, value := range values {
			el := azcs.Element{}
			el.Type = tName
			el.Data = binary.BigEndian.AppendUint32([]byte{}, uint32(value))
			v, err := rtti.Load(&el)
			assert.NoError(t, err)
			assert.Equal(t, nwt.AzInt32(value), v)
		}
	}
}

func TestLoad_AzInt64(t *testing.T) {
	types := []string{
		"8f24b9ad-7c51-46cf-b2f8-277356957325",
		"70d8a282-a1ea-462d-9d04-51ede81fac2f",
	}
	values := []int64{
		math.MinInt64, 0, 1234, math.MaxInt64,
	}
	for _, tName := range types {
		for _, value := range values {
			el := azcs.Element{}
			el.Type = tName
			el.Data = binary.BigEndian.AppendUint64([]byte{}, uint64(value))
			v, err := rtti.Load(&el)
			assert.NoError(t, err)
			assert.Equal(t, nwt.AzInt64(value), v)
		}
	}
}

func TestLoad_AzUInt8(t *testing.T) {
	types := []string{
		"72b9409a-7d1a-4831-9cfe-fcb3fadd3426",
	}
	values := []uint8{
		0, math.MaxUint8,
	}
	for _, tName := range types {
		for _, value := range values {
			el := azcs.Element{}
			el.Type = tName
			el.Data = []byte{byte(value)}
			v, err := rtti.Load(&el)
			assert.NoError(t, err)
			assert.Equal(t, nwt.AzUInt8(value), v)
		}
	}
}

func TestLoad_AzUInt16(t *testing.T) {
	types := []string{
		"eca0b403-c4f8-4b86-95fc-81688d046e40",
	}
	values := []uint16{
		0, math.MaxUint8, math.MaxUint16,
	}
	for _, tName := range types {
		for _, value := range values {
			el := azcs.Element{}
			el.Type = tName
			el.Data = binary.BigEndian.AppendUint16([]byte{}, uint16(value))
			v, err := rtti.Load(&el)
			assert.NoError(t, err)
			assert.Equal(t, nwt.AzUInt16(value), v)
		}
	}
}

func TestLoad_AzUInt32(t *testing.T) {
	types := []string{
		"43da906b-7def-4ca8-9790-854106d3f983",
	}
	values := []uint32{
		0, math.MaxUint8, math.MaxUint16, math.MaxUint32,
	}
	for _, tName := range types {
		for _, value := range values {
			el := azcs.Element{}
			el.Type = tName
			el.Data = binary.BigEndian.AppendUint32([]byte{}, uint32(value))
			v, err := rtti.Load(&el)
			assert.NoError(t, err)
			assert.Equal(t, nwt.AzUInt32(value), v)
		}
	}
}

func TestLoad_AzUInt64(t *testing.T) {
	types := []string{
		"5ec2d6f7-6859-400f-9215-c106f5b10e53",
		"d6597933-47cd-4fc8-b911-63f3e2b0993a",
	}
	values := []uint64{
		0, math.MaxUint8, math.MaxUint16, math.MaxUint32, math.MaxUint64,
	}
	for _, tName := range types {
		for _, value := range values {
			el := azcs.Element{}
			el.Type = tName
			el.Data = binary.BigEndian.AppendUint64([]byte{}, uint64(value))
			v, err := rtti.Load(&el)
			assert.NoError(t, err)
			assert.Equal(t, nwt.AzUInt64(value), v)
		}
	}
}

func TestLoad_AzFloat32(t *testing.T) {
	types := []string{
		"ea2c3e90-afbe-44d4-a90d-faaf79baf93d",
	}
	values := []float32{
		math.MinInt64, math.MinInt32, math.MinInt16, math.MinInt8,
		0,
		0.1234,
		math.MaxUint8, math.MaxUint16, math.MaxUint32, math.MaxUint64,
	}

	for _, tName := range types {
		for _, value := range values {
			el := azcs.Element{}
			el.Type = tName
			el.Data = binary.BigEndian.AppendUint32([]byte{}, math.Float32bits(value))
			v, err := rtti.Load(&el)
			assert.NoError(t, err)
			assert.Equal(t, nwt.AzFloat32(value), v)
		}
	}
}

func TestLoad_AzFloat64(t *testing.T) {
	types := []string{
		"110c4b14-11a8-4e9d-8638-5051013a56ac",
	}
	values := []float64{
		math.MinInt64, math.MinInt32, math.MinInt16, math.MinInt8,
		0,
		0.1234,
		math.MaxUint8, math.MaxUint16, math.MaxUint32, math.MaxUint64,
	}

	for _, tName := range types {
		for _, value := range values {
			el := azcs.Element{}
			el.Type = tName
			el.Data = binary.BigEndian.AppendUint64([]byte{}, math.Float64bits(value))
			v, err := rtti.Load(&el)
			assert.NoError(t, err)
			assert.Equal(t, nwt.AzFloat64(value), v)
		}
	}
}

func TestLoad_AzEntity(t *testing.T) {
	// AFD304E4-1773-47C8-855A-8B622398934F
	// type SliceComponent struct {
	//   BaseClass1              *AZ__Component      `crc:"3566360373"`
	//   DataFlagsForNewEntities *DataFlagsPerEntity `crc:"2068331140"`
	//   DependencyReloadMode    AzInt32             `crc:"2234944382"`
	//   Entities                *AZStd__vector_81   `crc:"1357669605"`
	//   IsDynamic               AzBool              `crc:"3805372648"`
	//   Prefabs                 *AZStd__list_0      `crc:"2946726857"`
	//   ShouldKeepInMemory      AzBool              `crc:"3418249602"`
	// }

	// EDFCB2CF-F75D-43BE-B26B-F35821B29247
	// type AZ__Component struct {
	//   Id AzUInt64 `crc:"3208210256"`
	// }

	// 56942E81-55BE-53E7-BAC4-0F567BCA3863
	// type AZStd__vector_81 struct {
	//   Element []*AZ__Entity `crc:"1094737465"`
	// }

	// 75651658-8663-478D-9090-2432DFCAFA44
	// type AZ__Entity struct {
	//   Components        *AZStd__vector_45 `crc:"3997758973"`
	//   Id                *EntityId         `crc:"3208210256"`
	//   IsDependencyReady AzBool            `crc:"2530513992"`
	//   IsRuntimeActive   AzBool            `crc:"1991040116"`
	//   Name              AzString          `crc:"1579384326"`
	// }

	// 0D23B755-6E8F-5C6C-B7C9-A352A55DC1DF
	// type AZStd__vector_45 struct {
	//   Element []any `crc:"1094737465"`
	// }

	el := azcs.Element{
		Type: "AFD304E4-1773-47C8-855A-8B622398934F",
		Elements: []*azcs.Element{
			{
				NameCrc: 3805372648, // IsDynamic
				Type:    "a0ca880c-afe4-43cb-926c-59ac48496112",
				Data:    []byte{0x01}, // true
			},
			{
				NameCrc: 3418249602, // ShouldKeepInMemory
				Type:    "a0ca880c-afe4-43cb-926c-59ac48496112",
				Data:    []byte{0x00}, // false
			},
			{
				NameCrc: 2234944382, // DependencyReloadMode
				Type:    "72039442-EB38-4D42-A1AD-CB68F7E0EEF6",
				Data:    binary.BigEndian.AppendUint32([]byte{}, 1234),
			},
			{
				NameCrc: 3566360373, // BaseClass1
				Type:    "EDFCB2CF-F75D-43BE-B26B-F35821B29247",
				Elements: []*azcs.Element{
					{
						NameCrc: 3208210256, // Id
						Type:    "5EC2D6F7-6859-400F-9215-C106F5B10E53",
						Data:    binary.BigEndian.AppendUint64([]byte{}, 4321),
					},
				},
			},
			{
				NameCrc: 1357669605, // Entities
				Type:    "56942E81-55BE-53E7-BAC4-0F567BCA3863",
				Elements: []*azcs.Element{
					{
						NameCrc: 1094737465, // Element
						Type:    "75651658-8663-478D-9090-2432DFCAFA44",
						Elements: []*azcs.Element{
							{
								NameCrc: 1579384326, // Name
								Type:    "03aaab3f-5c47-5a66-9ebc-d5fa4db353c9",
								Data:    []byte("Component Name"),
							},
							{
								NameCrc: 3997758973, // Components
								Type:    "0D23B755-6E8F-5C6C-B7C9-A352A55DC1DF",
								Elements: []*azcs.Element{
									{
										NameCrc: 1094737465, // Element
										Type:    "5EC2D6F7-6859-400F-9215-C106F5B10E53",
										Data:    binary.BigEndian.AppendUint64([]byte{}, 4321),
									},
									{
										NameCrc: 1094737465, // Element
										Type:    "5EC2D6F7-6859-400F-9215-C106F5B10E53",
										Data:    binary.BigEndian.AppendUint64([]byte{}, 4321),
									},
								},
							},
						},
					},
				},
			},
		},
	}
	v, err := rtti.Load(&el)
	assert.NoError(t, err)
	assert.IsType(t, nwt.SliceComponent{}, v)
	it := v.(nwt.SliceComponent)
	assert.Equal(t, nwt.AzBool(true), it.IsDynamic)
	assert.Equal(t, nwt.AzBool(false), it.ShouldKeepInMemory)
	assert.Equal(t, nwt.AzInt32(1234), it.DependencyReloadMode)
	assert.Equal(t, nwt.AzUInt64(4321), it.BaseClass1.Id)
	assert.Equal(t, 1, len(it.Entities.Element))
	assert.Equal(t, nwt.AzString("Component Name"), it.Entities.Element[0].Name)
	assert.Equal(t, 2, len(it.Entities.Element[0].Components.Element))
	assert.Equal(t, nwt.AzUInt64(4321), it.Entities.Element[0].Components.Element[0])
}

func TestLoad_QueryShapeBox(t *testing.T) {
	// C6651A66-23D4-4508-B4AD-180C516655A8
	// type QueryShapeBox struct {
	//   BaseClass1 QueryShapeBase `crc:"3566360373"`
	//   M_box      AzVec3         `crc:"3272002109"`
	// }

	// 8379EB7D-01FA-4538-B64B-A6543B4BE73D
	// type AzVec3 [3]float32

	el := azcs.Element{
		Type: "C6651A66-23D4-4508-B4AD-180C516655A8",
		Elements: []*azcs.Element{
			{
				NameCrc: 3272002109, // M_box
				Type:    "8379EB7D-01FA-4538-B64B-A6543B4BE73D",
				Data: []byte{
					// big endian float32 1.0
					0x3f, 0x80, 0x00, 0x00,
					// big endian float32 2.0
					0x40, 0x00, 0x00, 0x00,
					// big endian float32 3.0
					0x40, 0x40, 0x00, 0x00,
				},
			},
		},
	}
	v, err := rtti.Load(&el)
	assert.NoError(t, err)
	assert.IsType(t, nwt.QueryShapeBox{}, v)
	assert.Equal(t, nwt.AzFloat32(1.0), v.(nwt.QueryShapeBox).M_box[0])
	assert.Equal(t, nwt.AzFloat32(2.0), v.(nwt.QueryShapeBox).M_box[1])
	assert.Equal(t, nwt.AzFloat32(3.0), v.(nwt.QueryShapeBox).M_box[2])
}
