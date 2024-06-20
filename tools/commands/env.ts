import { program } from 'commander'
import {
  CDN_UPLOAD_ENDPOINT,
  CDN_UPLOAD_KEY,
  CDN_UPLOAD_SECRET,
  CDN_UPLOAD_SPACE,
  CDN_URL,
  NW_WORKSPACE,
  environment,
} from '../../env'

program
  .command('env')
  .description('Shows the current environment')
  .action(async (data) => {
    console.log({
      CDN_UPLOAD_ENDPOINT,
      CDN_UPLOAD_KEY,
      CDN_UPLOAD_SECRET,
      CDN_UPLOAD_SPACE,
      CDN_URL,
      NW_WORKSPACE,
      environment,
    })
  })
