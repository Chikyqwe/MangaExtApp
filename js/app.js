const App = (() => {

  let page = 1;
  let loading = false;
  let scrollEnabled = true;

  let searchMode = false;
  let searchQuery = "";

  let currentView = "library"; 
  // library | manga | reader | search

  let libraryState = {
    page: 1,
    scrollY: 0,
    html: "",
    searchMode: false,
    searchQuery: ""
  };

  document.addEventListener("DOMContentLoaded", () => {
    if (window.cordova) {
      document.addEventListener("deviceready", init, false);
    } else {
      init();
    }
  });

  async function init() {
    const contentEl = document.getElementById("content");
    if (!contentEl) return;

    contentEl.addEventListener("click", e => {
      const card = e.target.closest(".card");
      if (!card) return;

      openManga({ url: card.dataset.url });
    });

    if (typeof CoreHTTP !== "undefined") CoreHTTP.init();

    const saved = localStorage.getItem("libraryState");
    if (saved) {
      libraryState = JSON.parse(saved);
      page = libraryState.page;
      searchMode = libraryState.searchMode || false;
      searchQuery = libraryState.searchQuery || "";
    }

    contentEl.style.display = "grid";

    if (libraryState.html) {
      contentEl.innerHTML = libraryState.html;
      setTimeout(() => window.scrollTo(0, libraryState.scrollY), 0);
    } else {
      loadLibrary(false);
    }

    setupScroll();
    setupSearch();
    setupBackButton();
  }

  /* =======================
     LIBRERÍA
  ======================= */

  async function loadLibrary(append = false) {
    if (loading) return;
    loading = true;

    try {
      const data = await ZonaTMO.loadLibrary(page);
      renderLibrary(data, append);
      currentView = "library";
    } catch (e) {
      console.error(e);
    } finally {
      loading = false;
      saveLibraryState();
    }
  }

  function renderLibrary(items, append) {
    const c = document.getElementById("content");
    if (!append) c.innerHTML = "";

    items.forEach(item => {
      const card = document.createElement("div");
      card.className = "card";
      card.dataset.url = item.url;

      card.innerHTML = `
        <img src="${item.cover || ""}">
        <div class="info">
          <div class="title">${item.title}</div>
          <div class="meta">${item.type || ""} ${item.demography || ""}</div>
        </div>
      `;
      c.appendChild(card);
    });
  }

  /* =======================
     MANGA
  ======================= */

  async function openManga(item) {
    saveLibraryState();
    scrollEnabled = false;
    currentView = "manga";

    const c = document.getElementById("content");
    c.style.display = "block";
    c.innerHTML = "<div class='loader'>Cargando manga...</div>";

    try {
      const data = await ZonaTMO.cargarManga(item.url);
      renderManga(data);
    } catch (e) {
      c.innerHTML = "Error al cargar el manga";
      console.error(e);
    }
  }

  function renderManga(data) {
    const c = document.getElementById("content");

    c.innerHTML = `
      <div class="manga-detail">
        <button class="btn-back">← Volver</button>

        <div class="header-detail">
          <img src="${data.cover}" class="cover-detail">
          <div class="info-detail">
            <h2>${data.title}</h2>
            <p>${data.status}</p>
            <p>${data.chapters.length} capítulos</p>
          </div>
        </div>

        <div class="chapters-container">
          ${data.chapters.map(ch => `
            <div class="chapter-item">
              <div class="chapter-number">${ch.title}</div>
              ${ch.groups.map(g => `
                <div class="group-row">
                  <span>${g.group || "Scan"}</span>
                  <button class="btn-play" data-url="${g.play}">LEER ▶</button>
                </div>
              `).join("")}
            </div>
          `).join("")}
        </div>
      </div>
    `;

    c.querySelector(".btn-back").onclick = back;
    c.querySelectorAll(".btn-play").forEach(btn => {
      btn.onclick = () => openViewer(btn.dataset.url);
    });
  }

  /* =======================
     LECTOR
  ======================= */

function openViewer(url, nextChapter = null) {
  const content = document.getElementById("content");
  const reader = document.getElementById("reader");

  // Ocultar solo contenido y botón de búsqueda
  content.style.display = "none";
  document.getElementById("toggleSearchBtn").style.display = "none";
  document.getElementById("searchBar").classList.remove("active");

  reader.style.display = "block";
  reader.innerHTML = `
    <div class="reader-header">
      <button class="btn-back" id="btnChapters">📖 Capítulos</button>
      <h3 id="chapterTitle">Cargando capítulo...</h3>
    </div>
    <div id="reader-pages"></div>
    <div id="reader-footer" style="margin-top:15px; text-align:center;"></div>
  `;

  MangaView.getChapter(url).then(data => {
    document.getElementById("chapterTitle").textContent = `${data.title} · Cap ${data.chapter}`;

    CascadeReader.init({
      ...data,
      container: "reader-pages",
      onEnd: () => {
        if (data.next) addNextButton(data.next); // next capítulo
      }
    });

    // Botón volver a capítulos del manga
    document.getElementById("btnChapters").onclick = () => {
      // Mostrar contenido y botón búsqueda nuevamente
      content.style.display = "grid";
      document.getElementById("toggleSearchBtn").style.display = "block";
      reader.style.display = "none";
      reader.innerHTML = "";
    };
  });
}

// Crear botón Siguiente capítulo al final del reader
function addNextButton(nextChapterUrl) {
  if (!nextChapterUrl) return;
  const footer = document.getElementById("reader-footer");
  footer.innerHTML = `<button class="btn-play" id="btnNext">▶ Siguiente</button>`;
  document.getElementById("btnNext").onclick = () => {
    openViewer(nextChapterUrl);
  };
}


  function closeReader() {
    currentView = "manga";

    const reader = document.getElementById("reader");
    reader.style.display = "none";
    reader.innerHTML = "";

    const c = document.getElementById("content");
    c.style.display = "block";
  }

  /* =======================
     BUSCADOR
  ======================= */

  function setupSearch() {
    const input = document.getElementById("searchInput");
    const btn = document.getElementById("searchBtn");

    if (!input || !btn) return;

    btn.onclick = () => startSearch(input.value);
    input.onkeydown = e => {
      if (e.key === "Enter") startSearch(input.value);
    };
  }

  async function startSearch(q) {
    q = q.trim();
    if (!q) return;

    saveLibraryState();

    searchMode = true;
    searchQuery = q;
    page = 1;
    currentView = "search";

    const c = document.getElementById("content");
    c.innerHTML = "<div class='loader'>Buscando...</div>";

    loadSearch(false);
  }

  async function loadSearch(append) {
    if (loading) return;
    loading = true;

    try {
      const data = await ZonaTMO.search(searchQuery, page);
      renderLibrary(data.results, append);
    } catch (e) {
      console.error(e);
    } finally {
      loading = false;
    }
  }

  function clearSearch() {
    searchMode = false;
    searchQuery = "";
    page = 1;
    currentView = "library";

    const input = document.getElementById("searchInput");
    if (input) input.value = "";

    loadLibrary(false);
  }

  /* =======================
     SCROLL
  ======================= */

  function setupScroll() {
    window.addEventListener("scroll", () => {
      if (!scrollEnabled || loading) return;

      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 150) {
        page++;
        searchMode ? loadSearch(true) : loadLibrary(true);
      }
    });
  }

  /* =======================
     BACK / ANDROID
  ======================= */

  function setupBackButton() {
    document.addEventListener("backbutton", e => {
      e.preventDefault();
      handleBack();
    }, false);
  }

  function handleBack() {
    if (currentView === "reader") {
      closeReader();
      return;
    }

    if (currentView === "manga") {
      back();
      return;
    }

    if (currentView === "search") {
      clearSearch();
      return;
    }

    // ya en la librería → salir de la app
    if (navigator.app) navigator.app.exitApp();
  }

  function back() {
    scrollEnabled = true;
    currentView = searchMode ? "search" : "library";

    const c = document.getElementById("content");
    c.style.display = "grid";
    c.innerHTML = libraryState.html;

    setTimeout(() => window.scrollTo(0, libraryState.scrollY), 0);
  }

  function saveLibraryState() {
    const c = document.getElementById("content");
    if (!c) return;

    libraryState.page = page;
    libraryState.scrollY = window.scrollY;
    libraryState.html = c.innerHTML;
    libraryState.searchMode = searchMode;
    libraryState.searchQuery = searchQuery;

    localStorage.setItem("libraryState", JSON.stringify(libraryState));
  }

  return {
    back,
    closeReader
  };

})();
