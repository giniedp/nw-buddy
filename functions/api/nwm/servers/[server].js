export async function onRequest(context) {
  const server = context.params.server
  const url = `https://nwmarketprices.com/api/latest-prices/${server}/`
  const response = await fetch(url, {
    headers: {
      'user-agent': 'nw-buddy'
    }
  })
  const result = await response.json()
  return new Response(JSON.stringify(result))
}
