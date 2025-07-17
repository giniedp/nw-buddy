/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3221858612")

  // update collection data
  unmarshal({
    "name": "grids"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3221858612")

  // update collection data
  unmarshal({
    "name": "gridstates"
  }, collection)

  return app.save(collection)
})
