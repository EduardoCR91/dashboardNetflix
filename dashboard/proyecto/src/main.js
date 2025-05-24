// main.js - StreamFlix con integración completa
import { supabase } from "./supabase.js";
import { mostrarLogin } from "./login.js";

// Importación dinámica de funciones que pueden no estar disponibles inmediatamente
let mostrarDatos, mostrarRegistro;

// Cargar las funciones dinámicamente
async function cargarModulos() {
  try {
    const usuarioModule = await import('./usuario.js');
    mostrarDatos = usuarioModule.mostrarDatos;
    
    const registroModule = await import('./registro.js');
    mostrarRegistro = registroModule.mostrarRegistro;
    
    // Exponer globalmente una vez cargadas
    window.mostrarDatos = mostrarDatos;
    window.mostrarRegistro = mostrarRegistro;
  } catch (error) {
    console.error('Error cargando módulos:', error);
  }
}

// Cargar módulos al inicio
cargarModulos();

// ==========================================
// FUNCIONES WRAPPER SEGURAS
// ==========================================

// Función segura para mostrar datos de usuario
async function mostrarDatosSeguro() {
  try {
    // Verificar que hay una sesión activa
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      mostrarNotificacion('No hay sesión activa', 'error');
      mostrarLoginCompleto();
      return;
    }
    
    // Verificar que el usuario existe en la tabla, si no, crearlo
    const perfilExiste = await crearPerfilSiFalta(user);
    
    if (!perfilExiste) {
      mostrarNotificacion('Error accediendo al perfil', 'error');
      return;
    }
    
    // Ahora mostrar los datos
    if (typeof mostrarDatos === 'function') {
      await mostrarDatos();
    } else {
      // Si no está cargada, cargar dinámicamente
      const { mostrarDatos: datos } = await import('./usuario.js');
      await datos();
    }
  } catch (error) {
    console.error('Error mostrando datos de usuario:', error);
    mostrarNotificacion('Error cargando perfil de usuario', 'error');
    
    // Si hay error, ofrecer ir al registro
    setTimeout(() => {
      if (confirm('¿Quieres completar tu registro?')) {
        mostrarRegistroSeguro();
      }
    }, 1000);
  }
}

// Función segura para mostrar registro
async function mostrarRegistroSeguro() {
  try {
    if (typeof mostrarRegistro === 'function') {
      mostrarRegistro();
    } else {
      // Si no está cargada, cargar dinámicamente
      const { mostrarRegistro: registro } = await import('./registro.js');
      registro();
    }
  } catch (error) {
    console.error('Error mostrando registro:', error);
    mostrarNotificacion('Error cargando registro', 'error');
  }
}

// Variables globales para la aplicación de streaming
let peliculasData = [];
let seriesData = [];
let documentalesData = [];
let miLista = [];
let historialVisto = [];
let currentUser = null;
let contenidoActual = null;

// APIs gratuitas para contenido multimedia
const UNSPLASH_ACCESS_KEY = 'demo'; // Reemplaza con tu clave de Unsplash
const PEXELS_API_KEY = 'demo'; // Reemplaza con tu clave de Pexels
const TMDB_API_KEY = 'demo'; // Reemplaza con tu clave de TMDB

// URLs base para las APIs
const UNSPLASH_BASE_URL = 'https://api.unsplash.com';
const PEXELS_BASE_URL = 'https://api.pexels.com/v1';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

// Contenido de respaldo en caso de que las APIs no funcionen
const CONTENIDO_RESPALDO = {
  peliculas: [
    {
      id: 1,
      titulo: "Acción Extrema",
      descripcion: "Una película llena de adrenalina y secuencias de acción espectaculares.",
      imagen: "https://images.unsplash.com/photo-1489599162946-648913ad7e84?w=500&h=750&fit=crop",
      video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      tipo: "pelicula",
      genero: "Acción",
      año: 2024,
      rating: 4.5
    },
    {
      id: 2,
      titulo: "Drama Familiar",
      descripcion: "Una conmovedora historia sobre los lazos familiares y el perdón.",
      imagen: "https://images.unsplash.com/photo-1518929458119-e5bf444c30f4?w=500&h=750&fit=crop",
      video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      tipo: "pelicula",
      genero: "Drama",
      año: 2024,
      rating: 4.2
    },
    {
      id: 3,
      titulo: "Sci-Fi Futuro",
      descripcion: "Una visión futurista de la humanidad y la tecnología.",
      imagen: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=500&h=750&fit=crop",
      video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      tipo: "pelicula",
      genero: "Sci-Fi",
      año: 2024,
      rating: 4.7
    },
    {
      id: 4,
      titulo: "Comedia Romántica",
      descripcion: "Una divertida historia de amor con momentos inolvidables.",
      imagen: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=500&h=750&fit=crop",
      video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
      tipo: "pelicula",
      genero: "Romance",
      año: 2024,
      rating: 4.0
    }
  ],
  series: [
    {
      id: 5,
      titulo: "La Corona Digital",
      descripcion: "Una serie que explora el poder en la era digital.",
      imagen: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=500&h=750&fit=crop",
      video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
      tipo: "serie",
      genero: "Drama",
      año: 2024,
      rating: 4.6,
      temporadas: 3
    },
    {
      id: 6,
      titulo: "Misterios Urbanos",
      descripcion: "Casos sin resolver en las grandes ciudades.",
      imagen: "https://images.unsplash.com/photo-1505820013142-f86a3439c5b2?w=500&h=750&fit=crop",
      video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
      tipo: "serie",
      genero: "Misterio",
      año: 2024,
      rating: 4.3,
      temporadas: 2
    }
  ],
  documentales: [
    {
      id: 7,
      titulo: "Océanos Profundos",
      descripcion: "Explorando las profundidades marinas y sus secretos.",
      imagen: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=500&h=750&fit=crop",
      video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
      tipo: "documental",
      genero: "Naturaleza",
      año: 2024,
      rating: 4.8
    },
    {
      id: 8,
      titulo: "Civilizaciones Perdidas",
      descripcion: "Culturas antiguas y sus misterios sin resolver.",
      imagen: "https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?w=500&h=750&fit=crop",
      video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
      tipo: "documental",
      genero: "Historia",
      año: 2024,
      rating: 4.5
    }
  ]
};

