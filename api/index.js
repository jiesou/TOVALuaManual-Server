export default async function handler(request, response) {
  return response.status(200).json({
    'code': 0,
    'message': 'Hello, world!',
  });
}