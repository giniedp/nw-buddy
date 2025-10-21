import { program } from 'commander'
import SteamUser from 'steam-user'
import dotenv from 'dotenv'
dotenv.config()

program
  .command('login')
  .description('Login to your steam account')
  .requiredOption('-u, --user <user>', 'Account user name', process.env.STEAM_USER)
  .requiredOption('-p, --pass <pass>', 'Account password', process.env.STEAM_PASS)
  .action(async ({ user, pass }: { user: string; pass: string }) => {
    await resolveNwSession(user, pass)
      .then((session) => {
        console.log({ session })
      })
      .catch((error) => {
        console.error(error)
      })
  })

program.parse(process.argv)

async function resolveNwSession(user: string, pass: string) {
  return new Promise((resolve, reject) => {
    const client = new SteamUser()
    client.once('error', (error) => {
      reject(error)
      client.logOff()
    })
    client.once('loggedOn', async () => {
      await client
        .createAuthSessionTicket(1063730)
        .then(({ sessionTicket }) => {
          return createNwSession(sessionTicket.toString('hex'))
        })
        .then(resolve)
        .catch(reject)
      client.logOff()
    })
    client.logOn({
      accountName: user,
      password: pass,
    })
  })
}

async function createNwSession(authToken: string) {
  return fetch(`https://service.maestro.us-east-1.social.games.a2z.com/externalMaestro/createSession/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      authToken: authToken,
      refreshJWT: 'e',
      apiKey: 'amzn1.apiKey.b45809db-1643-9c9f-e910-b8c7a6e8112d',
      deviceId: '3E236AEE-49C0-4A00-9CC3-AFDEFB8188F1:Win:10.0.22000:v0.5.7',
    }),
  }).then((r) => r.json())
}
