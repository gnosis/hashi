#!/bin/sh

if [ -n "$ENABLE_CLOUDRUN_HEALTHCHECK" ]; then
  echo "CloudRun health check server enabled on port 8080"
  node -e "const http = require('http'); http.createServer((req, res) => {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('OK\n');
  }).listen(8080, '0.0.0.0', () => console.log('Health check server running on port 8080'));" &
else
  echo "CloudRun health check server disabled"
fi

exec "$@"