document.addEventListener('DOMContentLoaded', async () => {
  const user = await validarSesion();
  if (!user) {
    // Usuario no logueado - mostrar interfaz pública
    console.log('Usuario no logueado - mostrando contenido público');
    currentUser = null;
    General(); // Cargar la página principal (modo público)
    document.querySelector(".c-nav").innerHTML = `
      <button class="c-nav-item" onclick="General()">🏠 Home</button>
      <button class="c-nav-item" onclick="mostrarPeliculas()">🎬 Películas</button>
      <button class="c-nav-item" onclick="mostrarSeries()">📺 Series</button>
      <button class="c-nav-item" onclick="mostrarDocumentales()">📚 Documentales</button>
      <button class="c-nav-item" onclick="mostrarMiLista()">📋 Mi Lista</button>
      <button class="c-nav-item" onclick="mostrarRegistroSeguro()">👤 Registrarse</button>
    `
  } else {
    console.log('Usuario logueado:', user.email);
    currentUser = user;
    await cargarDatosUsuario();
    General(); // Cargar la página principal
    document.querySelector(".c-nav").innerHTML = `
      <button class="c-nav-item" onclick="General()">🏠 Home</button>
      <button class="c-nav-item" onclick="mostrarPeliculas()">🎬 Películas</button>
      <button class="c-nav-item" onclick="mostrarSeries()">📺 Series</button>
      <button class="c-nav-item" onclick="mostrarDocumentales()">📚 Documentales</button>
      <button class="c-nav-item" onclick="mostrarMiLista()">📋 Mi Lista</button>
      <button class="c-nav-item" onclick="window.mostrarDatos()">👤 Usuario</button>
    `
  }
});

async function validarSesion() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user || null;
}

// ==========================================
// CARGAR DATOS DEL USUARIO DESDE SUPABASE
// ==========================================
async function cargarDatosUsuario() {
  try {
    // Cargar Mi Lista del usuario
    const { data: miListaData, error: listaError } = await supabase
      .from('mi_lista')
      .select('contenido_id, tipo_contenido, titulo, poster_url')
      .eq('user_id', currentUser.id);
    
    if (listaError) throw listaError;
    miLista = miListaData || [];

    // Cargar historial de visualización
    const { data: historialData, error: historialError } = await supabase
      .from('historial_visto')
      .select('contenido_id, tipo_contenido, progreso, fecha_visto, titulo, poster_url')
      .eq('user_id', currentUser.id)
      .order('fecha_visto', { ascending: false });
    
    if (historialError) throw historialError;
    historialVisto = historialData || [];

  } catch (error) {
    console.error('Error cargando datos del usuario:', error);
  }
}

// ==========================================
// FUNCIÓN GENERAL - PÁGINA PRINCIPAL
// ==========================================
async function General() {
  const app = document.getElementById('app');
  
  app.innerHTML = `
    <div class="home-container">
      <!-- Hero Section -->
      <section class="hero-section" id="hero-section">
        <div class="hero-content">
          <h1 class="hero-title" id="hero-title">Bienvenido a StreamFlix</h1>
          <p class="hero-description" id="hero-description">Descubre el mejor contenido de entretenimiento</p>
          <div class="hero-buttons">
            <button class="btn btn-play" onclick="reproducirContenido(1)">
              ▶️ Ver ahora
            </button>
            <button class="btn btn-info" onclick="mostrarDetallesContenido(1, 'pelicula')">
              ℹ️ Más información
            </button>
          </div>
        </div>
        <div class="hero-image">
          <img id="hero-poster" src="" alt="Contenido destacado" />
        </div>
      </section>

      <!-- Secciones de contenido -->
      <div class="content-sections">
        <!-- Continuar viendo -->
        ${historialVisto.length > 0 ? `
        <section class="content-row">
          <h2 class="section-title">📺 Continuar viendo</h2>
          <div id="continuar-viendo" class="movies-carousel">
            <div class="loading">Cargando...</div>
          </div>
        </section>
        ` : ''}

        <!-- Películas destacadas -->
        <section class="content-row">
          <h2 class="section-title">🎬 Películas destacadas</h2>
          <div id="peliculas-destacadas" class="movies-carousel">
            <div class="loading">Cargando películas...</div>
          </div>
        </section>

        <!-- Series populares -->
        <section class="content-row">
          <h2 class="section-title">📺 Series populares</h2>
          <div id="series-populares" class="movies-carousel">
            <div class="loading">Cargando series...</div>
          </div>
        </section>

        <!-- Documentales -->
        <section class="content-row">
          <h2 class="section-title">📚 Documentales</h2>
          <div id="documentales-destacados" class="movies-carousel">
            <div class="loading">Cargando documentales...</div>
          </div>
        </section>

        <!-- Acción -->
        <section class="content-row">
          <h2 class="section-title">💥 Acción y aventura</h2>
          <div id="accion-aventura" class="movies-carousel">
            <div class="loading">Cargando...</div>
          </div>
        </section>
      </div>
    </div>
  `;

  // Cargar contenido para cada sección
  await cargarHeroPrincipal();
  
  if (historialVisto.length > 0) {
    await cargarContinuarViendo();
  }
  
  await cargarPeliculasDestacadas();
  await cargarSeriesPopulares();
  await cargarDocumentalesDestacados();
  await cargarAccionAventura();
}

