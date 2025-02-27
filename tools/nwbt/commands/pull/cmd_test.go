package pull_test

import (
	"nw-buddy/tools/commands/pull"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestBuildTaskList(t *testing.T) {

	assert.EqualValues(t,
		[]string{
			pull.TASK_TABLES,
			pull.TASK_LOCALE,
			pull.TASK_SEARCH,
		},
		pull.BuildTaskList([]string{
			pull.TASK_SEARCH,
		}),
	)

	assert.EqualValues(t,
		[]string{
			pull.TASK_TABLES,
			pull.TASK_TYPES,
		},
		pull.BuildTaskList([]string{
			pull.TASK_TYPES,
		}),
	)

	assert.EqualValues(t,
		[]string{
			pull.TASK_IMAGES,
		},
		pull.BuildTaskList([]string{
			pull.TASK_IMAGES,
		}),
	)
}
