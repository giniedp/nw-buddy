import { TestBed } from "@angular/core/testing"
import { ItemInstancesDB } from "./item-instances.db"

describe('PlayerItemsData', () => {

  let service: ItemInstancesDB

  beforeEach(async () => {
    service = TestBed.inject(ItemInstancesDB)
    await service.resetDB()
  })

  it('creates entries', async () => {
    const result = await service.create({
      gearScore: 100
    })
    console.log(result)
    expect(result.id).not.toBeFalsy()
  })
})
