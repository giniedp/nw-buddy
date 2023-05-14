/// <reference types="@types/jasmine" />


// describe('nw / utils / convertPerkBucket', () => {
//   let data: Perkbuckets[]
//   let dataMap: Map<string, Perkbuckets>
//   beforeEach(() => {
//     data = require('../../../../../dist/nw-data/live/datatables/javelindata_perkbuckets.json')
//     dataMap = new Map(data.map((entry) => [entry.PerkBucketID, entry]))
//   })

//   it('converts', async () => {
//     for (const entry of data) {
//       if (entry.PerkBucketID.endsWith('_Weights')) {
//         continue
//       }
//       const result = convertPerkBucket(entry, dataMap)
//       expect(Array.isArray(result.Perks)).toBe(true)
//       expect(result.Perks.length).toBeGreaterThan(0)
//       expect(result.PerkChance).toBeGreaterThan(0)
//       expect(result.PerkType).not.toBeFalsy()
//     }
//   })
// })
