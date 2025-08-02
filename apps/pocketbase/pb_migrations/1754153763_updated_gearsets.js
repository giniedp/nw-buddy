/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3552557069")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id = @request.body.user &&\n(user.stats_via_user.gearsets ?< user.gearsetLimit || user.stats_via_user.gearsets ?< 200)"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3552557069")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id = @request.body.user"
  }, collection)

  return app.save(collection)
})
