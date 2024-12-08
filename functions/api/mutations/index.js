export async function onRequest({ env }) {
  const result = await fetch(`https://mutations.5con.club/api/v2/mutations/current`, {
    headers: {
      'x-api-key': env.MUTATIONS_API_KEY
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
    }))
  return new Response(JSON.stringify(result), {
    headers: {
      'cache-control': 'max-age=300, private',
      'content-type': 'application/json'
    }
  })
}
