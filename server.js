// Listen on a specific host via the HOST environment variable
var host = process.env.HOST || "0.0.0.0";
// Listen on a specific port via the PORT environment variable
var port = process.env.PORT || 8080;
var port_https = process.env.PORT || 8000;
const fs = require("fs");

// Grab the blacklist from the command-line so that we can update the blacklist without deploying
// again. CORS Anywhere is open by design, and this blacklist is not used, except for countering
// immediate abuse (e.g. denial of service). If you want to block all origins except for some,
// use originWhitelist instead.
var originBlacklist = parseEnvList(process.env.CORSANYWHERE_BLACKLIST);
var originWhitelist = parseEnvList(process.env.CORSANYWHERE_WHITELIST);
function parseEnvList(env) {
  if (!env) {
    return [];
  }
  return env.split(",");
}

// Set up rate-limiting to avoid abuse of the public CORS Anywhere server.
var checkRateLimit = require("./lib/rate-limit")(
  process.env.CORSANYWHERE_RATELIMIT
);

var cors_proxy = require("./lib/cors-anywhere");
cors_proxy
  .createServer({
    originBlacklist: originBlacklist,
    originWhitelist: originWhitelist,
    requireHeader: ["origin", "x-requested-with"],
    checkRateLimit: checkRateLimit,
    removeHeaders: [
      "cookie",
      "cookie2",
      // Strip Heroku-specific headers
      "x-heroku-queue-wait-time",
      "x-heroku-queue-depth",
      "x-heroku-dynos-in-use",
      "x-request-start",
    ],
    redirectSameOrigin: true,
    httpProxyOptions: {
      // Do not add X-Forwarded-For, etc. headers, because Heroku already adds it.
      xfwd: false,
    },
  })
  .listen(port, host, function () {
    console.log("Running CORS Anywhere on " + host + ":" + port);
  });

var cors_proxy_https = require("./lib/cors-anywhere");

cors_proxy_https
  .createServer({
    // add https support
    //https://github.com/Rob--W/cors-anywhere/issues/74

    httpsOptions: {
      // key: fs.readFileSync(__dirname + '/private.key', 'utf8'),
      key: fs.readFileSync("./test/key.pem", "utf8"),
      cert: fs.readFileSync("./test/cert.pem", "utf8"),
    },
    // ********** end **** https ***************************

    originBlacklist: originBlacklist,
    originWhitelist: originWhitelist,
    requireHeader: ["origin", "x-requested-with"],
    checkRateLimit: checkRateLimit,
    removeHeaders: [
      "cookie",
      "cookie2",
      // Strip Heroku-specific headers
      "x-heroku-queue-wait-time",
      "x-heroku-queue-depth",
      "x-heroku-dynos-in-use",
      "x-request-start",
    ],
    redirectSameOrigin: true,
    httpProxyOptions: {
      // Do not add X-Forwarded-For, etc. headers, because Heroku already adds it.
      xfwd: false,
    },
  })
  .listen(port_https, host, function () {
    console.log("Running CORS Anywhere https " + host + ":" + port_https);
  });
