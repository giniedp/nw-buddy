import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { Damagetable, Vitals } from '@nw-data/types'
import { combineLatest, map, Observable, of, ReplaySubject, switchMap } from 'rxjs'
import { NwDbService, NwModule } from '~/nw'
import { getWeaponTagLabel } from '~/nw/utils'
import { NwWeaponTypesService } from '~/nw/weapon-types'
import { CaseInsensitiveMap, humanize } from '~/utils'
import { diceCoefficient } from 'dice-coefficient'
import { sortBy } from 'lodash'

@Component({
  standalone: true,
  selector: 'nwb-vital-damage-table',
  templateUrl: './vital-damage-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule],
  host: {
    class: 'layout-content',
  },
})
export class VitalDamageTableComponent {
  @Input()
  public set vitalId(id: string) {
    this.vitalId$.next(id)
  }

  private vitalId$ = new ReplaySubject<string>(1)
  private damageTableFns = this.getDamageTableFns()

  protected table$ = this.db
    .vital(this.vitalId$)
    .pipe(switchMap((vital) => this.damageTable(vital)))
    .pipe(
      map((data) => {
        return {
          name: data?.name,
          rows: data?.rows?.map((row) => {
            return {
              Name: humanize(row.DamageID.replace(/^Attack/, '')),
              DamageTypeName: row.DamageType ? `${row.DamageType}_DamageName` : '',
              DamageTypeIcon: this.dmg.damageTypeIcon(row.DamageType),
              WeaponCategory: getWeaponTagLabel(row.WeaponCategory) || row.WeaponCategory,
              AttackType: row.AttackType,
            }
          }),
        }
      })
    )

  public constructor(private db: NwDbService, private dmg: NwWeaponTypesService) {}

  private damageTable(vital: Vitals): Observable<{ rows: Damagetable[]; name: string }> {
    const fns = this.damageTableFns
    const categories = vital?.VitalsCategories?.map((it) => it.replace(/_/gi, '')) || []

    // console.log(vital.VitalsID)
    // console.log(categories)

    const candidates: string[] = []

    candidates.push(MAP[vital.VitalsID])

    for (let category of categories) {
      if (fns.has(category)) {
        candidates.push(category)
      }
      category = category.replace('Corruption', 'Corrupted')
      if (fns.has(category)) {
        candidates.push(category)
      }
      category = category.replace('Swamp', '')
      if (fns.has(category)) {
        candidates.push(category)
      }
    }

    {
      const tokens = vital.VitalsID.split('_')
      while (tokens.length) {
        const candidate = tokens.join('')
        if (!fns.has(candidate)) {
          tokens.pop()
          continue
        }
        candidates.push(candidate)
        break
      }
    }

    {
      const tokens = vital.VitalsID.split('_')
      while (tokens.length) {
        const candidate = tokens.pop()
        if (fns.has(candidate)) {
          candidates.push(candidate)
          break
        }
      }
    }

    // if (!key) {
    //   const keys = Array.from(fns.keys()).sort()
    //   const rating = sortBy(categories.map((it) => testAndRate(it, keys)).flat(1), (it) => it.rating).reverse()
    //   console.log(rating[0])
    //   if (rating[0].rating > 0.85 && fns.has(rating[0].sample)) {
    //     key = rating[0].sample
    //   }
    // }

    const key = sortBy(candidates.filter((it) => !!it), (it) => it.length).reverse()[0]
    const fn = fns.get(key)
    if (!fn) {
      return of(null)
    }

    console.log(fn)
    return combineLatest({
      name: of(key),
      rows: this.db.data[fn]() as Observable<Damagetable[]>,
    })
  }

  private getDamageTableFns() {
    return this.db.data.apiMethods
      .map((it) => {
        const tokens = it.split(/damagetable/i)
        return {
          fn: it,
          key: tokens[1],
        }
      })
      .filter((it) => !!it.key)
      .reduce((res, { key, fn }) => {
        res.set(key, fn)
        return res
      }, new CaseInsensitiveMap<string, string>())
  }
}

export function testAndRate(testString: string, samples: string[]) {
  return samples.map((sample) => {
    return {
      sample,
      rating: diceCoefficient(testString, sample),
    }
  })
}

const MAP = {
  Legion_GeneralCrassus: 'LegionGeneralCrassusBoss',
  Isabella_DG_Ebonscale_00: 'isabelladynastyshipyard',
  Isabella_DG_ShatterMtn_Phase0_00: 'IsabellaLairPhase1',
  Isabella_DG_ShatterMtn_Phase1_00: 'IsabellaLairPhase1',
  Isabella_DG_ShatterMtn_Phase2_00: 'IsabellaLairPhase2'
}

