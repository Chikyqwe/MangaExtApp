const ZonaTMO = (() => {

  async function loadLibrary(page = 1) {
    const url = `https://zonatmo.com/library?_pg=${page}&page=${page}`;
    const html = await CoreHTTP.get(url);
    return parseLibrary(html);
  }

  function parseLibrary(html) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const result = [];

    doc.querySelectorAll(".element[data-identifier]").forEach(el => {
      const title =
        el.querySelector(".thumbnail-title h4")?.textContent.trim() || null;

      const url =
        el.querySelector("a")?.href || null;

      const type =
        el.querySelector(".book-type")?.textContent.trim() || null;

      const demography =
        el.querySelector(".demography")?.textContent.trim() || null;

      const id = el.dataset.identifier
        ? Number(el.dataset.identifier)
        : null;

      const scoreText =
        el.querySelector(".score span")?.textContent || null;
      const score = scoreText ? parseFloat(scoreText) : null;

      const isErotic = !!el.querySelector(".fa-heartbeat");

      let cover = null;
      const style = el.querySelector("style")?.textContent || "";
      const match = style.match(/background-image:\s*url\(['"]?(.*?)['"]?\)/);
      if (match) cover = match[1];

      if (!title || !url) return;

      result.push({
        id,
        title,
        url,
        type,
        demography,
        score,
        isErotic,
        cover
      });
    });

    return result;
  }


  async function cargarManga(url) {
    const html = await CoreHTTP.get(url);
    return parseManga(html, url);
  }

  function parseManga(html, url) {
    const doc = new DOMParser().parseFromString(html, "text/html");

    const title = doc.querySelector(".element-title")?.childNodes[0]?.textContent.trim() || "";

    // Subtítulo (si quieres)
    const subtitle = doc.querySelector(".element-subtitle")?.textContent.trim() || "";

    // Portada
    const cover = doc.querySelector(".book-thumbnail")?.src || "";

    // Tipo / demografía
    const type = doc.querySelector(".book-type")?.textContent.trim() || "";
    const demography = doc.querySelector(".demography")?.textContent.trim() || "";

    // Estado (Finalizado / En curso)
    const status = doc.querySelector(".book-status")?.textContent.trim() || "";

    // Descripción
    const description = doc.querySelector(".element-description")?.textContent.trim() || "";

    // Géneros
    const genres = Array.from(doc.querySelectorAll(".element-header-content-text a.badge")).map(g => g.textContent.trim());

    // Sinónimos
    const synonyms = Array.from(doc.querySelectorAll(".element-header-content-text .badge-pill")).map(s => s.textContent.trim());


    const chapters = [];

    const chapterElements = doc.querySelectorAll(
      "#chapters li.upload-link"
    );

    chapterElements.forEach(li => {
      const chTitle = li.querySelector("h4 a")?.textContent.trim();
      const groups = [];

      li.querySelectorAll(".chapter-list li").forEach(row => {
        const group =
          row.querySelector(".col-4 a, .col-12.text-truncate")
            ?.textContent.trim();

        const date = row.querySelector(".badge")?.textContent.trim();
        const play = row.querySelector("a.btn")?.href;

        if (play) groups.push({ group, date, play });
      });

      if (chTitle) chapters.push({ title: chTitle, groups });
    });
    console.log(chapterElements.length);
    
    return { title, cover, chapters, type, demography, status, description, genres, synonyms, subtitle };
  }
  async function search(query, page = 1) {
    const url =
      `https://zonatmo.com/library?title=${encodeURIComponent(query)}&_pg=${page}&page=${page}`;

    const html = await CoreHTTP.get(url);
    return parseSearch(html);
  }
  function parseSearch(html) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const results = [];

    doc.querySelectorAll(".element[data-identifier]").forEach(el => {
      const id = el.dataset.identifier;

      const link = el.querySelector("a")?.href?.trim() || "";

      const title =
        el.querySelector(".thumbnail-title h4")?.textContent.trim() || "";

      // cover desde el <style>
      let cover = "";
      const style = el.querySelector("style")?.textContent || "";
      const coverMatch = style.match(/background-image:\s*url\(['"]?(.*?)['"]?\)/);
      if (coverMatch) cover = coverMatch[1];

      const scoreText =
        el.querySelector(".score span")?.textContent || "0";
      const score = parseFloat(scoreText) || 0;

      const type =
        el.querySelector(".book-type")?.textContent.trim() || "";

      const demography =
        el.querySelector(".demography")?.textContent.trim() || null;

      const isErotic = !!el.querySelector(".fa-heartbeat");

      results.push({
        site: "ZonaTMO",
        id: Number(id),
        title,
        url: link,
        cover,
        score,
        type,
        demography,
        isErotic
      });
    });

    return {
      total: results.length,
      results
    };
  }

  return {
    loadLibrary,
    cargarManga,
    search
  };

})();
