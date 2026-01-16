const CoreHTTP = (() => {

  function init() {
    cordova.plugin.http.setDataSerializer("utf8");

    cordova.plugin.http.setHeader("*", {
      "User-Agent": "Mozilla/5.0 (Android)",
      "Accept": "text/html",
      "Referer": "https://zonatmo.com/"
    });
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