// ==========================================
// FUNCIÓN MOSTRAR PELÍCULAS
// ==========================================
async function mostrarPeliculas() {
  const app = document.getElementById('app');
  
  app.innerHTML = `
    <div class="movies-container">
      <header class="page-header">
        <h1>🎬 Películas</h1>
        <div class="filters">
          <select id="genero-filter" onchange="filtrarPeliculas()">
            <option value="">Todos los géneros</option>
            <option value="accion">Acción</option>
            <option value="comedia">Comedia</option>
            <option value="drama">Drama</option>
            <option value="terror">Terror</option>
            <option value="sci-fi">Ciencia ficción</option>
            <option value="romance">Romance</option>
            <option value="thriller">Thriller</option>
          </select>
          <select id="año-filter" onchange="filtrarPeliculas()">
            <option value="">Todos los años</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
            <option value="2022">2022</option>
            <option value="2021">2021</option>
          </select>
          <input type="text" id="buscar-peliculas" placeholder="Buscar películas..." 
                 oninput="buscarContenido(this.value, 'pelicula')" />
        </div>
      </header>

      <div class="content-grid">
        <section class="grid-section">
          <h2>🔥 Todas las películas</h2>
          <div id="grid-peliculas" class="content-grid-items">
            <div class="loading">Cargando películas...</div>
          </div>
        </section>
      </div>
    </div>
  `;

  await cargarGridPeliculas();
}

// ==========================================
// FUNCIÓN MOSTRAR SERIES
// ==========================================
async function mostrarSeries() {
  const app = document.getElementById('app');
  
  app.innerHTML = `
    <div class="series-container">
      <header class="page-header">
        <h1>📺 Series</h1>
        <div class="filters">
          <select id="genero-series-filter" onchange="filtrarSeries()">
            <option value="">Todos los géneros</option>
            <option value="drama">Drama</option>
            <option value="comedia">Comedia</option>
            <option value="misterio">Misterio</option>
            <option value="thriller">Thriller</option>
            <option value="sci-fi">Sci-Fi</option>
            <option value="accion">Acción</option>
          </select>
          <input type="text" id="buscar-series" placeholder="Buscar series..." 
                 oninput="buscarContenido(this.value, 'serie')" />
        </div>
      </header>

      <div class="content-grid">
        <section class="grid-section">
          <h2>📺 Todas las series</h2>
          <div id="grid-series" class="content-grid-items">
            <div class="loading">Cargando series...</div>
          </div>
        </section>
      </div>
    </div>
  `;

  await cargarGridSeries();
}

// ==========================================
// FUNCIÓN MOSTRAR DOCUMENTALES
// ==========================================
async function mostrarDocumentales() {
  const app = document.getElementById('app');
  
  app.innerHTML = `
    <div class="documentales-container">
      <header class="page-header">
        <h1>📚 Documentales</h1>
        <div class="filters">
          <select id="tema-filter" onchange="filtrarDocumentales()">
            <option value="">Todos los temas</option>
            <option value="naturaleza">Naturaleza</option>
            <option value="historia">Historia</option>
            <option value="ciencia">Ciencia</option>
            <option value="biografias">Biografías</option>
            <option value="tecnologia">Tecnología</option>
          </select>
          <input type="text" id="buscar-documentales" placeholder="Buscar documentales..." 
                 oninput="buscarContenido(this.value, 'documental')" />
        </div>
      </header>

      <div class="content-grid">
        <section class="grid-section">
          <h2>📚 Todos los documentales</h2>
          <div id="grid-documentales" class="content-grid-items">
            <div class="loading">Cargando documentales...</div>
          </div>
        </section>
      </div>
    </div>
  `;

  await cargarGridDocumentales();
}

// ==========================================
// FUNCIÓN MOSTRAR MI LISTA
// ==========================================
async function mostrarMiLista() {
  const app = document.getElementById('app');
  
  app.innerHTML = `
    <div class="mi-lista-container">
      <header class="page-header">
        <h1>📋 Mi Lista</h1>
        <div class="lista-stats">
          <span class="stat">Total: <strong id="total-lista">${miLista.length}</strong></span>
          <span class="stat">Películas: <strong id="peliculas-lista">0</strong></span>
          <span class="stat">Series: <strong id="series-lista">0</strong></span>
          <span class="stat">Documentales: <strong id="documentales-lista">0</strong></span>
        </div>
      </header>

      ${miLista.length === 0 ? `
        <div class="empty-state">
          <div class="empty-icon">📝</div>
          <h2>Tu lista está vacía</h2>
          <p>Añade películas, series y documentales que quieras ver más tarde</p>
          <button class="btn btn-primary" onclick="General()">
            Explorar contenido
          </button>
        </div>
      ` : `
        <div class="lista-filters">
          <button class="filter-btn active" onclick="filtrarMiLista('all')">Todos</button>
          <button class="filter-btn" onclick="filtrarMiLista('pelicula')">Películas</button>
          <button class="filter-btn" onclick="filtrarMiLista('serie')">Series</button>
          <button class="filter-btn" onclick="filtrarMiLista('documental')">Documentales</button>
        </div>
        
        <div id="mi-lista-grid" class="content-grid-items">
          <div class="loading">Cargando tu lista...</div>
        </div>
      `}
    </div>
  `;

  if (miLista.length > 0) {
    await cargarMiListaCompleta();
    actualizarEstadisticasLista();
  }
}

// ==========================================
// FUNCIONES DE CARGA DE CONTENIDO
// ==========================================

