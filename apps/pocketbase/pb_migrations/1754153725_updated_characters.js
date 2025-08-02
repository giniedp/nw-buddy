/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3298390430")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id = @request.body.user &&\n(user.stats_via_user.characters ?< user.characterLimit || user.stats_via_user.characters ?< 5)"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3298390430")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id = @request.body.user"
  }, collection)

  return app.save(collection)
})
