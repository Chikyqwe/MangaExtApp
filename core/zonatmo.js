const ZonaTMO = (() => {

  let libraryData = []; // 👈 VARIABLE FINAL JSON

  async function cargarLibrary(page = 1) {
    const url = `https://zonatmo.com/library?_pg=${page}&page=${page}`;

    const html = await CoreHTTP.get(url);

    libraryData = parseHTML(html);

    return libraryData;
  }

  function parseHTML(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const elements = doc.querySelectorAll(".element");
    const result = [];

    elements.forEach(el => {
      const id = el.getAttribute("data-identifier");

      const a = el.querySelector("a");
      const url = a ? a.href.trim() : null;

      const titleEl = el.querySelector(".thumbnail-title h4");
      const title = titleEl ? titleEl.textContent.trim() : null;

      const scoreEl = el.querySelector(".score span");
      const score = scoreEl ? parseFloat(scoreEl.textContent) : null;

      const typeEl = el.querySelector(".book-type");
      const type = typeEl ? typeEl.textContent.trim() : null;

      const demoEl = el.querySelector(".demography");
      const demography = demoEl ? demoEl.textContent.trim() : null;

      // imagen desde el <style>
      let cover = null;
      const style = el.querySelector("style");
      if (style) {
        const match = style.textContent.match(/url\('(.+?)'\)/);
        if (match) cover = match[1];
      }

      result.push({
        id,
        title,
        url,
        score,
        type,
        demography,
        cover
      });
    });

    return result;
  }

  function getData() {
    return libraryData;
  }

  return { cargarLibrary, getData };

})();
