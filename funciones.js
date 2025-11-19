
/* ============================================================
   Fallback de navegación: recargar al cambiar de sección
   (Evita quedarse con la vista vacía si los módulos no cargan)
   ============================================================ */

document.addEventListener('click', (ev) => {
  const a = ev.target.closest('a[href^="#/"]');
  if (a) {
    ev.preventDefault();
    const href = a.getAttribute('href');
    // Forzar el cambio de hash + recarga completa
    if (location.hash !== href) {
      location.hash = href;
    }
    // 🔁 Espera un instante y recarga la página
    setTimeout(() => {
      location.reload();
    }, 30);
  }
});


/* ============================================================
   Transición visual al navegar o recargar
   ============================================================ */
(function() {
  // Crear el overlay de transición si no existe
  let overlay = document.getElementById('overlay-transicion');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'overlay-transicion';
    document.body.appendChild(overlay);
  }

  // Mostrar transición al cargar la página
  window.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('mostrando');
    overlay.classList.remove('activo');
  });

  // Mostrar una breve animación de salida antes de cambiar de sección
  window.addEventListener('hashchange', () => {
    overlay.classList.add('activo');
    document.body.classList.remove('mostrando');
    setTimeout(() => {
      document.body.classList.add('mostrando');
      overlay.classList.remove('activo');
    }, 400); // Duración de la transición entre secciones
  });

  // Efecto también al recargar
  window.addEventListener('pageshow', () => {
    document.body.classList.add('mostrando');
    overlay.classList.remove('activo');
  });
})();






/* ============================================================
   Simular un clic automático al cargar / navegar
   (elimina el borde blanco de foco en títulos o enlaces)
   ============================================================ */

(function() {
  function clickAutomatico() {
    try {
      // 🔹 Simula un clic en el body
      const evt = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      document.body.dispatchEvent(evt);

      // 🔹 También quita cualquier foco visual activo
      if (document.activeElement && typeof document.activeElement.blur === 'function') {
        document.activeElement.blur();
      }

      // 🔹 Borra cualquier selección residual
      if (window.getSelection) {
        const sel = window.getSelection();
        if (sel && sel.removeAllRanges) sel.removeAllRanges();
      }
    } catch (e) {
      console.warn('clickAutomatico:', e);
    }
  }

  // Ejecutar al cargar y al cambiar de hash (navegar entre secciones)
  window.addEventListener('load', () => setTimeout(clickAutomatico, 50));
  window.addEventListener('hashchange', () => setTimeout(clickAutomatico, 50));
})();

 // Completar conteos por categoría
    (function hydrateCategoryTotals(){
      const byCat = {};
      for(const e of DATA.empresas){
        byCat[e.cat] = (byCat[e.cat]||0)+1;
      }
      for(const c of DATA.categorias){
        c.total = byCat[c.id]||0;
      }
    })();

    // --- Helpers mínimos ---
    const $ = sel => document.querySelector(sel);
    const $$ = sel => Array.from(document.querySelectorAll(sel));

    function numberFmt(n){
      return new Intl.NumberFormat('es-PE',{maximumFractionDigits:0}).format(n);
    }

    function navigateTo(hash){
  if(location.hash !== hash) {
    location.hash = hash;
  } else {
    Router.dispatch(); // 👈 fuerza render inmediato si es el mismo hash
  }
}

    // --- Render Home: KPIs y Categorías ---
    function renderKPIs(){
      $('#kpiEmpresas').textContent = numberFmt(DATA.empresas.length);
      $('#kpiCategorias').textContent = numberFmt(DATA.categorias.length);
      
    }

    function renderCategoryOptions(){
      const sel = $('#cat');
      let opts = '<option value="">Todas las categorías</option>';
      for(const c of DATA.categorias){
        opts += `<option value="${c.id}">${c.nombre}</option>`;
      }
      sel.innerHTML = opts;
    }

    function catCardTemplate(c){
  const href = `#/categoria/${c.id}`;
  const iconHtml = renderIcon(c.icon, '80px'); // 👈 Usa la función helper
  
  return `
  <a class="cat-card" href="${href}" data-cat="${c.id}" title="Ver ${c.nombre}">
    <div class="cat-media">${iconHtml}</div>
    <div class="cat-body">
      <div>
        <div style="font-weight:800">${c.nombre}</div>
        <div style="font-size:12px; color:var(--muted)">${numberFmt(c.total)} negocios</div>
      </div>
      <span class="badge">Explorar</span>
    </div>
  </a>`;
}

    function renderCategoryPreview(){
      const grid = $('#catGrid');
      grid.innerHTML = DATA.categorias.slice(0.9).map(catCardTemplate).join('');
    }

    // --- Búsqueda (solo navegación; resultados en bloques siguientes) ---
    function onSearchSubmit(ev){
      ev.preventDefault();
      const q = ($('#q').value || '').trim();
      const cat = $('#cat').value;
      const loc = $('#loc').value;
      const params = new URLSearchParams();
      if(q) params.set('q', q);
      if(cat) params.set('cat', cat);
      if(loc) params.set('loc', loc);
      navigateTo(`#/buscar?${params.toString()}`);
    }

    function onQuickChip(ev){
      const el = ev.target.closest('[data-quick]');
      if(!el) return;
      $('#q').value = el.getAttribute('data-quick');
      $('#cat').value = '';
      $('#loc').value = '';
      $('#btnSearch').focus();
    }

    // --- Router mínimo (placeholder) ---
    function hideAllViews(){
      $('#home').classList.add('hide');
      $('#view-listado').classList.add('hide');
      $('#view-ficha').classList.add('hide');
      $('#view-static').classList.add('hide');
    }

    

    // --- Init ---
    document.addEventListener('DOMContentLoaded', () => {
      // Año footer
      $('#year').textContent = new Date().getFullYear();

      // Home
      renderKPIs();
      renderCategoryOptions();
      renderCategoryPreview();

      // Eventos
      $('#searchForm').addEventListener('submit', onSearchSubmit);
      document.body.addEventListener('click', onQuickChip);

      // Router
      
    });
  


