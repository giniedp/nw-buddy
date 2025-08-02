/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_153238339")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id = @request.body.user &&\n(user.stats_via_user.transmogs ?< user.transmogLimit || user.stats_via_user.transmogs ?< 200)"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_153238339")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id = @request.body.user"
  }, collection)

  return app.save(collection)
})
