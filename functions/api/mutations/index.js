export async function onRequest(context) {
  const response = await fetch(`https://mutations.5con.club/api/http_trigger`)
	const data = await response.json()
  const result = Object.keys(data).map((key) => {
    const node = data[key]
    return {
      expedition: node.Expedition_Id,
      element: node.Mutation_Id,
      promotion: node.Promotion,
      curse: node.Curse_Name,
    }
  })
  return new Response(JSON.stringify(result), {
    headers: {
      'cache-control': 'max-age=300, private',
      'content-type': 'application/json'
    }
  })
}
