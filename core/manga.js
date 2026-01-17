const MangaView = (() => {

  async function getChapter(url) {
    const html = await CoreHTTP.get(url);
    return parseChapter(html, url);
  }

  function parseChapter(html, url) {
    const doc = new DOMParser().parseFromString(html, "text/html");

    // ---------- DATOS BÁSICOS ----------
    const title = doc.querySelector("h1")?.textContent.trim() || "";
    const subtitle = doc.querySelector("h2")?.textContent.trim() || "";

    const chapterMatch = subtitle.match(/Capítulo\s+([0-9.]+)/i);
    const chapter = chapterMatch ? chapterMatch[1] : "";

    const scanlation =
      doc.querySelector("h2 a")?.textContent.trim() || "";

    const typeText =
      doc.querySelector("h4 b")?.textContent.trim() || "";

    const readingDirection =
      doc.querySelector("h4")?.textContent.includes("izquierda a derecha")
        ? "LTR"
        : "RTL";

    // ---------- IMÁGENES ----------
    const images = [];
    doc.querySelectorAll("img.viewer-img").forEach(img => {
      const src = img.getAttribute("data-src");
      if (src) images.push(src);
    });

    // ---------- COVER ----------
    const cover =
      doc.querySelector('meta[property="og:image"]')?.content || "";

    // ---------- NAVEGACIÓN ----------
    const prev =
      doc.querySelector(".chapter-prev a")?.href || null;

    const next =
      doc.querySelector(".chapter-next a")?.href || null;

    // ---------- METADATA ----------
    const published =
      doc.querySelector('script[type="application/ld+json"]')
        ? JSON.parse(
            doc.querySelector('script[type="application/ld+json"]').textContent
          ).datePublished
        : null;

    const ogUrl =
      doc.querySelector('meta[property="og:url"]')?.content || url;

    const uploadIdMatch = ogUrl.match(/viewer\/([^/]+)/);
    const uploadId = uploadIdMatch ? uploadIdMatch[1] : null;

    // ---------- SHARE LINKS ----------
    const share = {
      facebook: doc.querySelector('.btn-facebook')?.href || null,
      twitter: doc.querySelector('.btn-twitter')?.href || null,
      telegram: doc.querySelector('.btn-telegram')?.href || null,
      whatsapp: doc.querySelector('.btn-whatsapp')?.href || null
    };

    // ---------- JSON FINAL ----------
    return {
      site: "ZonaTMO",
      url,
      viewer: ogUrl,
      id: uploadId,

      title,
      chapter,
      subtitle,
      type: typeText,
      scanlation,
      readingDirection,

      cover,
      images,
      totalPages: images.length,

      prev,
      next,

      published,
      share
    };
  }

  return {
    getChapter
  };

})();

// reader
const CascadeReader = (() => {

  let pages = [];
  let index = 0;
  let observer = null;
  let referer = "https://zonatmo.com/";

  function init(chapterData) {
    pages = chapterData.images;
    index = 0;
    referer = chapterData.referer || referer;

    const reader = document.getElementById(
      chapterData.container || "reader"
    );

    reader.innerHTML = "";
    reader.style.direction =
      chapterData.readingDirection === "LTR" ? "ltr" : "rtl";

    createObserver();
    loadNext();
  }

  function loadNext() {
    if (index >= pages.length) return;

    const reader = document.getElementById("reader");

    const page = document.createElement("div");
    page.className = "page loading";

    const img = document.createElement("img");
    img.dataset.src = pages[index]; // URL remota
    img.loading = "lazy";

    page.appendChild(img);
    reader.appendChild(page);

    observer.observe(page);
    index++;
  }

  function createObserver() {
    observer = new IntersectionObserver(entries => {
      entries.forEach(async entry => {
        if (!entry.isIntersecting) return;

        const img = entry.target.querySelector("img");
        if (!img || img.src) return;

        try {
          const localUrl = await downloadImage(
            img.dataset.src,
            referer
          );

          img.src = localUrl;

          img.onload = () => {
            entry.target.classList.remove("loading");
            loadNext();
          };

        } catch (e) {
          console.error("IMG DOWNLOAD ERROR", e);
        }

        observer.unobserve(entry.target);
      });
    }, {
      rootMargin: "200px"
    });
  }

  return { init };

})();