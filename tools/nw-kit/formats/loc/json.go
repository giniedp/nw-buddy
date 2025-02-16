package loc

import "nw-buddy/tools/nw-kit/utils"

func (it *Document) ToJSON(fmt ...string) ([]byte, error) {
	rec := utils.NewRecord[string]()
	for _, entry := range it.Entries {
		rec.Set(entry.Key, entry.Value)
	}
	return utils.MarshalJSON(rec, fmt...)
}
