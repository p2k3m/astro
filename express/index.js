const http = require('http');

function express() {
  const routes = [];
  return {
    get(path, handler) {
      routes.push({ method: 'GET', path, handler });
    },
    listen(port, cb) {
      const server = http.createServer((req, res) => {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const route = routes.find(
          (r) => r.method === req.method && r.path === url.pathname
        );
        res.status = (code) => {
          res.statusCode = code;
          return res;
        };
        res.json = (obj) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(obj));
        };
        if (route) {
          req.query = Object.fromEntries(url.searchParams);
          try {
            route.handler(req, res);
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
        } else {
          res.statusCode = 404;
          res.end('Not Found');
        }
      });
      return server.listen(port, cb);
    },
  };
}

module.exports = express;
