const ZonaTMO = (() => {

  async function cargarLibrary(page = 1) {
    const url = `https://zonatmo.com/library?_pg=${page}&page=${page}`;
    const html = await CoreHTTP.get(url);
    return parseLibrary(html);
  }

  function parseLibrary(html) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const result = [];

    doc.querySelectorAll(".element").forEach(el => {
      const title = el.querySelector(".thumbnail-title h4")?.textContent.trim();
      const url = el.querySelector("a")?.href;
      const type = el.querySelector(".book-type")?.textContent.trim();
      const demo = el.querySelector(".demography")?.textContent.trim();

      let cover = null;
      const style = el.querySelector("style")?.textContent;
      if (style) {
        const m = style.match(/url\('(.+?)'\)/);
        if (m) cover = m[1];
      }

      if (title && url) {
        result.push({ title, url, type, demography: demo, cover });
      }
    });

    return result;
  }

  async function cargarManga(url) {
    const html = await CoreHTTP.get(url);
    return parseManga(html, url);
  }

function parseManga(html, url) {
    const doc = new DOMParser().parseFromString(html, "text/html");

    const title = doc.querySelector("h1")?.textContent.trim() || "";
    const cover = doc.querySelector(".book-thumbnail img")?.src || "";

    const chapters = [];

    // Buscamos en ambas listas: la normal y la colapsada
    const chapterElements = doc.querySelectorAll("#chapters > ul > li.upload-link, #chapters-collapsed > ul > li.upload-link");

    chapterElements.forEach(li => {
      const chTitle = li.querySelector("h4 a")?.textContent.trim();
      const groups = [];

      li.querySelectorAll(".chapter-list li").forEach(row => {
        const group = row.querySelector(".col-4 a, .col-12.text-truncate")?.textContent.trim();
        const date = row.querySelector(".badge")?.textContent.trim();
        const play = row.querySelector("a.btn")?.href;

        if (play) groups.push({ group, date, play });
      });

      if (chTitle) {
        chapters.push({ title: chTitle, groups });
      }
    });

    return { title, cover, chapters };
  }

  return {
    cargarLibrary,
    cargarManga
  };

})();
