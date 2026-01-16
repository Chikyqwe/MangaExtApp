const App = (() => {

  let currentPage = 1;
  let loading = false;

  document.addEventListener("deviceready", init, false);

  async function init() {
    try {
      CoreHTTP.init();
      await loadPage(currentPage);
      setupScroll();
    } catch (err) {
      console.error("Error init:", err);
    }
  }

  async function loadPage(page) {
    if (loading) return;
    loading = true;

    showLoader(true);

    try {
      const data = await ZonaTMO.cargarLibrary(page);
      render(data, page > 1);
    } catch (e) {
      console.error("Error cargando página:", e);
    }

    showLoader(false);
    loading = false;
  }

  function render(items, append = false) {
    const container = document.getElementById("content");

    if (!append) container.innerHTML = "";

    items.forEach(item => {
      const card = document.createElement("div");
      card.className = "card";

      card.innerHTML = `
        <img src="${item.cover || ''}">
        <div class="info">
          <div class="title">${item.title || 'Sin título'}</div>
          <div class="meta">
            ${item.type || ''}${item.demography ? ' • ' + item.demography : ''}
          </div>
        </div>
      `;

      card.addEventListener("click", () => {
        window.open(item.url, "_system");
      });

      container.appendChild(card);
    });
  }

  function setupScroll() {
    window.addEventListener("scroll", () => {
      const scrollBottom =
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 150;

      if (scrollBottom) {
        currentPage++;
        loadPage(currentPage);
      }
    });
  }

  function showLoader(state) {
    let loader = document.getElementById("loader");

    if (!loader) {
      loader = document.createElement("div");
      loader.id = "loader";
      loader.style.textAlign = "center";
      loader.style.padding = "15px";
      loader.style.opacity = "0.7";
      loader.innerText = "Cargando...";
      document.body.appendChild(loader);
    }

    loader.style.display = state ? "block" : "none";
  }

  return {
    reload() {
      currentPage = 1;
      loadPage(currentPage);
    }
  };

})();
