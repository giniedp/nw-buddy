/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3826297877")

  // update collection data
  unmarshal({
    "viewQuery": "SELECT\n  gearsets.id as id,\n  gearsets.user as user,\n  gearsets.data as data,\n  gearsets.created as created,\n  gearsets.updated as updated,\n  (SELECT COUNT(*) FROM gearset_likes WHERE gearset_likes.gearset = gearsets.id) as likeCount\nFROM gearsets\nWHERE gearsets.status = 'public'"
  }, collection)

  // remove field
  collection.fields.removeById("_clone_9Wu8")

  // remove field
  collection.fields.removeById("_clone_EDFP")

  // remove field
  collection.fields.removeById("_clone_L2iU")

  // remove field
  collection.fields.removeById("_clone_f66N")

  // add field
  collection.fields.addAt(1, new Field({
    "cascadeDelete": false,
    "collectionId": "_pb_users_auth_",
    "hidden": false,
    "id": "_clone_gzpy",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "user",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "relation"
  }))

  // add field
  collection.fields.addAt(2, new Field({
    "hidden": false,
    "id": "_clone_GX66",
    "maxSize": 0,
    "name": "data",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  // add field
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "_clone_L0g6",
    "name": "created",
    "onCreate": true,
    "onUpdate": false,
    "presentable": false,
    "system": false,
    "type": "autodate"
  }))

  // add field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "_clone_oIFn",
    "name": "updated",
    "onCreate": true,
    "onUpdate": true,
    "presentable": false,
    "system": false,
    "type": "autodate"
  }))

  // add field
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "json3225995011",
    "maxSize": 1,
    "name": "likeCount",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3826297877")

  // update collection data
  unmarshal({
    "viewQuery": "SELECT\n  gearsets.id as id,\n  gearsets.user as user,\n  gearsets.data as data,\n  gearsets.created as created,\n  gearsets.updated as updated\nFROM gearsets\nWHERE gearsets.status = 'public'"
  }, collection)

  // add field
  collection.fields.addAt(1, new Field({
    "cascadeDelete": false,
    "collectionId": "_pb_users_auth_",
    "hidden": false,
    "id": "_clone_9Wu8",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "user",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "relation"
  }))

  // add field
  collection.fields.addAt(2, new Field({
    "hidden": false,
    "id": "_clone_EDFP",
    "maxSize": 0,
    "name": "data",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  // add field
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "_clone_L2iU",
    "name": "created",
    "onCreate": true,
    "onUpdate": false,
    "presentable": false,
    "system": false,
    "type": "autodate"
  }))

  // add field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "_clone_f66N",
    "name": "updated",
    "onCreate": true,
    "onUpdate": true,
    "presentable": false,
    "system": false,
    "type": "autodate"
  }))

  // remove field
  collection.fields.removeById("_clone_gzpy")

  // remove field
  collection.fields.removeById("_clone_GX66")

  // remove field
  collection.fields.removeById("_clone_L0g6")

  // remove field
  collection.fields.removeById("_clone_oIFn")

  // remove field
  collection.fields.removeById("json3225995011")

  return app.save(collection)
})
