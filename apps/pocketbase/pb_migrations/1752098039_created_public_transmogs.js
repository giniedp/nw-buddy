/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": null,
    "deleteRule": null,
    "fields": [
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text3208210256",
        "max": 0,
        "min": 0,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      {
        "cascadeDelete": false,
        "collectionId": "_pb_users_auth_",
        "hidden": false,
        "id": "_clone_IUVi",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "user",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "_clone_vr6X",
        "maxSize": 0,
        "name": "data",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "json"
      }
    ],
    "id": "pbc_444140545",
    "indexes": [],
    "listRule": null,
    "name": "public_transmogs",
    "system": false,
    "type": "view",
    "updateRule": null,
    "viewQuery": "SELECT\n  transmogs.id as id,\n  transmogs.user as user,\n  transmogs.data as data\nFROM transmogs\nWHERE transmogs.status = 'public'",
    "viewRule": null
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_444140545");

  return app.delete(collection);
})