/* ============================================================
   ImpulsoLocal — Bloque 2
   Router con rutas con parámetros, mini motor de plantillas,
   utilidades (debounce, normalizador), y buscador cliente.
   ============================================================ */

/* ---------- Helpers de strings / normalización ---------- */
const Str = (() => {
  const rmDiacritics = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const toSearch = s => rmDiacritics(String(s||'').toLowerCase().trim().replace(/\s+/g,' '));
  const slug = s => toSearch(s).replace(/[^a-z0-9\s-]/g,'').replace(/\s+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');
  const clamp = (n,min,max) => Math.max(min, Math.min(max, n));
  return { rmDiacritics, toSearch, slug, clamp };
})();

/* ---------- Debounce / Throttle ---------- */
function debounce(fn, wait=250){
  let t; return (...args)=>{ clearTimeout(t); t=setTimeout(()=>fn.apply(null,args), wait); };
}
function throttle(fn, wait=200){
  let t=0; return (...args)=>{ const now=Date.now(); if(now-t>=wait){ t=now; fn.apply(null,args);} };
}

/* ---------- Mini templating ({{prop}} y {{=expr}}) ---------- */
function tpl(str, ctx={}){
  return String(str).replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, key) => {
    try{
      if(key.startsWith('=')){ /* expresión JS: {{= a + b}} */
        return Function(...Object.keys(ctx), `return (${key.slice(1)})`).apply(null, Object.values(ctx)) ?? '';
      }
      const path = key.split('.'); let v = ctx;
      for(const p of path){ v = v?.[p]; if(v==null) break; }
      return v ?? '';
    }catch{ return ''; }
  });
}

/* ---------- Render util (reemplazo seguro) ---------- */
function renderHTML(el, html){
  if(!el) return;
  el.innerHTML = html;
}

