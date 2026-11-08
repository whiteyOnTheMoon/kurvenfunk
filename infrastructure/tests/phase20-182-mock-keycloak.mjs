// Disposable upstream for isolated auth gateway HTTP tests. No real user records.
import { createServer } from 'node:http';

createServer((_request, response) => {
  response.writeHead(200, { 'content-type': 'text/plain' });
  response.end('isolated-fixture');
}).listen(8080, '0.0.0.0');
