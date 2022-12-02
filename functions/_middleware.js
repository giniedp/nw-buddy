// Respond to OPTIONS method
export const onRequestOptions = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  });
};

// Set CORS to all /api responses
export const onRequest = async ({ next }) => {
  const response = await next();
  response.headers.set('Access-Control-Allow-Origin', '*');
  return response;
};