/* ---------- Toasts livianos ---------- */
const Toast = (() => {
  let holder;
  function ensure(){
    if(!holder){
      holder = document.createElement('div');
      holder.style.position='fixed';
      holder.style.inset='auto 0 24px 0';
      holder.style.display='grid';
      holder.style.placeItems='center';
      holder.style.pointerEvents='none';
      holder.style.zIndex='60';
      document.body.appendChild(holder);
    }
  }
  function show(msg, type='info'){
    ensure();
    const card = document.createElement('div');
    card.textContent = msg;
    card.style.pointerEvents='auto';
    card.style.maxWidth='92vw';
    card.style.background='var(--surface)';
    card.style.border='1px solid rgba(255,255,255,.10)';
    card.style.padding='10px 14px';
    card.style.borderRadius='12px';
    card.style.boxShadow='var(--shadow)';
    card.style.color= type==='error' ? 'var(--err)' : (type==='ok' ? 'var(--ok)' : 'inherit');
    card.style.margin='8px';
    holder.appendChild(card);
    setTimeout(()=>card.remove(), 2500);
  }
  return { show };
})();

/* ---------- Loading skeleton helpers ---------- */
function setLoadingGrid(el, count=6){
  if(!el) return;
  el.innerHTML = Array.from({length:count}).map(()=>'<div class="skeleton" style="min-height:120px;border-radius:16px"></div>').join('');
}

/* ---------- Query string utils ---------- */
function parseQS(qs=''){
  const out = {};
  const sp = new URLSearchParams(qs.startsWith('?')? qs.slice(1) : qs);
  for(const [k,v] of sp.entries()){ out[k]=v; }
  return out;
}
function toQS(obj){
  const sp = new URLSearchParams();
  Object.entries(obj||{}).forEach(([k,v])=>{ if(v!=null && v!=='') sp.set(k,v); });
  const s = sp.toString();
  return s ? `?${s}` : '';
}

/* ---------- Paginación ---------- */
function paginate(arr, page=1, per=12){
  const total = arr.length;
  const pages = Math.max(1, Math.ceil(total/per));
  const p = Str.clamp(page, 1, pages);
  const start = (p-1)*per;
  const slice = arr.slice(start, start+per);
  return { items: slice, page: p, pages, per, total, start, end: start + slice.length };
}

/* ---------- Índice de búsqueda ---------- */
const Search = (() => {
  let INDEX = [];
  function buildIndex(){
    INDEX = DATA.empresas.map(e => ({
      id: e.id,
      cat: e.cat,
      loc: e.loc,
      rating: e.rating||0,
      reviews: e.reviews||0,
      verificada: !!e.verificada,
      name: e.nombre,
      imgpresentacion: e.imgpresentacion || null,
      
      descrip: e.descrip|| '',
       logo: e.logo || null,
       slogan: e.slogan || '',
       breve: e.breve || '',
       subcat: e.subcat || '',
      text: Str.toSearch([e.nombre, e.loc, e.cat].join(' ')),
    }));
  }
  function byRank(a,b){
    // Orden: verificada desc, rating desc, reviews desc, nombre asc
    if(+b.verificada - +a.verificada !== 0) return +b.verificada - +a.verificada;
    if(b.rating - a.rating !== 0) return b.rating - a.rating;
    if(b.reviews - a.reviews !== 0) return b.reviews - a.reviews;
    return a.name.localeCompare(b.name,'es');
  }
  function matchQuery(q){
    if(!q) return () => true;
    const qq = Str.toSearch(q);
    const terms = qq.split(' ').filter(Boolean);
    return (row)=>{
      const txt = row.text;
      return terms.every(t => txt.includes(t));
    };
  }
  function search({q='', cat='', loc='', sort='rank'}={}){
    let rows = INDEX.slice();
    const predicate = matchQuery(q);
    rows = rows.filter(r => predicate(r));
    if(cat) rows = rows.filter(r => r.cat===cat);
    if(loc) rows = rows.filter(r => r.loc===loc);
    if(sort==='alpha'){ rows.sort((a,b)=>a.name.localeCompare(b.name,'es')); }
    else if(sort==='rating'){ rows.sort((a,b)=> (b.rating - a.rating) || (b.reviews - a.reviews)); }
    else { rows.sort(byRank); }
    return rows;
  }
  // Inicializa al cargar
  buildIndex();
  return { buildIndex, search };
})();

