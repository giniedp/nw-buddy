export const onRequestOptions = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  })
}

export async function onRequest(context) {
  const server = context.params.server
  const response = await fetch(`https://nwmarketprices.com/api/latest-prices/${server}/`)
  response.headers.set('Access-Control-Allow-Origin', '*')
  const result = await response.json()
  return new Response(JSON.stringify(result))
}