async function cargarHeroPrincipal() {
  try {
    // Usar contenido destacado de nuestro respaldo
    const heroContent = CONTENIDO_RESPALDO.peliculas[0];
    
    document.getElementById('hero-title').textContent = heroContent.titulo;
    document.getElementById('hero-description').textContent = heroContent.descripcion;
    document.getElementById('hero-poster').src = heroContent.imagen;
    
    // Aplicar imagen de fondo al hero
    const heroSection = document.getElementById('hero-section');
    heroSection.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.7)), url('${heroContent.imagen}')`;
    
  } catch (error) {
    console.error('Error cargando hero:', error);
  }
}

async function cargarContinuarViendo() {
  const container = document.getElementById('continuar-viendo');
  
  if (historialVisto.length === 0) {
    container.innerHTML = '<div class="empty-message">No tienes contenido en progreso</div>';
    return;
  }

  let htmlContent = '';
  
  for (const item of historialVisto.slice(0, 10)) {
    htmlContent += `
      <div class="content-card" onclick="continuarViendo('${item.contenido_id}', '${item.tipo_contenido}')">
        <div class="card-image">
          <img src="${item.poster_url || obtenerImagenPorDefecto(item.tipo_contenido)}" alt="${item.titulo}" />
          <div class="progress-overlay">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${item.progreso || 0}%"></div>
            </div>
          </div>
          <div class="play-overlay">▶️</div>
        </div>
        <div class="card-info">
          <h3>${item.titulo}</h3>
          <p class="content-type">${item.tipo_contenido.toUpperCase()}</p>
        </div>
      </div>
    `;
  }
  
  container.innerHTML = htmlContent;
}

async function cargarPeliculasDestacadas() {
  const container = document.getElementById('peliculas-destacadas');
  await cargarContenidoEnContainer(container, CONTENIDO_RESPALDO.peliculas);
}

async function cargarSeriesPopulares() {
  const container = document.getElementById('series-populares');
  await cargarContenidoEnContainer(container, CONTENIDO_RESPALDO.series);
}

async function cargarDocumentalesDestacados() {
  const container = document.getElementById('documentales-destacados');
  await cargarContenidoEnContainer(container, CONTENIDO_RESPALDO.documentales);
}

async function cargarAccionAventura() {
  const container = document.getElementById('accion-aventura');
  const contenidoAccion = [...CONTENIDO_RESPALDO.peliculas, ...CONTENIDO_RESPALDO.series]
    .filter(item => item.genero.toLowerCase().includes('accion') || item.genero.toLowerCase().includes('acción'));
  await cargarContenidoEnContainer(container, contenidoAccion);
}

async function cargarGridPeliculas() {
  const container = document.getElementById('grid-peliculas');
  await cargarContenidoEnContainer(container, CONTENIDO_RESPALDO.peliculas, true);
}

async function cargarGridSeries() {
  const container = document.getElementById('grid-series');
  await cargarContenidoEnContainer(container, CONTENIDO_RESPALDO.series, true);
}

async function cargarGridDocumentales() {
  const container = document.getElementById('grid-documentales');
  await cargarContenidoEnContainer(container, CONTENIDO_RESPALDO.documentales, true);
}

// Función genérica para cargar contenido en contenedores
async function cargarContenidoEnContainer(container, contenido, esGrid = false) {
  try {
    let htmlContent = '';
    
    for (const item of contenido) {
      const enMiLista = miLista.some(fav => fav.contenido_id === item.id.toString());
      
      htmlContent += `
        <div class="content-card" onclick="mostrarDetallesContenido(${item.id}, '${item.tipo}')">
          <div class="card-image">
            <img src="${item.imagen}" alt="${item.titulo}" loading="lazy" />
            <div class="play-overlay">▶️</div>
            <button class="btn-lista" onclick="event.stopPropagation(); toggleMiLista(${item.id}, '${item.tipo}', '${item.titulo}', '${item.imagen}')" 
                    id="lista-${item.id}">
              ${enMiLista ? '✓' : '+'}
            </button>
          </div>
          <div class="card-info">
            <h3>${item.titulo}</h3>
            <p class="content-type">${item.tipo.toUpperCase()}</p>
            <div class="rating">⭐ ${item.rating}</div>
            ${item.temporadas ? `<p class="seasons">${item.temporadas} temporadas</p>` : ''}
          </div>
        </div>
      `;
    }
    
    container.innerHTML = htmlContent;
    
  } catch (error) {
    console.error('Error cargando contenido:', error);
    container.innerHTML = '<div class="error">Error cargando contenido</div>';
  }
}

async function cargarMiListaCompleta() {
  const container = document.getElementById('mi-lista-grid');
  
  try {
    let htmlContent = '';
    
    for (const item of miLista) {
      htmlContent += `
        <div class="content-card" onclick="mostrarDetallesContenido(${item.contenido_id}, '${item.tipo_contenido}')">
          <div class="card-image">
            <img src="${item.poster_url || obtenerImagenPorDefecto(item.tipo_contenido)}" alt="${item.titulo}" />
            <div class="play-overlay">▶️</div>
            <button class="btn-remove" onclick="event.stopPropagation(); toggleMiLista(${item.contenido_id}, '${item.tipo_contenido}', '${item.titulo}', '${item.poster_url}')">
              ✗
            </button>
          </div>
          <div class="card-info">
            <h3>${item.titulo}</h3>
            <p class="content-type">${item.tipo_contenido.toUpperCase()}</p>
          </div>
        </div>
      `;
    }
    
    container.innerHTML = htmlContent;
    
  } catch (error) {
    console.error('Error cargando Mi Lista:', error);
    container.innerHTML = '<div class="error">Error cargando tu lista</div>';
  }
}

// ==========================================
// FUNCIONES DE VALIDACIÓN DE SESIÓN
// ==========================================

// Verificar si el usuario está logueado antes de acciones
function verificarSesionParaAccion(accion) {
  if (!currentUser) {
    // En lugar de mostrar modal, ir directo al login
    mostrarLogin();
    
    // Opcional: mostrar mensaje de por qué necesita loguearse
    setTimeout(() => {
      const loginContainer = document.querySelector('#app');
      if (loginContainer) {
        const mensaje = document.createElement('div');
        mensaje.className = 'login-message';
        mensaje.style.cssText = `
          background: rgba(229, 9, 20, 0.1);
          border: 1px solid rgba(229, 9, 20, 0.3);
          border-radius: 8px;
          padding: 15px;
          margin: 20px 0;
          text-align: center;
          color: #e50914;
        `;
        mensaje.innerHTML = `
          <p><strong>🔒 Inicia sesión para ${obtenerMensajeAccion(accion)}</strong></p>
          <p style="margin-top: 10px; color: #ccc; font-size: 14px;">
            Es gratis y solo toma unos segundos
          </p>
        `;
        
        // Insertar después del formulario de login
        const loginForm = document.querySelector('#login-form');
        if (loginForm && loginForm.parentNode) {
          loginForm.parentNode.insertBefore(mensaje, loginForm.nextSibling);
        }
      }
    }, 100);
    
    return false;
  }
  return true;
}

// Mostrar modal que pide registro para continuar
function mostrarModalRegistroRequerido(accion) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay modal-registro-requerido';
  modal.innerHTML = `
    <div class="modal-content modal-auth">
      <button class="modal-close" onclick="cerrarModalAuth()">&times;</button>
      <div class="modal-auth-content">
        <div class="auth-icon">🎬</div>
        <h2>¡Únete a StreamFlix!</h2>
        <p class="auth-message">Para ${obtenerMensajeAccion(accion)} necesitas crear una cuenta gratuita</p>
        
        <div class="auth-benefits">
          <div class="benefit-item">
            <span class="benefit-icon">✅</span>
            <span>Guarda tus películas y series favoritas</span>
          </div>
          <div class="benefit-item">
            <span class="benefit-icon">📺</span>
            <span>Continúa viendo donde lo dejaste</span>
          </div>
          <div class="benefit-item">
            <span class="benefit-icon">🎯</span>
            <span>Recibe recomendaciones personalizadas</span>
          </div>
          <div class="benefit-item">
            <span class="benefit-icon">⭐</span>
            <span>Califica y comenta contenido</span>
          </div>
        </div>

        <div class="auth-buttons">
          <button class="btn btn-primary btn-auth" onclick="mostrarRegistroCompleto()">
            🚀 Crear cuenta gratis
          </button>
          <button class="btn btn-secondary btn-auth" onclick="mostrarLoginCompleto()">
            👤 Ya tengo cuenta
          </button>
        </div>
        
        <p class="auth-footer">Es gratis y solo toma 30 segundos</p>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

