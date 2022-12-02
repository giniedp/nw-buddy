export async function onRequest(context) {
  const response = await fetch(`https://nwmarketprices.com/api/servers/`)
	const result = await response.json()
  return new Response(JSON.stringify(result))
}
