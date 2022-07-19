export default async function handler(request, response) {
  return response.json({
    'code': 0,
    'message': 'Hello, world!',
  });
}