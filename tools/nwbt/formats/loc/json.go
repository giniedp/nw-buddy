package loc

import (
	"nw-buddy/tools/utils/json"
	"nw-buddy/tools/utils/maps"
)

func (it *Document) ToJSON(fmt ...string) ([]byte, error) {
	rec := maps.NewDict[string]()
	for _, entry := range it.Entries {
		rec.Store(entry.Key, entry.Value)
	}
	return json.MarshalJSON(rec, fmt...)
}