// Obtener mensaje específico según la acción
function obtenerMensajeAccion(accion) {
  const mensajes = {
    'reproducir': 'reproducir contenido',
    'favoritos': 'añadir a tu lista',
    'mi_lista': 'ver tu lista personal',
    'valorar': 'valorar contenido',
    'comentar': 'comentar',
    'continuar': 'continuar viendo',
    'historial': 'ver tu historial'
  };
  
  return mensajes[accion] || 'acceder a esta función';
}

// Mostrar modal simple de registro
function mostrarRegistroModal() {
  if (currentUser) {
    // Si ya está logueado, ir a perfil
    mostrarDatosSeguro();
    return;
  }
  
  // Si no está logueado, ir directo al registro completo
  mostrarRegistroSeguro();
}

// Mostrar registro completo
async function mostrarRegistroCompleto() {
  cerrarModalAuth();
  
  try {
    if (typeof mostrarRegistro === 'function') {
      mostrarRegistro();
    } else {
      // Si no está cargada, cargar dinámicamente
      const { mostrarRegistro: registro } = await import('./registro.js');
      registro();
    }
  } catch (error) {
    console.error('Error mostrando registro:', error);
    // Fallback: mostrar login con enlace a registro
    mostrarLogin();
    setTimeout(() => {
      agregarEnlaceRegistro();
    }, 100);
  }
}

// Mostrar login completo
function mostrarLoginCompleto() {
  cerrarModalAuth();
  mostrarLogin();
}

// Cerrar modal de autenticación
function cerrarModalAuth() {
  const modal = document.querySelector('.modal-registro-requerido');
  if (modal) {
    modal.remove();
  }
}

// ==========================================
// FUNCIONES DE INTERACCIÓN MODIFICADAS
// ==========================================

// Toggle Mi Lista (modificado para verificar sesión)
async function toggleMiLista(contenidoId, tipo, titulo, posterUrl) {
  // Verificar si el usuario está logueado
  if (!verificarSesionParaAccion('favoritos')) {
    return;
  }
  
  const enLista = miLista.some(item => item.contenido_id === contenidoId.toString());
  
  try {
    if (enLista) {
      // Remover de la lista
      await supabase
        .from('mi_lista')
        .delete()
        .eq('user_id', currentUser.id)
        .eq('contenido_id', contenidoId.toString());
      
      miLista = miLista.filter(item => item.contenido_id !== contenidoId.toString());
      mostrarNotificacion('Eliminado de Mi Lista', 'error');
    } else {
      // Añadir a la lista
      const nuevoItem = {
        user_id: currentUser.id,
        contenido_id: contenidoId.toString(),
        tipo_contenido: tipo,
        titulo: titulo,
        poster_url: posterUrl,
        fecha_agregado: new Date().toISOString()
      };
      
      await supabase
        .from('mi_lista')
        .insert(nuevoItem);
      
      miLista.push(nuevoItem);
      mostrarNotificacion('¡Añadido a Mi Lista!', 'success');
    }
    
    // Actualizar el botón
    const btnLista = document.getElementById(`lista-${contenidoId}`);
    if (btnLista) {
      btnLista.textContent = enLista ? '+' : '✓';
      btnLista.setAttribute('title', enLista ? 'Añadir a Mi Lista' : 'En Mi Lista');
    }
    
    // Actualizar estadísticas si estamos en Mi Lista
    if (document.getElementById('total-lista')) {
      actualizarEstadisticasLista();
    }
    
  } catch (error) {
    console.error('Error actualizando Mi Lista:', error);
    mostrarNotificacion('Error al actualizar la lista', 'error');
  }
}

