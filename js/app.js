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
    console.log(data);
    const c = document.getElementById("content");

    c.innerHTML = `
      <div style="grid-column:1/-1">
        <button onclick="App.back()">⬅ Volver</button>

        <div style="display:flex;gap:10px;margin:10px 0">
          <img src="${data.cover}" style="width:120px;border-radius:6px">
          <h2>${data.title}</h2>
        </div>

        <h3>Capítulos</h3>
        <div id="chapters"></div>
      </div>
    `;

    const list = document.getElementById("chapters");

    data.chapters.forEach(ch => {
      const d = document.createElement("div");
      d.style.borderBottom = "1px solid #333";
      d.style.padding = "6px 0";

      d.innerHTML = `
        <strong>${ch.title}</strong>
        ${ch.groups.map(g => `
          <div style="display:flex;justify-content:space-between">
            <span>${g.group || ''} ${g.date || ''}</span>
            <button onclick="window.open('${g.play}','_system')">▶</button>
          </div>
        `).join("")}
      `;

      list.appendChild(d);
    });
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
