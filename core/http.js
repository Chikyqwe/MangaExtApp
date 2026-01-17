const CoreHTTP = (() => {

  function init() {
    const http = cordova.plugin.http;

    http.setDataSerializer("utf8");
    http.setFollowRedirect(true);

    // Headers globales realistas
    http.setHeader(
      null,
      "User-Agent",
      "Mozilla/5.0 (Linux; Android 11; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36"
    );

    http.setHeader(
      null,
      "Accept",
      "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
    );

    http.setHeader(null, "Accept-Language", "es-ES,es;q=0.9");
    http.setHeader(null, "Accept-Encoding", "gzip, deflate, br");
    http.setHeader(null, "Connection", "keep-alive");
  }

  async function get(url, ref = "https://zonatmo.com/", depth = 0) {
    const http = cordova.plugin.http;

    if (depth > 5) {
      throw new Error("Demasiadas redirecciones (posible loop)");
    }

    http.setHeader(null, "Referer", ref);

    return new Promise((resolve, reject) => {
      http.get(
        url,
        {},
        {},
        function (res) { // ❌ NO async
          let html = res.data;

          const match = html.match(
            /http-equiv=["']refresh["'][^>]*url=['"]?([^'">\s]+)/i
          );

          if (match && match[1]) {
            const nextUrl = match[1];
            console.log("[HTTP] META redirect →", nextUrl);

            get(nextUrl, url, depth + 1)
              .then(resolve)
              .catch(reject);
            return;
          }

          resolve(html);
        },
        function (err) {
          console.error("[HTTP] ERROR:", err);
          reject(err.error || err);
        }
      );
    });
  }


  return {
    init,
    get
  };

})();
