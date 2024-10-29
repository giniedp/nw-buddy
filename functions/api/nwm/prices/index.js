export async function onRequest(context) {
  const server = new URL(context.request.url).searchParams.get('server')
  if (!server) {
    return new Response(JSON.stringify(result))
  }
  const url = `https://gaming.tools/prices/nwmp?serverName=${server}`
  const response = await fetch(url, {
    headers: {
      'user-agent': 'nw-buddy'
    }
  })
  const result = await response.json()
  return new Response(JSON.stringify(result))
}
