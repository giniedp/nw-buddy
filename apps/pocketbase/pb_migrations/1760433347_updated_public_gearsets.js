/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3826297877")

  // update collection data
  unmarshal({
    "viewQuery": "SELECT\n  gearsets.id as id,\n  gearsets.user as user,\n  gearsets.data as data,\n  gearsets.created as created,\n  gearsets.updated as updated\nFROM gearsets\nWHERE gearsets.status = 'public'"
  }, collection)

  // remove field
  collection.fields.removeById("_clone_sbuZ")

  // remove field
  collection.fields.removeById("_clone_OZ3E")

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

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3826297877")

  // update collection data
  unmarshal({
    "viewQuery": "SELECT\n  gearsets.id as id,\n  gearsets.user as user,\n  gearsets.data as data\nFROM gearsets\nWHERE gearsets.status = 'public'\n"
  }, collection)

  // add field
  collection.fields.addAt(1, new Field({
    "cascadeDelete": false,
    "collectionId": "_pb_users_auth_",
    "hidden": false,
    "id": "_clone_sbuZ",
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
    "id": "_clone_OZ3E",
    "maxSize": 0,
    "name": "data",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  // remove field
  collection.fields.removeById("_clone_9Wu8")

  // remove field
  collection.fields.removeById("_clone_EDFP")

  // remove field
  collection.fields.removeById("_clone_L2iU")

  // remove field
  collection.fields.removeById("_clone_f66N")

  return app.save(collection)
})
