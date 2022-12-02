export async function onRequest(context) {
  const server = context.params.server
  const response = await fetch(`https://nwmarketprices.com/api/latest-prices/${server}/`)
  const result = await response.json()
  return new Response(JSON.stringify(result))
}
