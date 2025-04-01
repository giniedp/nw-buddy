import { program } from 'commander'
import { MUTATIONS_API_KEY } from '../env'
import { glob } from './utils'
import fs from 'node:fs'
program
  .command('transform')
  .description('Transforms functions and bakes API keys')
  .action(async (data) => {
    const files = await glob(`functions/**/*.js`)
    for (const file of files) {
      const data = fs.readFileSync(file, 'utf8')
      if (!data.includes('env.MUTATIONS_API_KEY')) {
        continue
      }
      console.log('Baking', file, MUTATIONS_API_KEY)
      const content = data.replaceAll('env.MUTATIONS_API_KEY', JSON.stringify(MUTATIONS_API_KEY))
      fs.writeFileSync(file, content)
    }
  })
program.parse(process.argv)
