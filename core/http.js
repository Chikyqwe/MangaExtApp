const CoreHTTP = (() => {

  function init() {
    cordova.plugin.http.setDataSerializer("utf8");

    // Headers GLOBALS, uno por uno
    cordova.plugin.http.setHeader(null, "User-Agent", "Mozilla/5.0 (Android)");
    cordova.plugin.http.setHeader(null, "Accept", "text/html");
    cordova.plugin.http.setHeader(null, "Referer", "https://zonatmo.com/");
  }

  function get(url) {
    return new Promise((resolve, reject) => {
      cordova.plugin.http.get(
        url,
        {},
        {},
        res => resolve(res.data),
        err => reject(err)
      );
    });
  }

  return { init, get };

})();
