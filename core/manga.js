const MangaView = (() => {

  async function getChapter(url) {
    const html = await CoreHTTP.get(url);
    return parseChapter(html, url);
  }
  function parseChapter(html, url) {
    console.groupCollapsed("📘 parseChapter");
    console.log("URL:", url);

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

    console.log("Título:", title);
    console.log("Capítulo:", chapter);
    console.log("Scanlation:", scanlation);
    console.log("Dirección:", readingDirection);

    // ---------- IMÁGENES ----------
    let images = [];

    // 1️⃣ Intentar desde DOM
    doc.querySelectorAll("img.viewer-img").forEach((img, i) => {
      const src = img.getAttribute("data-src") || img.getAttribute("src");
      if (src) {
        images.push(src);
        console.log(`🖼️ DOM img[${i}]`, src);
      }
    });

    if (images.length > 0) {
      console.log(`✅ Imágenes desde DOM: ${images.length}`);
    } else {
      console.warn("⚠️ No hay imágenes en DOM, buscando en <script>");

      // 2️⃣ Fallback: SCRIPT INLINE
      let dirPath = null;
      let scriptImages = null;

      doc.querySelectorAll("script").forEach((script, i) => {
        const text = script.textContent;
        if (!text) return;

        // ---- dirPath ----
        const dirMatch = text.match(
          /(var|let|const)\s+dirPath\s*=\s*['"]([^'"]+)['"]/
        );
        if (dirMatch) {
          dirPath = dirMatch[2];
          console.log(`📂 dirPath encontrado (script ${i})`, dirPath);
        }

        // ---- images = [...] ----
        let imagesMatch = text.match(
          /(var|let|const)\s+images\s*=\s*(\[[\s\S]*?\]);/
        );

        // ---- images = JSON.parse('...') ----
        if (!imagesMatch) {
          imagesMatch = text.match(
            /(var|let|const)\s+images\s*=\s*JSON\.parse\(\s*['"]([\s\S]*?)['"]\s*\)/
          );
          if (imagesMatch) {
            try {
              scriptImages = JSON.parse(imagesMatch[2]);
              console.log(
                `🧩 images JSON.parse encontrado (script ${i})`,
                scriptImages.length,
                "items"
              );
            } catch (e) {
              console.error("❌ Error parseando JSON.parse(images)", e);
            }
          }
        } else {
          try {
            scriptImages = JSON.parse(imagesMatch[2]);
            console.log(
              `🧩 images array literal encontrado (script ${i})`,
              scriptImages.length,
              "items"
            );
          } catch (e) {
            console.error("❌ Error parseando images array", e);
          }
        }
      });

      if (dirPath && Array.isArray(scriptImages)) {
        images = scriptImages.map((img, i) => {
          const full = dirPath + img;
          console.log(`🖼️ SCRIPT img[${i}]`, full);
          return full;
        });
        console.log(`✅ Imágenes reconstruidas desde script: ${images.length}`);
      } else {
        console.error("❌ No se pudieron obtener imágenes desde script");
      }
    }

    // ---------- COVER ----------
    const cover =
      doc.querySelector('meta[property="og:image"]')?.content || "";

    console.log("Cover:", cover || "NO");

    // ---------- NAVEGACIÓN ----------
    const prev =
      doc.querySelector(".chapter-prev a")?.href || null;

    const next =
      doc.querySelector(".chapter-next a")?.href || null;

    console.log("Prev:", prev);
    console.log("Next:", next);

    // ---------- METADATA ----------
    let published = null;
    const ldJson = doc.querySelector('script[type="application/ld+json"]');
    if (ldJson) {
      try {
        published = JSON.parse(ldJson.textContent).datePublished || null;
      } catch (e) {
        console.warn("LD+JSON inválido");
      }
    }

    const ogUrl =
      doc.querySelector('meta[property="og:url"]')?.content || url;

    const uploadIdMatch = ogUrl.match(/viewer\/([^/]+)/);
    const uploadId = uploadIdMatch ? uploadIdMatch[1] : null;

    console.log("Viewer URL:", ogUrl);
    console.log("Upload ID:", uploadId);
    console.log("Total páginas:", images.length);

    console.groupEnd();

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

      share: {
        facebook: doc.querySelector(".btn-facebook")?.href || null,
        twitter: doc.querySelector(".btn-twitter")?.href || null,
        telegram: doc.querySelector(".btn-telegram")?.href || null,
        whatsapp: doc.querySelector(".btn-whatsapp")?.href || null
      }
    };
  }
  return {
    getChapter
  };

})();

