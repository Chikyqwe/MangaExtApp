// core/reader.js
const Reader = (() => {
  let containerId = "reader-pages";
  let readerEl;
  let currentChapter = null;
  let onCloseCallback = null;

  function init(options) {
    const { container, chapterData, onClose } = options;
    containerId = container || containerId;
    currentChapter = chapterData;
    onCloseCallback = onClose || null;

    readerEl = document.getElementById("reader");
    if (!readerEl) return;

    readerEl.style.display = "block";
    document.getElementById("content").style.display = "none";

    renderChapter(chapterData);
  }

  function renderChapter(data) {
    if (!readerEl) return;

    readerEl.innerHTML = `
      <div class="reader-header">
        <button class="btn-back">← Volver</button>
        <h3>${data.title} · Cap ${data.chapter}</h3>
      </div>
      <div id="${containerId}"></div>
    `;

    readerEl.querySelector(".btn-back").onclick = close;

    // Inicializar tu lector en cascada
    CascadeReader.init({
      ...data,
      container: containerId
    });
  }

  function close() {
    if (!readerEl) return;

    readerEl.style.display = "none";
    readerEl.innerHTML = "";

    const contentEl = document.getElementById("content");
    if (contentEl) contentEl.style.display = "block";

    if (onCloseCallback) onCloseCallback();
  }

  return { init, close };
})();

const CascadeReader = (() => {

  let pages = [];
  let index = 0;
  let observer = null;
  let referer = "https://zonatmo.com/";

  // ---- control de descargas ----
  let downloadQueue = [];
  let downloading = false;
  const PRELOAD_AHEAD = 1; // cuántas páginas adelantar

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
    loadNext(); // primera página
  }

  // ---- crea una página vacía ----
  function loadNext() {
    if (index >= pages.length) return;

    const reader = document.getElementById("reader");

    const page = document.createElement("div");
    page.className = "page loading";

    const img = document.createElement("img");
    img.dataset.src = pages[index];
    img.loading = "lazy";

    page.appendChild(img);
    reader.appendChild(page);

    observer.observe(page);
    index++;
  }

  // ---- cola de descarga ----
  function enqueueDownload(img) {
    if (img.dataset.downloading || img.src) return;

    img.dataset.downloading = "1";
    downloadQueue.push(img);
    processQueue();
  }

  // ---- worker (1 descarga a la vez) ----
  async function processQueue() {
    if (downloading || downloadQueue.length === 0) return;

    downloading = true;
    const img = downloadQueue.shift();

    try {
      const localUrl = await downloadImage(img.dataset.src, referer);
      img.src = localUrl.nativeURL;

      img.onload = () => {
        img.closest(".page")?.classList.remove("loading");
      };

    } catch (e) {
      console.error("IMG DOWNLOAD ERROR", e);
    }

    downloading = false;
    processQueue();
  }

  // ---- descarga real ----
  function downloadImage(url, referer) {
    return new Promise((resolve, reject) => {
      const fileName = "img_" + Date.now() + ".webp";
      const filePath = cordova.file.cacheDirectory + fileName;

      cordova.plugin.http.downloadFile(
        url,
        {},
        {
          "Referer": referer,
          "User-Agent":
            "Mozilla/5.0 (Linux; Android 11) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36",
          "Accept": "image/webp,image/*,*/*"
        },
        filePath,
        entry => resolve(entry),
        err => reject(err)
      );
    });
  }

  // ---- observer lectura + preload ----
  function createObserver() {
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const img = entry.target.querySelector("img");
        if (!img || img.src) return;

        // página actual
        enqueueDownload(img);

        // preload siguiente
        const pagesEls = document.querySelectorAll(".page");
        for (let i = 1; i <= PRELOAD_AHEAD; i++) {
          const nextPage = pagesEls[index - 1 + i];
          const nextImg = nextPage?.querySelector("img");
          if (nextImg) enqueueDownload(nextImg);
        }

        observer.unobserve(entry.target);
        loadNext(); // crea SOLO la siguiente
      });
    }, {
      rootMargin: "150px"
    });
  }

  return { init };
})();