/* ---------- Componente Breadcrumbs (migas) ---------- */
function breadcrumbs(items){
  const parts = items.map((it,i)=>{
    const isLast = i===items.length-1;
    return `<a ${it.href && !isLast ? `href="${it.href}"`:'role="link"'} class="chip" style="text-decoration:none;${isLast?'opacity:.9;font-weight:700':''}">
      ${it.icon? it.icon+' ' : ''}${it.label}
    </a>`;
  }).join(' ');
  return `<nav aria-label="migas" style="display:flex;gap:8px;flex-wrap:wrap">${parts}</nav>`;
}

/* ---------- Tarjeta de empresa (compacta) ---------- */
function companyCard(e){
  const badge = e.verificada ? `<span class="badge" title="Empresa verificada">Verificada</span>` : '';
  const revs = `<span class="chip" >${e.reviews ?? 0} </span>`;
  const loc = `<span class="chip" title="Ubicación">📍 ${e.loc}</span>`;
  
  // ✅ Logo REAL como en la ficha
  const logo = e.logo || null;
  const icon = e.icon || '🏢';
  
  const logoHtml = logo && logo.trim() 
    ? `<img src="${logo}" alt="Logo de ${e.nombre}" loading="lazy" 
         style="width:100%;height:100%;object-fit:cover;border-radius:12px;background:white;padding:4px;"
         onerror="this.style.display='none';this.nextElementSibling.style.display='block';">
       <div style="display:none;font-size:32px;">${icon}</div>`
    : `<div style="font-size:32px;">${icon}</div>`;
  
  return `
  <article class="card-company">
    <header class="card-head">
      <div class="card-logo" style="width:60px;height:60px;border-radius:12px;display:grid;place-items:center;background:conic-gradient(from 180deg,var(--brand),var(--brand-2),var(--brand));box-shadow:inset 0 0 0 2px rgba(255,255,255,.14);flex-shrink:0;">
        ${logoHtml}
        ${e.verificada ? '<span style="position:absolute;bottom:-3px;right:-3px;width:20px;height:20px;background:linear-gradient(135deg,#10b981,#34d399);border-radius:50%;display:grid;place-items:center;font-size:11px;box-shadow:0 2px 6px rgba(16,185,129,.4);border:2px solid white;z-index:2;">✓</span>' : ''}
      </div>
      <div class="card-title">
        <a href="#/empresa/${e.id}" style="font-weight:900;letter-spacing:.2px">${e.nombre}</a>
        ${e.slogan ? `<p class="empresa-slogan" style="font-size:13px;font-style:italic;color:var(--muted);margin:4px 0 6px 0;line-height:1.3;font-weight:500;">${e.slogan}</p>` : ''}
        <div class="card-badges">${badge}</div>
      </div>
    </header>
    <div class="card-body">
      <p style="margin:0;color:var(--muted);font-size:13px">${e.breve||'Negocio local cercano a ti.'}</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap">${revs}${loc}</div>
      <div class="card-actions">
        <a class="btn" href="#/empresa/${e.id}">Ver más</a>
        <a class="btn btn-ghost" href="#/categoria/${e.cat}">Ver categoría</a>
      </div>
    </div>
  </article>`;
}

