export async function onRequest(context) {
  const response = await fetch(`https://gaming.tools/prices/nwmp/servers`, {
    headers: {
      'user-agent': 'nw-buddy'
    }
  })
	const result = await response.json()
  return new Response(JSON.stringify(result))
}
