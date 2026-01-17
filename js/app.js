const App = (() => {

  let page = 1;
  let loading = false;
  let scrollEnabled = true;

  // 🧠 Estado persistente de la librería
  let libraryState = {
    page: 1,
    scrollY: 0,
    html: ""
  };

  document.addEventListener("deviceready", init);
  document.getElementById("content").addEventListener("click", e => {
    const card = e.target.closest(".card");
    if (!card) return;

    openManga({
      url: card.dataset.url
    });
  });

  async function init() {
    CoreHTTP.init();

    const saved = localStorage.getItem("libraryState");
    if (saved) {
      libraryState = JSON.parse(saved);
      page = libraryState.page;
    }

    const c = document.getElementById("content");
    c.style.display = "grid";

    if (libraryState.html) {
      c.innerHTML = libraryState.html;

      setTimeout(() => {
        window.scrollTo(0, libraryState.scrollY);
      }, 0);
    } else {
      page = 1;
      loadLibrary(false);
    }

    setupScroll();
  }

  async function loadLibrary(append = false) {
    if (loading) return;
    loading = true;

    const data = await ZonaTMO.loadLibrary(page);
    renderLibrary(data, append);

    loading = false;

    // Guardar estado cada carga
    saveLibraryState();
  }

  function renderLibrary(items, append) {
    const c = document.getElementById("content");
    if (!append) c.innerHTML = "";

    items.forEach(item => {
      const card = document.createElement("div");
      card.className = "card";
      card.dataset.url = item.url;

      card.innerHTML = `
        <img src="${item.cover || ''}">
        <div class="info">
          <div class="title">${item.title}</div>
          <div class="meta">${item.type || ''} ${item.demography || ''}</div>
        </div>
      `;

      c.appendChild(card);
    });
  }

  async function openManga(item) {
    // 🔐 Guardar estado antes de navegar
    saveLibraryState();

    scrollEnabled = false;

    const c = document.getElementById("content");
    c.style.display = "block";
    c.innerHTML = "Cargando...";

    const data = await ZonaTMO.cargarManga(item.url);
    renderManga(data);
  }

  function renderManga(data) {
    const c = document.getElementById("content");

    c.innerHTML = `
      <div class="manga-detail">
        <button class="btn-back" onclick="App.back()">← Volver a la biblioteca</button>

        <div class="header-detail">
          <img src="${data.cover}" class="cover-detail">
          <div class="info-detail">
            <h2>${data.title}</h2>
            <p>${data.chapters.length} Capítulos encontrados</p>
          </div>
        </div>

        <div class="chapters-container">
          ${data.chapters.map(ch => `
            <div class="chapter-item">
              <div class="chapter-number">${ch.title}</div>
              <div class="groups-list">
                ${ch.groups.map(g => `
                  <div class="group-row">
                    <span class="group-name">${g.group || 'Scanlator'}</span>
                    <button class="btn-play"
                      onclick="App.openViewer('${g.play}')">
                      LEER ▶
                    </button>
                  </div>
                `).join("")}
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  function openViewer(url) {
    MangaView.getChapter(url).then(data => {

      // Ocultar contenido principal
      document.getElementById("content").style.display = "none";

      // Mostrar lector
      const reader = document.getElementById("reader");
      reader.style.display = "block";
      reader.innerHTML = `
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
    });
  }


  function setupScroll() {
    window.addEventListener("scroll", () => {
      if (!scrollEnabled || loading) return;

      if (window.innerHeight + window.scrollY >=
          document.body.offsetHeight - 150) {
        page++;
        loadLibrary(true);
      }
    });
  }

  function saveLibraryState() {
    const c = document.getElementById("content");

    libraryState.page = page;
    libraryState.scrollY = window.scrollY;
    libraryState.html = c.innerHTML;

    localStorage.setItem(
      "libraryState",
      JSON.stringify(libraryState)
    );
  }

  function back() {
    scrollEnabled = true;
    loading = false;

    page = libraryState.page;

    const c = document.getElementById("content");
    c.style.display = "grid";
    c.innerHTML = libraryState.html;

    setTimeout(() => {
      window.scrollTo(0, libraryState.scrollY);
    }, 0);
  }
  function closeReader() {
    document.getElementById("reader").style.display = "none";
    document.getElementById("reader").innerHTML = "";

    const content = document.getElementById("content");
    content.style.display = "block";
  }

  return {
    back,
    closeReader,
    openViewer
  };

})();