/* ---------- Grilla de resultados (reutilizable) ---------- */
function renderGrid(list, targetSel){
  const target = typeof targetSel==='string' ? document.querySelector(targetSel) : targetSel;
  if(!target) return;
  if(!list?.length){
    target.innerHTML = `
      <div class="section">
        <h3>Sin resultados</h3>
        <p class="lead">No encontramos negocios que coincidan. Ajusta los filtros o intenta con otras palabras.</p>
        <a href="#/" class="btn">⬅ Volver al inicio</a>
      </div>`;
    return;
  }
  
  // ✅ Renderizar cada empresa con logo y slogan
  const html = list.map(e => {
    const badge = e.verificada ? `<span class="badge">Verificada</span>` : '';
    const logo = e.logo || null;
    const icon = e.icon || '🏢';
    
    // Logo HTML
    const logoHtml = logo && logo.trim() 
      ? `<img src="${logo}" alt="${e.nombre}" 
           style="width:100%;height:100%;object-fit:cover;border-radius:12px;background:white;padding:4px;"
           onerror="this.style.display='none';this.nextElementSibling.style.display='grid';">
         <span style="display:none;font-size:32px;">${icon}</span>`
      : `<span style="font-size:32px;">${icon}</span>`;
    
    return `
    <article class="card-company">
      <header class="card-head">
        <div class="card-logo" style="width:64px;height:64px;border-radius:14px;overflow:hidden;display:grid;place-items:center;background:conic-gradient(from 180deg,var(--brand),var(--brand-2),var(--brand));box-shadow:inset 0 0 0 2px rgba(255,255,255,.14);position:relative;flex-shrink:0;">
          ${logoHtml}
          ${e.verificada ? '<span style="position:absolute;bottom:-3px;right:-3px;width:20px;height:20px;background:linear-gradient(135deg,#10b981,#34d399);border-radius:50%;display:grid;place-items:center;font-size:11px;color:white;">✓</span>' : ''}
        </div>
        <div class="card-title" style="flex:1;">
          <a href="#/empresa/${e.id}" style="font-weight:900;">${e.nombre}</a>
          ${e.slogan ? `<div style="font-size:13px;font-style:italic;color:var(--muted);margin-top:4px;">${e.slogan}</div>` : ''}
          <div class="card-badges">${badge}</div>
        </div>
      </header>
      <div class="card-body">
        <p style="margin:0;color:var(--muted);font-size:13px;">${e.breve || 'Negocio local'}</p>
        <div style="margin-top:8px;">
          <span class="chip">📍 ${e.loc}</span>
        </div>
        <div class="card-actions" style="margin-top:10px;">
          <a class="btn" href="#/empresa/${e.id}">Ver más</a>
          <a class="btn btn-ghost" href="#/categoria/${e.cat}">Ver categoría</a>
        </div>
      </div>
    </article>`;
  }).join('');
  
  target.innerHTML = `<div class="cat-grid">${html}</div>`;
}

/* ---------- Controles de paginación ---------- */
function pagerControls(state, onNav){
  const {page,pages} = state;
  const btn = (p,label,disabled=false)=>`
    <button class="btn ${disabled?'btn-ghost':''}" data-page="${p}" ${disabled?'disabled':''} style="min-width:46px">${label}</button>`;
  const range = [];
  const start = Math.max(1, page-2);
  const end = Math.min(pages, page+2);
  for(let i=start;i<=end;i++){ range.push(i); }
  const html = `
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;justify-content:flex-end;margin-top:14px">
      ${btn(page-1,'‹', page<=1)}
      ${range.map(i => btn(i, i, i===page)).join('')}
      ${btn(page+1,'›', page>=pages)}
    </div>`;
  const wrap = document.createElement('div');
  wrap.innerHTML = html;
  wrap.addEventListener('click', (ev)=>{
    const p = Number(ev.target?.dataset?.page||0);
    if(p){ onNav(p); }
  }, {once:false});
  return wrap.firstElementChild;
}

