const App = (() => {

  let page = 1;
  let loading = false;

  document.addEventListener("deviceready", init);

  async function init() {
    CoreHTTP.init();
    loadLibrary();
    setupScroll();
  }

  async function loadLibrary(append = false) {
    if (loading) return;
    loading = true;

    const data = await ZonaTMO.cargarLibrary(page);
    renderLibrary(data, append);

    loading = false;
  }

  function renderLibrary(items, append) {
    const c = document.getElementById("content");
    if (!append) c.innerHTML = "";

    items.forEach(item => {
      const card = document.createElement("div");
      card.className = "card";

      card.innerHTML = `
        <img src="${item.cover || ''}">
        <div class="info">
          <div class="title">${item.title}</div>
          <div class="meta">${item.type || ''} ${item.demography || ''}</div>
        </div>
      `;

      card.onclick = () => openManga(item);
      c.appendChild(card);
    });
  }

  async function openManga(item) {
    const c = document.getElementById("content");
    c.innerHTML = "Cargando...";

    const data = await ZonaTMO.cargarManga(item.url);
    renderManga(data);
  }

  function renderManga(data) {
      const c = document.getElementById("content");
      // Cambiamos el display de grid a block para la vista de detalles
      c.style.display = "block"; 

      c.innerHTML = `
        <div class="manga-detail">
          <button class="btn-back" onclick="App.init()">← Volver a la biblioteca</button>
          
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
                      <button class="btn-play" onclick="window.open('${g.play}','_system')">LEER ▶</button>
                    </div>
                  `).join("")}
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      `;
  }
  function setupScroll() {
    window.addEventListener("scroll", () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 150) {
        page++;
        loadLibrary(true);
      }
    });
  }

  function back() {
    page = 1;
    loadLibrary(false);
  }

  return { back };

})();
