const App = (() => {
  // Estado
  let state = {
    view: 'library', // library, manga, search
    page: 1,
    loading: false,
    query: '',
    scrollEnabled: true,
    libraryCache: ''
  };

  // Selectores
  const contentEl = document.getElementById("content");
  const searchBar = document.getElementById("searchBar");
  const searchInput = document.getElementById("searchInput");
  const toggleSearchBtn = document.getElementById("toggleSearchBtn");

  const init = () => {
    setupEventListeners();
    loadLibrary();
    setupInfiniteScroll();
  };

  const setupEventListeners = () => {
    // Toggle Búsqueda
    toggleSearchBtn.onclick = () => {
      searchBar.classList.toggle('active');
      if(searchBar.classList.contains('active')) searchInput.focus();
    };

    // Búsqueda
    document.getElementById("searchBtn").onclick = () => startSearch();
    searchInput.onkeypress = (e) => e.key === 'Enter' && startSearch();
    
    // Logo (Volver al inicio)
    document.getElementById("logoHome").onclick = () => {
      state.query = '';
      state.page = 1;
      loadLibrary();
    };

    // Delegación de eventos para cards
    contentEl.onclick = (e) => {
      const card = e.target.closest(".manga-card");
      if (card) openManga(card.dataset.url);
    };
  };

  const renderCard = (item) => `
    <div class="manga-card group relative bg-[#161616] rounded-xl overflow-hidden border border-white/5 cursor-pointer hover:border-sky-500/50 transition-all duration-300" data-url="${item.url}">
      <div class="aspect-[3/4] overflow-hidden">
        <img src="${item.cover}" loading="lazy" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
      </div>
      <div class="absolute inset-0 card-gradient flex flex-col justify-end p-3">
        <span class="text-[10px] uppercase font-bold text-sky-400 mb-1">${item.type || 'Manga'}</span>
        <h3 class="text-sm font-semibold line-clamp-2 leading-tight">${item.title}</h3>
      </div>
    </div>
  `;

  async function loadLibrary(append = false) {
    if (state.loading) return;
    state.loading = true;
    
    if (!append) {
      contentEl.innerHTML = '<div class="col-span-full py-20 text-center text-gray-500"><i class="bi bi-arrow-repeat animate-spin text-4xl"></i></div>';
      window.scrollTo(0, 0);
    }

    try {
      const data = await ZonaTMO.loadLibrary(state.page);
      const html = data.map(renderCard).join('');
      
      if (!append) {
        contentEl.className = "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4";
        contentEl.innerHTML = html;
      } else {
        contentEl.insertAdjacentHTML('beforeend', html);
      }
      state.view = 'library';
    } catch (e) {
      contentEl.innerHTML = `<div class="text-center p-10">Error de conexión</div>`;
    } finally {
      state.loading = false;
    }
  }

  async function startSearch() {
    const q = searchInput.value.trim();
    if (!q) return;

    state.query = q;
    state.page = 1;
    state.view = 'search';
    state.loading = true;
    
    contentEl.innerHTML = '<div class="col-span-full text-center py-20">Buscando...</div>';
    searchBar.classList.remove('active');

    try {
      const data = await ZonaTMO.search(q, state.page);
      contentEl.innerHTML = data.results.map(renderCard).join('');
    } catch (e) {
      console.error(e);
    } finally {
      state.loading = false;
    }
  }

  async function openManga(url) {
    state.scrollEnabled = false;
    contentEl.innerHTML = '<div class="py-20 text-center">Cargando detalles...</div>';
    
    try {
      const data = await ZonaTMO.cargarManga(url);
      renderMangaDetail(data);
    } catch (e) {
      contentEl.innerHTML = 'Error al cargar';
    }
  }

  function renderMangaDetail(data) {
    contentEl.className = "max-w-4xl mx-auto";
    contentEl.innerHTML = `
      <button onclick="App.backToLibrary()" class="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
        <i class="bi bi-arrow-left"></i> Volver a la biblioteca
      </button>
      
      <div class="flex flex-col md:flex-row gap-8 mb-10">
        <img src="${data.cover}" class="w-48 rounded-2xl shadow-2xl shadow-sky-500/10 self-center md:self-start">
        <div class="flex-1 text-center md:text-left">
          <h2 class="text-3xl font-bold mb-2">${data.title}</h2>
          <div class="flex flex-wrap gap-2 justify-center md:justify-start mb-4">
            <span class="px-3 py-1 bg-sky-500/20 text-sky-400 rounded-full text-xs font-bold uppercase">${data.status}</span>
          </div>
          <p class="text-gray-400 text-sm leading-relaxed">${data.description || 'Sin descripción disponible.'}</p>
        </div>
      </div>

      <div class="space-y-3">
        <h3 class="text-xl font-bold mb-4 flex items-center gap-2">
          <i class="bi bi-layers text-sky-500"></i> Capítulos
        </h3>
        ${data.chapters.map(ch => `
          <div class="bg-[#161616] border border-white/5 rounded-xl p-4 flex flex-col gap-3">
            <div class="font-semibold text-sky-400">${ch.title}</div>
            <div class="flex flex-wrap gap-2">
              ${ch.groups.map(g => `
                <button onclick="App.openViewer('${g.play}')" class="flex-1 md:flex-none flex items-center justify-between gap-4 bg-white/5 hover:bg-sky-600 transition-all px-4 py-2 rounded-lg text-xs font-bold">
                  <span>${g.group}</span>
                  <i class="bi bi-play-fill text-lg"></i>
                </button>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  const setupInfiniteScroll = () => {
    window.onscroll = () => {
      if (!state.scrollEnabled || state.loading || state.view !== 'library') return;
      if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 800) {
        state.page++;
        loadLibrary(true);
      }
    };
  };

  return {
    backToLibrary: () => {
      state.page = 1;
      state.scrollEnabled = true;
      loadLibrary();
    },
    openViewer: (url) => {
      MangaView.getChapter(url).then(data => {
        document.getElementById("reader-title").innerText = data.title;
        Reader.init({
          chapterData: data,
          container: "reader-pages"
        });
      });
    },
    closeReader: () => {
      document.getElementById("reader").classList.add("hidden");
      document.body.classList.remove("overflow-hidden");
    }
  };
})();

document.addEventListener("DOMContentLoaded", App.init);