/* ---------- Router con patrones ---------- */
const Router = (() => {
  const routes = [];
  function pathToRegex(path){
    const keys = [];
    const regexStr = path.replace(/\/:\w+/g, (m)=>{ keys.push(m.slice(2)); return '/([^/]+)'; });
    return { regex: new RegExp(`^${regexStr}$`), keys };
  }
  function add(path, handler){
    const {regex, keys} = pathToRegex(path);
    routes.push({ path, regex, keys, handler });
  }
  function match(pathname){
    for(const r of routes){
      const m = pathname.match(r.regex);
      if(m){
        const params = {};
        r.keys.forEach((k, i)=> params[k] = decodeURIComponent(m[i+1]||''));
        return { handler: r.handler, params };
      }
    }
    return null;
  }
  function go(hash){
  if (location.hash !== hash) {
    location.hash = hash;
  } else {
    dispatch(); // 🔧 ejecuta el render inmediato si es el mismo hash
  }
}
  function dispatch(){
    const raw = location.hash || '#/';
    const [p, qs] = raw.replace(/^#/, '').split('?');
    const found = match(p||'/');
    hideAllViews();
    if(found){
      const ctx = { path:p||'/', qs: parseQS(qs||''), params: found.params };
      found.handler(ctx);
    }else{
      // 404 → estática simple
      $('#view-static').classList.remove('hide');
      renderHTML($('#view-static'), `<h2>Página no encontrada</h2><p><a href="#/">Volver</a></p>`);
    }
  }
  window.addEventListener('hashchange', dispatch);
  return { add, go, dispatch };

})();

/* ---------- Vistas (handlers de rutas) ---------- */
function viewHome(){
  $('#home').classList.remove('hide');
}
function viewBuscar(ctx){
  const container = $('#view-listado');
  container.classList.remove('hide');
  setLoadingGrid(container, 12);
  const { q='', cat='', loc='', sort='rank', page='1' } = ctx.qs;
  const rows = Search.search({ q, cat, loc, sort });
  const state = paginate(rows, Number(page)||1, 12);
  const title = `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
      <div>
        <h2 style="margin:0">Resultados de búsqueda</h2>
        <p class="lead" style="margin:4px 0 0 0"><strong>${state.total}</strong> resultados
          ${q? ` para "<span class="mono">${q.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</span>"` : ''}</p>
      </div>
      <div>
        <label class="sr-only" for="sortSel">Ordenar</label>
        <select id="sortSel" class="select">
          <option value="rank"${sort==='rank'?' selected':''}>Relevancia</option>
          <option value="rating"${sort==='rating'?' selected':''}>Mejor calificados</option>
          <option value="alpha"${sort==='alpha'?' selected':''}>A–Z</option>
        </select>
      </div>
    </div>
    ${breadcrumbs([
      {label:'Inicio', href:'#/', icon:'🏠'},
      {label:'Buscar', href:`#/buscar${toQS({q,cat,loc,sort,page})}`}
    ])}
  `;
  // Render de contenido
  setTimeout(()=>{ // pequeño retardo para que se aprecie el skeleton
    container.innerHTML = title + `<div id="gridRes" class="section" style="padding-top:12px"></div>`;
    renderGrid(state.items, '#gridRes');
    const pag = pagerControls(state, (p)=>{
      const qs = toQS({ q, cat, loc, sort, page: p });
      Router.go(`#/buscar${qs}`);
    });
    container.appendChild(pag);
    $('#sortSel').addEventListener('change', (e)=>{
      const qs2 = toQS({ q, cat, loc, sort: e.target.value, page: 1 });
      Router.go(`#/buscar${qs2}`);
    });
  }, 240);
}
function viewCategoria(ctx){
  const { id } = ctx.params;
  const cat = DATA.categorias.find(c=>c.id===id);
  const container = $('#view-listado');
  container.classList.remove('hide');
  setLoadingGrid(container, 12);
  const all = Search.search({ q:'', cat:id, loc: ctx.qs.loc||'', sort: ctx.qs.sort || 'rank' });
  const state = paginate(all, Number(ctx.qs.page||1), 12);
  setTimeout(()=>{
    const header = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
        <div>
          <h2 style="margin:0">${cat? cat.nombre : 'Categoría'}</h2>
          <p class="lead" style="margin:4px 0 0 0">${state.total} negocios</p>
        </div>
        <div>
          <select id="sortCat" class="select">
            <option value="rank"${(ctx.qs.sort||'rank')==='rank'?' selected':''}>Relevancia</option>
            <option value="rating"${ctx.qs.sort==='rating'?' selected':''}>Mejor calificados</option>
            <option value="alpha"${ctx.qs.sort==='alpha'?' selected':''}>A–Z</option>
          </select>
        </div>
      </div>
      ${breadcrumbs([
        {label:'Inicio', href:'#/', icon:'🏠'},
        {label:'Categorías', href:'#/categorias', icon:'🗂️'},
        {label: cat? cat.nombre : id }
      ])}
    `;
    container.innerHTML = header + `<div id="gridCat" class="section" style="padding-top:12px"></div>`;
    renderGrid(state.items, '#gridCat');
    const pag = pagerControls(state, (p)=>{
      const qs = toQS({ page: p, sort: ctx.qs.sort||'rank', loc: ctx.qs.loc||'' });
      Router.go(`#/categoria/${id}${qs}`);
    });
    container.appendChild(pag);
    $('#sortCat').addEventListener('change', (e)=>{
      const qs2 = toQS({ page:1, sort: e.target.value, loc: ctx.qs.loc||'' });
      Router.go(`#/categoria/${id}${qs2}`);
    });
  }, 220);
}




