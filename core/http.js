const CoreHTTP = (() => {

  function init() {
    const http = cordova.plugin.http;

    http.setDataSerializer("raw");
    http.setFollowRedirect(true);

    http.setHeader(null, "User-Agent",
      "Mozilla/5.0 (Linux; Android 11; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36"
    );

    http.setHeader(null, "Accept",
      "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
    );

    http.setHeader(null, "Accept-Language", "es-ES,es;q=0.9");

    // ❌ QUITAR
    // http.setHeader(null, "Accept-Encoding", "gzip, deflate, br");
  }

  function get(url, ref = "https://zonatmo.com/", depth = 0) {
    const http = cordova.plugin.http;

    if (depth > 5) {
      return Promise.reject("Demasiadas redirecciones");
    }

    http.setHeader(null, "Referer", ref);

    console.log("[HTTP] GET", url, "(ref:", ref + ")");

    return new Promise((resolve, reject) => {
      http.get(
        url,
        {},
        null, // ✅ MUY IMPORTANTE
        function (res) {
          const html = res.data;

          const match = html.match(
            /http-equiv=["']refresh["'][^>]*url=['"]?([^'">\s]+)/i
          );

          if (match && match[1]) {
            return get(match[1], url, depth + 1)
              .then(resolve)
              .catch(reject);
          }

          resolve(html);
        },
        function (err) {
          console.error("[HTTP] ERROR:", err.status);
          reject(err);
        }
      );
    });
  }

  return { init, get };
})();