// Reproducir contenido (modificado para verificar sesión)
async function reproducirContenido(id) {
  // Verificar si el usuario está logueado
  if (!verificarSesionParaAccion('reproducir')) {
    return;
  }
  
  // Buscar el contenido
  let contenido = [...CONTENIDO_RESPALDO.peliculas, ...CONTENIDO_RESPALDO.series, ...CONTENIDO_RESPALDO.documentales]
    .find(item => item.id === id);
  
  if (!contenido) {
    mostrarNotificacion('Contenido no disponible', 'error');
    return;
  }
  
  // Registrar en historial
  await registrarVisualizacion(contenido);
  
  // Crear reproductor modal
  const modal = document.createElement('div');
  modal.className = 'video-modal-overlay';
  modal.innerHTML = `
    <div class="video-modal-content">
      <button class="video-modal-close" onclick="cerrarVideoModal()">&times;</button>
      <div class="video-container">
        <video id="main-video" controls autoplay poster="${contenido.imagen}">
          <source src="${contenido.video}" type="video/mp4">
          Tu navegador no soporta el elemento video.
        </video>
        <div class="video-info">
          <h2>${contenido.titulo}</h2>
          <p>${contenido.descripcion}</p>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Configurar eventos del video
  const video = document.getElementById('main-video');
  video.addEventListener('timeupdate', () => actualizarProgreso(contenido, video));
  video.addEventListener('ended', () => marcarComoCompletado(contenido));
  
  mostrarNotificacion('¡Disfruta tu contenido!', 'success');
}

// Continuar viendo (modificado para verificar sesión)
function continuarViendo(id, tipo) {
  // Verificar si el usuario está logueado
  if (!verificarSesionParaAccion('continuar')) {
    return;
  }
  
  const itemHistorial = historialVisto.find(item => 
    item.contenido_id === id && item.tipo_contenido === tipo
  );
  
  if (itemHistorial) {
    reproducirContenido(parseInt(id));
    mostrarNotificacion(`Continuando desde ${itemHistorial.progreso}%`, 'info');
  } else {
    reproducirContenido(parseInt(id));
  }
}



// ==========================================
// FUNCIONES PARA BOTONES DE ACCIÓN
// ==========================================

// Función para mostrar detalles (permite ver sin login, pero acciones requieren login)
function mostrarDetallesContenido(id, tipo) {
  // Buscar el contenido en nuestros datos
  let contenido;
  
  if (tipo === 'pelicula') {
    contenido = CONTENIDO_RESPALDO.peliculas.find(p => p.id === id);
  } else if (tipo === 'serie') {
    contenido = CONTENIDO_RESPALDO.series.find(s => s.id === id);
  } else if (tipo === 'documental') {
    contenido = CONTENIDO_RESPALDO.documentales.find(d => d.id === id);
  }
  
  if (!contenido) {
    mostrarNotificacion('Contenido no encontrado', 'error');
    return;
  }
  
  // Crear modal con detalles
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content">
      <button class="modal-close" onclick="cerrarModal()">&times;</button>
      <div class="modal-header">
        <img src="${contenido.imagen}" alt="${contenido.titulo}" class="modal-poster" />
        <div class="modal-info">
          <h1>${contenido.titulo}</h1>
          <p class="modal-meta">${contenido.año} • ${contenido.genero} • ⭐ ${contenido.rating}</p>
          ${contenido.temporadas ? `<p class="modal-seasons">${contenido.temporadas} temporadas</p>` : ''}
          <p class="modal-description">${contenido.descripcion}</p>
          <div class="modal-buttons">
            <button class="btn btn-play" onclick="reproducirContenido(${contenido.id})">
              ▶️ Reproducir
            </button>
            <button class="btn btn-lista" onclick="toggleMiLista(${contenido.id}, '${contenido.tipo}', '${contenido.titulo}', '${contenido.imagen}')">
              ${currentUser && miLista.some(item => item.contenido_id === contenido.id.toString()) ? '✓ En Mi Lista' : '+ Mi Lista'}
            </button>
            ${!currentUser ? `
              <div class="login-prompt">
                <p>🔒 <button onclick="mostrarModalRegistroRequerido('general')" class="link-btn">Inicia sesión</button> para acceder a todas las funciones</p>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
      <div class="modal-video">
        <video controls poster="${contenido.imagen}" preload="metadata">
          <source src="${contenido.video}" type="video/mp4">
          Tu navegador no soporta el elemento video.
        </video>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

// ==========================================
// EXPONER FUNCIONES ADICIONALES
// ==========================================

window.mostrarRegistroModal = mostrarRegistroModal;
window.mostrarModalRegistroRequerido = mostrarModalRegistroRequerido;
window.mostrarRegistroCompleto = mostrarRegistroCompleto;
window.mostrarLoginCompleto = mostrarLoginCompleto;
window.cerrarModalAuth = cerrarModalAuth;
window.verificarSesionParaAccion = verificarSesionParaAccion;

// Registrar visualización en historial
async function registrarVisualizacion(contenido) {
  try {
    const historialItem = {
      user_id: currentUser.id,
      contenido_id: contenido.id.toString(),
      tipo_contenido: contenido.tipo,
      titulo: contenido.titulo,
      poster_url: contenido.imagen,
      progreso: 0,
      fecha_visto: new Date().toISOString()
    };
    
    await supabase
      .from('historial_visto')
      .upsert(historialItem, {
        onConflict: 'user_id,contenido_id,temporada,episodio'
      });
    
    // Actualizar historial local
    const existingIndex = historialVisto.findIndex(item => 
      item.contenido_id === contenido.id.toString() && 
      item.tipo_contenido === contenido.tipo
    );
    
    if (existingIndex >= 0) {
      historialVisto[existingIndex] = { ...historialVisto[existingIndex], ...historialItem };
    } else {
      historialVisto.unshift(historialItem);
    }
    
  } catch (error) {
    console.error('Error registrando visualización:', error);
  }
}

// Actualizar progreso del video
async function actualizarProgreso(contenido, videoElement) {
  if (!videoElement.duration) return;
  
  const progreso = Math.round((videoElement.currentTime / videoElement.duration) * 100);
  
  // Actualizar cada 30 segundos o al final
  if (progreso % 10 === 0 || progreso >= 95) {
    try {
      await supabase
        .from('historial_visto')
        .update({ 
          progreso: progreso,
          tiempo_visto: Math.round(videoElement.currentTime / 60),
          fecha_visto: new Date().toISOString()
        })
        .eq('user_id', currentUser.id)
        .eq('contenido_id', contenido.id.toString());
      
    } catch (error) {
      console.error('Error actualizando progreso:', error);
    }
  }
}

// Marcar como completado
async function marcarComoCompletado(contenido) {
  try {
    await supabase
      .from('historial_visto')
      .update({ 
        progreso: 100,
        completado: true,
        fecha_visto: new Date().toISOString()
      })
      .eq('user_id', currentUser.id)
      .eq('contenido_id', contenido.id.toString());
    
    mostrarNotificacion('¡Contenido completado!', 'success');
    
  } catch (error) {
    console.error('Error marcando como completado:', error);
  }
}

// ==========================================
// FUNCIONES DE BÚSQUEDA Y FILTRADO
// ==========================================

function buscarContenido(termino, tipo) {
  let contenido;
  let containerId;
  
  if (tipo === 'pelicula') {
    contenido = CONTENIDO_RESPALDO.peliculas;
    containerId = 'grid-peliculas';
  } else if (tipo === 'serie') {
    contenido = CONTENIDO_RESPALDO.series;
    containerId = 'grid-series';
  } else if (tipo === 'documental') {
    contenido = CONTENIDO_RESPALDO.documentales;
    containerId = 'grid-documentales';
  }
  
  if (!termino.trim()) {
    cargarContenidoEnContainer(document.getElementById(containerId), contenido, true);
    return;
  }
  
  const resultados = contenido.filter(item => 
    item.titulo.toLowerCase().includes(termino.toLowerCase()) ||
    item.descripcion.toLowerCase().includes(termino.toLowerCase()) ||
    item.genero.toLowerCase().includes(termino.toLowerCase())
  );
  
  cargarContenidoEnContainer(document.getElementById(containerId), resultados, true);
}

function filtrarPeliculas() {
  const genero = document.getElementById('genero-filter').value;
  const año = document.getElementById('año-filter').value;
  
  let resultados = CONTENIDO_RESPALDO.peliculas;
  
  if (genero) {
    resultados = resultados.filter(item => 
      item.genero.toLowerCase().includes(genero.toLowerCase())
    );
  }
  
  if (año) {
    resultados = resultados.filter(item => item.año.toString() === año);
  }
  
  cargarContenidoEnContainer(document.getElementById('grid-peliculas'), resultados, true);
}

function filtrarSeries() {
  const genero = document.getElementById('genero-series-filter').value;
  
  let resultados = CONTENIDO_RESPALDO.series;
  
  if (genero) {
    resultados = resultados.filter(item => 
      item.genero.toLowerCase().includes(genero.toLowerCase())
    );
  }
  
  cargarContenidoEnContainer(document.getElementById('grid-series'), resultados, true);
}

function filtrarDocumentales() {
  const tema = document.getElementById('tema-filter').value;
  
  let resultados = CONTENIDO_RESPALDO.documentales;
  
  if (tema) {
    resultados = resultados.filter(item => 
      item.genero.toLowerCase().includes(tema.toLowerCase())
    );
  }
  
  cargarContenidoEnContainer(document.getElementById('grid-documentales'), resultados, true);
}

function filtrarMiLista(tipo) {
  // Actualizar botones activos
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  
  let listaFiltrada = miLista;
  
  if (tipo !== 'all') {
    listaFiltrada = miLista.filter(item => item.tipo_contenido === tipo);
  }
  
  // Recrear el contenido filtrado
  const container = document.getElementById('mi-lista-grid');
  let htmlContent = '';
  
  for (const item of listaFiltrada) {
    htmlContent += `
      <div class="content-card" onclick="mostrarDetallesContenido(${item.contenido_id}, '${item.tipo_contenido}')">
        <div class="card-image">
          <img src="${item.poster_url || obtenerImagenPorDefecto(item.tipo_contenido)}" alt="${item.titulo}" />
          <div class="play-overlay">▶️</div>
          <button class="btn-remove" onclick="event.stopPropagation(); toggleMiLista(${item.contenido_id}, '${item.tipo_contenido}', '${item.titulo}', '${item.poster_url}')">
            ✗
          </button>
        </div>
        <div class="card-info">
          <h3>${item.titulo}</h3>
          <p class="content-type">${item.tipo_contenido.toUpperCase()}</p>
        </div>
      </div>
    `;
  }
  
  container.innerHTML = htmlContent || '<div class="empty-message">No hay contenido de este tipo</div>';
}

// ==========================================
// FUNCIONES AUXILIARES PARA VERIFICACIÓN
// ==========================================

// Verificar si el usuario existe en la tabla usuario
async function verificarUsuarioEnTabla(userId) {
  try {
    const { data, error } = await supabase
      .from('usuario')
      .select('id, nombre, correo')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error verificando usuario:', error);
      return false;
    }
    
    return data ? true : false;
  } catch (error) {
    console.error('Error en verificación:', error);
    return false;
  }
}