/* ---------- Registrar rutas (VERSIÓN FINAL Y DIRECTA) ---------- */
Router.add('/',        () => viewHome());
Router.add('/buscar',  (ctx) => viewBuscarV4(ctx)); // Usa la V4 del Bloque 4
Router.add('/categorias', () => viewCategoriasHub()); // Usa la del Bloque 3
Router.add('/categoria/:id', (ctx) => viewCategoriaV4(ctx)); // Usa la V4 del Bloque 4

// --- Reemplazo directo de placeholders ---
// En lugar de llamar a viewEmpresa y viewStatic, llamamos directamente a las funciones de los Bloques 5 y 6
Router.add('/empresa/:id',   (ctx) => viewEmpresaV5(ctx));
Router.add('/sobre',     () => viewSobre());
Router.add('/terminos',  () => viewTerminos());
Router.add('/privacidad',() => viewPrivacidad());
Router.add('/favoritos',   () => viewFavoritos());
Router.add('/registrar', () => viewRegistrar());

/* ---------- Integración con el buscador del Home ---------- */
(function enhanceHomeSearch(){
  const input = $('#q');
  if(!input) return;

  // Autocomplete simple (chips dinámicos basados en DATA)
  let hintBox;
  function ensureHint(){
    if(hintBox) return hintBox;
    hintBox = document.createElement('div');
    hintBox.setAttribute('role','listbox');
    hintBox.style.position='absolute';
    hintBox.style.background='var(--surface)';
    hintBox.style.border='1px solid rgba(255,255,255,.08)';
    hintBox.style.borderRadius='12px';
    hintBox.style.boxShadow='var(--shadow)';
    hintBox.style.marginTop='6px';
    hintBox.style.padding='6px';
    hintBox.style.zIndex='40';
    hintBox.style.display='none';
    input.parentElement.style.position='relative';
    input.parentElement.appendChild(hintBox);
    document.addEventListener('click', (ev)=>{
      if(!hintBox.contains(ev.target) && ev.target!==input){ hintBox.style.display='none'; }
    });
    return hintBox;
  }

  function renderHints(value){
    const hb = ensureHint();
    const q = value.trim();
    if(!q){ hb.style.display='none'; return; }
    const list = Search.search({ q }).slice(0,6);
    if(!list.length){ hb.style.display='none'; return; }
    hb.innerHTML = list.map(r=>`
      <button type="button" role="option" class="chip" style="width:100%;justify-content:flex-start;margin:2px 0" data-fill="${r.name}">
        🔎 ${r.name} · <span class="mono" style="opacity:.8">${r.loc}</span>
      </button>`).join('');
    hb.style.display='block';
    hb.onclick = (e)=>{
      const b = e.target.closest('[data-fill]');
      if(!b) return;
      input.value = b.dataset.fill;
      hb.style.display='none';
      $('#btnSearch').click();
    };
  }

  input.addEventListener('input', debounce((e)=> renderHints(e.target.value), 180));
})();

/* ---------- Exponer App (para próximos bloques) ---------- */
window.App = {
  Router, Search, tpl, renderHTML, Str, paginate, renderGrid,
  Toast, parseQS, toQS
};

// Despachar ruta actual (sobrescribe el renderRoute simple del bloque 1)
document.addEventListener('DOMContentLoaded', () => {
  Router.dispatch();
});

