import makeResponse from './units/makeResponse.js';
export default async function handler(_request, response) {
  makeResponse(response, 0, 'Hello, world!');
}