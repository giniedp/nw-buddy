export async function onRequest({ env }) {
  const apiKey = env.MUTATIONS_API_KEY
  return await fetch(`https://mutations.5con.club/api/v2/mutations/current`, {
    headers: {
      'x-api-key': apiKey
    }
  })
    .then((it) => it.json())
    .then((it) => it.expeditions)
    .then((list) => list.map((it) => {
      return {
        expedition: it.expedition_id,
        element: it.mutation_id,
        promotion: it.promotion,
        curse: it.curse_name,
      }
    })).then((result) => {
      return new Response(JSON.stringify(result), {
        headers: {
          'cache-control': 'max-age=300, private',
          'content-type': 'application/json'
        }
      })
    })
    .catch((e) => {
      return new Response(e.message, {
        status: 500,
        headers: {
          'content-type': 'text/plain'
        }
      })
    })
}
