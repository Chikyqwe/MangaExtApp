const App = (() => {

  /* ==========================
     ESTADO GLOBAL
  ========================== */

  const state = {
    library: {
      page: 1,
      scrollY: 0,
      items: [],
      loading: false,
      enabled: true
    },
    view: "library" // library | manga | reader
  };

  const content = () => document.getElementById("content");
  const reader  = () => document.getElementById("reader");

  /* ==========================
     INIT
  ========================== */

  document.addEventListener("deviceready", init);

  async function init() {
    CoreHTTP.init();
    restoreState();
    setupEvents();

    if (state.library.items.length) {
      renderLibrary();
      restoreScroll();
    } else {
      await loadLibrary();
    }
  }

  /* ==========================
     ESTADO PERSISTENTE
  ========================== */

  function saveState() {
    localStorage.setItem("appState", JSON.stringify({
      library: {
        page: state.library.page,
        scrollY: window.scrollY,
        items: state.library.items
      }
    }));
  }

  function restoreState() {
    const saved = localStorage.getItem("appState");
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);
      Object.assign(state.library, parsed.library || {});
    } catch (e) {
      console.warn("Estado corrupto, reiniciando");
      localStorage.removeItem("appState");
    }
  }

  function restoreScroll() {
    requestAnimationFrame(() => {
      window.scrollTo(0, state.library.scrollY || 0);
    });
  }

  /* ==========================
     EVENTOS
  ========================== */

  function setupEvents() {

    /* Clicks (Event Delegation) */
    content().addEventListener("click", e => {

      const card = e.target.closest(".card");
      if (card) {
        openManga(card.dataset.url);
        return;
      }

      const play = e.target.closest(".btn-play");
      if (play) {
        openViewer(play.dataset.url);
        return;
      }

      const back = e.target.closest(".btn-back");
      if (back) {
        backToLibrary();
        return;
      }
    });

    /* Scroll infinito */
    window.addEventListener("scroll", onScroll);
  }

  function onScroll() {
    if (
      !state.library.enabled ||
      state.library.loading ||
      state.view !== "library"
    ) return;

    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
      loadLibrary(true);
    }
  }

  /* ==========================
     LIBRARY
  ========================== */

  async function loadLibrary(append = false) {
    if (state.library.loading) return;

    state.library.loading = true;

    try {
      const data = await ZonaTMO.loadLibrary(state.library.page);

      if (!append) state.library.items = [];
      state.library.items.push(...data);
      state.library.page++;

      renderLibrary();
      saveState();

    } catch (e) {
      console.error("Error cargando librería", e);
    } finally {
      state.library.loading = false;
    }
  }

  function renderLibrary() {
    const c = content();
    c.style.display = "grid";

    c.innerHTML = state.library.items.map(item => `
      <div class="card" data-url="${item.url}">
        <img src="${item.cover || ""}">
        <div class="info">
          <div class="title">${item.title}</div>
          <div class="meta">${item.type || ""} ${item.demography || ""}</div>
        </div>
      </div>
    `).join("");
  }

  /* ==========================
     MANGA
  ========================== */

  async function openManga(url) {
    saveState();

    state.view = "manga";
    state.library.enabled = false;

    const c = content();
    c.style.display = "block";
    c.innerHTML = "Cargando...";

    try {
      const data = await ZonaTMO.cargarManga(url);
      renderManga(data);
    } catch (e) {
      c.innerHTML = "Error cargando manga";
    }
  }

  function renderManga(data) {
    content().innerHTML = `
      <div class="manga-detail">

        <button class="btn-back">← Volver</button>

        <div class="header-detail">
          <img src="${data.cover}">
          <div>
            <h2>${data.title}</h2>
            <p>${data.chapters.length} capítulos</p>
          </div>
        </div>

        <div class="chapters">
          ${data.chapters.map(ch => `
            <div class="chapter">
              <div class="chapter-title">${ch.title}</div>
              ${ch.groups.map(g => `
                <button class="btn-play" data-url="${g.play}">
                  LEER ▶ ${g.group || ""}
                </button>
              `).join("")}
            </div>
          `).join("")}
        </div>

      </div>
    `;
  }

  function backToLibrary() {
    state.view = "library";
    state.library.enabled = true;

    renderLibrary();
    restoreScroll();
  }

  /* ==========================
     READER
  ========================== */

  async function openViewer(url) {
    state.view = "reader";

    content().style.display = "none";
    reader().style.display = "block";

    const data = await MangaView.getChapter(url);

    reader().innerHTML = `
      <div class="reader-header">
        <button onclick="App.closeReader()">← Volver</button>
        <h3>${data.title} · Cap ${data.chapter}</h3>
      </div>
      <div id="reader-pages"></div>
    `;

    CascadeReader.init({
      ...data,
      container: "reader-pages"
    });
  }

  function closeReader() {
    reader().style.display = "none";
    reader().innerHTML = "";

    content().style.display = "block";
    state.view = "manga";
  }

  /* ==========================
     API PUBLICA
  ========================== */

  return {
    closeReader
  };

})();