// Crear perfil de usuario si no existe (fallback)
async function crearPerfilSiFalta(user) {
  try {
    const existe = await verificarUsuarioEnTabla(user.id);
    
    if (!existe) {
      console.log('Usuario no encontrado en tabla, creando perfil...');
      
      // Intentar crear el perfil básico
      const { error } = await supabase
        .from('usuario')
        .insert({
          id: user.id,
          nombre: user.email.split('@')[0], // Usar parte del email como nombre temporal
          correo: user.email,
          fecha_nacimiento: null,
          telefono: '',
          roll: 'usuario'
        });
      
      if (error) {
        console.error('Error creando perfil:', error);
        throw error;
      }
      
      console.log('Perfil creado exitosamente');
      mostrarNotificacion('Perfil creado. Por favor, completa tu información.', 'success');
    }
    
    return true;
  } catch (error) {
    console.error('Error en crearPerfilSiFalta:', error);
    return false;
  }
}

function obtenerImagenPorDefecto(tipo) {
  const imagenesPorDefecto = {
    pelicula: 'https://images.unsplash.com/photo-1489599162946-648913ad7e84?w=500&h=750&fit=crop',
    serie: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=500&h=750&fit=crop',
    documental: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=500&h=750&fit=crop'
  };
  
  return imagenesPorDefecto[tipo] || imagenesPorDefecto.pelicula;
}

