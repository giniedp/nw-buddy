export async function onRequest(context) {
  const response = await fetch(`https://nwmarketprices.com/api/servers/`, {
    headers: {
      'user-agent': 'NW Buddy Cloudflare Worker'
    }
  })
	const result = await response.json()
  return new Response(JSON.stringify(result))
}