// "alligator",
// "alligatoryoung",
// "ancientamalgam",
// "ancientguardian",
// "ancientguardianheavyboss",
// "anubianguardianbrute",
// "anubianguardianhorus",
// "anubianlotusscarab",
// "anubianscarab",
// "armoreddragon",
// "bear",
// "bearblack",
// "bearcub",
// "beardamned",
// "bearelemental",
// "bearthorpeminion",
// "bison",
// "bisonstrange",
// "blightfiend",
// "bloatedcorpse",
// "boar",
// "bogmonster",
// "boss",
// "broken",
// "brokenvillager2haxe",
// "brokenvillager2hpick",
// "brokenvillageraxethrower",
// "brokenvillagercleaver",
// "brokenvillagerhammer",
// "brokenvillagerknife",
// "brokenvillagerladel",
// "brokenvillagerpitchfork",
// "brokenvillagerprong",
// "brokenvillagerrake",
// "brokenvillagershovel",
// "brokenvillagersickle",
// "brute",
// "bruteyeti",
// "corruptedlegioncyclops",
// "corruptedogre",
// "corruptedogreminion",
// "corruptedswarmer",
// "corruptedtiger",
// "corruptionentity",
// "corruptionheavy",
// "damned",
// "damnedacolyte",
// "damnedcommander",
// "damnedcommanderftue",
// "damnedcultist",
// "damnedgreataxe",
// "damnedhound",
// "damnedpriest",
// "dryadarcher",
// "dryadprowler",
// "dryadshaman",
// "dryadsiren",
// "dryadsoldier",
// "dryadtendril",
// "dunephantomberserker",
// "dunephantomhuntress",
// "dunephantomtank",
// "dungeon",
// "dynastyheavy",
// "dynastymusketeer",
// "dynastyspearman",
// "dynastysummoner",
// "dynastywarrior",
// "eliteaffix",
// "elk",
// "elkcorrupted",
// "elkspringstag",
// "empress",
// "evilknighthound",
// "ezraforgemaster",
// "ghost",
// "ghostcharred",
// "ghostfrozen",
// "ghostplagued",
// "ghostshackled",
// "ghostshipwrecked",
// "goat",
// "goliathbruteboss",
// "goliathhorusboss",
// "grunt",
// "humanbow",
// "humangreataxe",
// "humanmace",
// "humanrapier",
// "humanspear",
// "humanspellcaster",
// "humansword",
// "humanwarhammer",
// "icedryadfiendshivers",
// "icedryadfiendshivers2",
// "icedryadfrostfang",
// "icedryadfrostgrip",
// "imhotep",
// "invasionbomber",
// "invasionpriest",
// "isabelladynastyshipyard",
// "isabellalairphase1",
// "isabellalairphase2",
// "isabellatiger",
// "knightwolf",
// "legiongeneralcrassusboss",
// "legionlegionnaire",
// "legionsagittarii",
// "legionsignifer",
// "lion",
// "lostfencer",
// "lostknightbow",
// "lostknighttank",
// "lostmonarch",
// "lostpikeman",
// "lostsiren",
// "maiden",
// "medea",
// "mutators",
// "naga",
// "nagaancientguardian",
// "nagaangryearth",
// "nagacorrupted",
// "nagawithered",
// "orghostboss",
// "overseerzane",
// "pedestal",
// "perks",
// "priestlesserdamnedhound",
// "risen",
// "s",
// "sandelementalheavy",
// "sandelementalquestboss",
// "sandelementalshaman",
// "sandelementalsoldier",
// "scorpion",
// "scorpionimpaler",
// "scorpionslinger",
// "scorpionsulfur",
// "skeleton",
// "skeleton1hsword",
// "skeleton2hsword",
// "skeletonarcher",
// "skeletonclub",
// "skeletoncrawler",
// "skeletonmage",
// "skeletonspear",
// "spellbot",
// "spirit",
// "spriggan",
// "spriggancorrupted",
// "sprigganinvasion",
// "structures",
// "sulfurdragon",
// "sulfurlizard",
// "swampbeast",
// "swampfiend",
// "swarmancermedeaminion",
// "tendrilcorrupted",
// "tiger",
// "torsoboss",
// "turkey",
// "undead",
// "undeadadmiralbrute",
// "undeadberserker",
// "undeadbrute",
// "undeadgravedigger",
// "undeadgrenadier",
// "undeadhunter",
// "undeadjavelineer",
// "undeadnavigator",
// "undeadofficer",
// "undeadpiratebrute",
// "undeadpistoleer",
// "undeadsailor",
// "undeadshaman",
// "wispywaspswarm",
// "witheredbeetle",
// "witheredfeculent",
// "witheredswarmancer",
// "wolf",
// "wolfalpha",
// "wolfbarkimedes",
// "wolfbrown",
// "wolfwhite",
// "wolfwinter",
// "yeti2022",
// "yeti2022frostfangminion",
// "yeti2022frostgripminion",
// "zanetendril"