function mostrarNotificacion(mensaje, tipo = 'info') {
  // Remover notificaciones existentes
  const existingNotifications = document.querySelectorAll('.notification');
  existingNotifications.forEach(notification => notification.remove());
  
  const notification = document.createElement('div');
  notification.className = `notification ${tipo}`;
  notification.innerHTML = `
    <div class="notification-content">
      <span class="notification-icon">
        ${tipo === 'success' ? '✅' : tipo === 'error' ? '❌' : tipo === 'warning' ? '⚠️' : 'ℹ️'}
      </span>
      <span class="notification-message">${mensaje}</span>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

function actualizarEstadisticasLista() {
  const peliculas = miLista.filter(item => item.tipo_contenido === 'pelicula').length;
  const series = miLista.filter(item => item.tipo_contenido === 'serie').length;
  const documentales = miLista.filter(item => item.tipo_contenido === 'documental').length;
  
  document.getElementById('total-lista').textContent = miLista.length;
  document.getElementById('peliculas-lista').textContent = peliculas;
  document.getElementById('series-lista').textContent = series;
  document.getElementById('documentales-lista').textContent = documentales;
}

function cerrarModal() {
  const modal = document.querySelector('.modal-overlay');
  if (modal) {
    modal.remove();
  }
}

function cerrarVideoModal() {
  const modal = document.querySelector('.video-modal-overlay');
  if (modal) {
    const video = modal.querySelector('video');
    if (video) {
      video.pause();
    }
    modal.remove();
  }
}

// ==========================================
// FUNCIONES PARA EXPANDIR CONTENIDO
// ==========================================

// Función para agregar más contenido usando APIs gratuitas
async function expandirContenidoConAPIs() {
  try {
    // Expandir con imágenes de Unsplash
    const imagenesNuevas = await obtenerImagenesUnsplash();
    
    // Agregar nuevas películas con imágenes reales
    const nuevasPeliculas = [
      {
        id: 9,
        titulo: "Aventura en la Ciudad",
        descripcion: "Una emocionante aventura urbana llena de sorpresas.",
        imagen: imagenesNuevas[0] || obtenerImagenPorDefecto('pelicula'),
        video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4",
        tipo: "pelicula",
        genero: "Aventura",
        año: 2024,
        rating: 4.3
      },
      {
        id: 10,
        titulo: "Misterio Nocturno",
        descripcion: "Un thriller psicológico que te mantendrá despierto.",
        imagen: imagenesNuevas[1] || obtenerImagenPorDefecto('pelicula'),
        video: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
        tipo: "pelicula",
        genero: "Thriller",
        año: 2024,
        rating: 4.6
      }
    ];
    
    // Agregar al contenido existente
    CONTENIDO_RESPALDO.peliculas.push(...nuevasPeliculas);
    
  } catch (error) {
    console.error('Error expandiendo contenido con APIs:', error);
  }
}

// Obtener imágenes de Unsplash
async function obtenerImagenesUnsplash() {
  try {
    // Si no tienes API key, usar imágenes de demostración
    const imagenesDemo = [
      'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=500&h=750&fit=crop',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&h=750&fit=crop',
      'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=500&h=750&fit=crop',
      'https://images.unsplash.com/photo-1489599162946-648913ad7e84?w=500&h=750&fit=crop'
    ];
    
    return imagenesDemo;
    
    // Código para usar con API key real:
    /*
    const response = await fetch(`${UNSPLASH_BASE_URL}/photos/random?count=10&query=movie&client_id=${UNSPLASH_ACCESS_KEY}`);
    const data = await response.json();
    return data.map(img => img.urls.regular);
    */
    
  } catch (error) {
    console.error('Error obteniendo imágenes:', error);
    return [];
  }
}

// ==========================================
// INICIALIZACIÓN ADICIONAL
// ==========================================

// Expandir contenido al cargar la aplicación
document.addEventListener('DOMContentLoaded', () => {
  // Expandir contenido con APIs después de un delay
  setTimeout(() => {
    expandirContenidoConAPIs();
  }, 2000);
});

// Cerrar modales con Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    cerrarModal();
    cerrarVideoModal();
  }
});

// Cerrar modales clickeando fuera
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    cerrarModal();
  }
  if (e.target.classList.contains('video-modal-overlay')) {
    cerrarVideoModal();
  }
});

// ==========================================
// EXPONER FUNCIONES GLOBALMENTE
// ==========================================

window.General = General;
window.mostrarPeliculas = mostrarPeliculas;
window.mostrarSeries = mostrarSeries;
window.mostrarDocumentales = mostrarDocumentales;
window.mostrarMiLista = mostrarMiLista;
window.toggleMiLista = toggleMiLista;
window.mostrarDetallesContenido = mostrarDetallesContenido;
window.reproducirContenido = reproducirContenido;
window.continuarViendo = continuarViendo;
window.buscarContenido = buscarContenido;
window.filtrarPeliculas = filtrarPeliculas;
window.filtrarSeries = filtrarSeries;
window.filtrarDocumentales = filtrarDocumentales;
window.filtrarMiLista = filtrarMiLista;
window.cerrarModal = cerrarModal;
window.cerrarVideoModal = cerrarVideoModal;