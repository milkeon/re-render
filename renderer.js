const { desktopCapturer } = typeof require === 'function' ? require('electron') : {};

async function listRunningWindows() {
  if (!desktopCapturer) return [];
  const sources = await desktopCapturer.getSources({
    types: ['window'],
    thumbnailSize: { width: 960, height: 540 },
    fetchWindowIcons: true,
  });

  return sources
    .filter((source) => source && source.name && !/re:render|screen-reframe|re-render/i.test(source.name))
    .map((source) => {
      const size = source.thumbnail.getSize();
      return {
        id: source.id,
        name: source.name,
        kind: 'window',
        preview: source.thumbnail.toDataURL(),
        width: size.width,
        height: size.height,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'));
}

window.__rerenderNative = window.__rerenderNative || {};
window.__rerenderNative.listRunningWindows = listRunningWindows;

const mainCanvas = document.getElementById('mainCanvas');
const miniCanvas = document.getElementById('miniCanvas');
const sourceButton = document.getElementById('sourceButton');
const sourceMenu = document.getElementById('sourceMenu');
const currentSourceName = document.getElementById('currentSourceName');
const currentSourceMeta = document.getElementById('currentSourceMeta');
const statusLine = document.getElementById('statusLine');
const emptyState = document.getElementById('emptyState');

const mainCtx = mainCanvas.getContext('2d');
const miniCtx = miniCanvas.getContext('2d');

const state = {
  sources: [],
  source: null,
  image: null,
  imageKey: '',
  selection: null,
  dragSelection: null,
  dragStart: null,
  dragging: false,
  refreshTimer: null,
  dpr: window.devicePixelRatio || 1,
  raf: 0,
  loadedAt: 0,
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function setStatus(text) {
  statusLine.textContent = text;
}

function defaultSelection() {
  if (!state.image) {
    return { x: 0, y: 0, w: 1920, h: 1080 };
  }
  const w = state.image.width;
  const h = state.image.height;
  const cropW = Math.max(160, Math.floor(w * 0.56));
  const cropH = Math.max(120, Math.floor(h * 0.56));
  return {
    x: Math.floor((w - cropW) / 2),
    y: Math.floor((h - cropH) / 2),
    w: cropW,
    h: cropH,
  };
}

function normalizeSelection(start, end) {
  if (!state.image) return null;
  const minSize = 48;
  const imgW = state.image.width;
  const imgH = state.image.height;
  const x1 = clamp(Math.min(start.x, end.x), 0, imgW - minSize);
  const y1 = clamp(Math.min(start.y, end.y), 0, imgH - minSize);
  const x2 = clamp(Math.max(start.x, end.x), minSize, imgW);
  const y2 = clamp(Math.max(start.y, end.y), minSize, imgH);
  const w = clamp(Math.max(minSize, x2 - x1), minSize, imgW);
  const h = clamp(Math.max(minSize, y2 - y1), minSize, imgH);
  return {
    x: clamp(x1, 0, imgW - w),
    y: clamp(y1, 0, imgH - h),
    w,
    h,
  };
}

function fitContain(srcW, srcH, dstW, dstH) {
  const scale = Math.min(dstW / srcW, dstH / srcH);
  const w = srcW * scale;
  const h = srcH * scale;
  return {
    x: (dstW - w) / 2,
    y: (dstH - h) / 2,
    w,
    h,
    scale,
  };
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function updateWindowState() {
  window.__rerenderState = {
    source: state.source,
    selection: state.selection || state.dragSelection,
    loadedAt: state.loadedAt,
  };
}

function clampSelectionToImage(selection) {
  if (!state.image) return null;
  const imgW = state.image.width;
  const imgH = state.image.height;
  return {
    x: clamp(selection.x, 0, Math.max(0, imgW - selection.w)),
    y: clamp(selection.y, 0, Math.max(0, imgH - selection.h)),
    w: clamp(selection.w, 48, imgW),
    h: clamp(selection.h, 48, imgH),
  };
}

function selectSource(source) {
  state.source = source;
  state.selection = null;
  state.dragSelection = null;
  state.dragStart = null;
  state.image = null;
  state.imageKey = '';
  currentSourceName.textContent = source ? source.name : '실행 중 창을 선택하세요';
  currentSourceMeta.textContent = source ? `${source.width}×${source.height}` : '실제 실행 중 창 목록만 표시';
  emptyState.style.display = source ? 'none' : 'flex';
  sourceButton.disabled = !source && state.sources.length === 0;
  updateMenuHighlight();
  updateWindowState();
  if (!source) {
    setStatus('실행 중 창이 없습니다.');
    render();
    return;
  }
  setStatus(`선택됨: ${source.name}`);
  refreshSourcePreview(true);
}

function updateMenuHighlight() {
  [...sourceMenu.querySelectorAll('.option')].forEach((row) => {
    row.classList.toggle('active', row.dataset.id === (state.source && state.source.id));
  });
}

function buildMenu() {
  sourceMenu.innerHTML = '';
  if (!state.sources.length) {
    const empty = document.createElement('div');
    empty.className = 'menu-empty';
    empty.textContent = '실행 중 창을 찾지 못했습니다.';
    sourceMenu.appendChild(empty);
    return;
  }

  for (const source of state.sources) {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'option';
    row.dataset.id = source.id;
    row.innerHTML = `
      <span class="thumb" style="background-image:url('${source.preview}')"></span>
      <span class="info">
        <strong>${escapeHtml(source.name)}</strong>
        <small>${source.width}×${source.height}</small>
      </span>
      <span class="chev">▸</span>
    `;
    row.addEventListener('click', () => {
      selectSource(source);
      sourceMenu.classList.remove('open');
      sourceButton.setAttribute('aria-expanded', 'false');
    });
    sourceMenu.appendChild(row);
  }

  updateMenuHighlight();
}

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

async function refreshSources() {
  if (!window.__rerenderNative || typeof window.__rerenderNative.listRunningWindows !== 'function') {
    setStatus('네이티브 브리지를 찾지 못했습니다.');
    return;
  }

  setStatus('실행 중 창을 불러오는 중…');
  const list = await window.__rerenderNative.listRunningWindows();
  state.sources = Array.isArray(list) ? list : [];
  buildMenu();

  const current = state.source ? state.sources.find((item) => item.id === state.source.id) : null;
  if (!current) {
    selectSource(state.sources[0] || null);
    return;
  }

  if (current.preview !== state.imageKey) {
    await updatePreviewFromSource(current);
  } else {
    setStatus(`실행 중: ${current.name}`);
  }
}

async function updatePreviewFromSource(source) {
  if (!source) return;
  const image = await loadImage(source.preview);
  state.image = image;
  state.imageKey = source.preview;
  state.source = source;
  state.loadedAt = Date.now();
  if (!state.selection) {
    state.selection = defaultSelection();
  }
  state.selection = clampSelectionToImage(state.selection) || defaultSelection();
  currentSourceName.textContent = source.name;
  currentSourceMeta.textContent = `${source.width}×${source.height}`;
  emptyState.style.display = 'none';
  setStatus(`실행 중: ${source.name}`);
  updateMenuHighlight();
  updateWindowState();
  render();
}

function resizeCanvas(canvas, ctx) {
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width * state.dpr));
  const height = Math.max(1, Math.round(rect.height * state.dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
}

function drawGrid(ctx, width, height, step = 80) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.restore();
}

function renderMain() {
  const rect = mainCanvas.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;
  mainCtx.clearRect(0, 0, width, height);
  mainCtx.fillStyle = '#040712';
  mainCtx.fillRect(0, 0, width, height);
  drawGrid(mainCtx, width, height, 96);

  if (!state.image || !state.source) {
    mainCtx.save();
    mainCtx.fillStyle = 'rgba(255,255,255,0.92)';
    mainCtx.font = '700 26px Inter, system-ui, sans-serif';
    mainCtx.fillText('실행 중 창을 선택하면 여기에 크게 다시 보여줍니다.', 36, 68);
    mainCtx.fillStyle = 'rgba(158,176,207,0.92)';
    mainCtx.font = '500 16px Inter, system-ui, sans-serif';
    mainCtx.fillText('오른쪽 아래 미니맵에서 드래그로 다시 보고 싶은 영역을 잡아주세요.', 36, 100);
    mainCtx.restore();
    return;
  }

  const selection = state.dragSelection || state.selection || defaultSelection();
  mainCtx.save();
  mainCtx.imageSmoothingEnabled = true;
  mainCtx.drawImage(
    state.image,
    selection.x,
    selection.y,
    selection.w,
    selection.h,
    0,
    0,
    width,
    height,
  );
  mainCtx.restore();

  const overlay = mainCtx.createLinearGradient(0, 0, width, height);
  overlay.addColorStop(0, 'rgba(0,0,0,0.20)');
  overlay.addColorStop(1, 'rgba(0,0,0,0.06)');
  mainCtx.fillStyle = overlay;
  mainCtx.fillRect(0, 0, width, height);

  mainCtx.save();
  mainCtx.strokeStyle = 'rgba(255,255,255,0.18)';
  mainCtx.lineWidth = 1;
  mainCtx.strokeRect(18.5, 18.5, width - 37, height - 37);
  mainCtx.restore();
}

function renderMiniMap() {
  const rect = miniCanvas.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;
  miniCtx.clearRect(0, 0, width, height);
  miniCtx.fillStyle = '#070b16';
  miniCtx.fillRect(0, 0, width, height);

  if (!state.image) {
    miniCtx.save();
    miniCtx.fillStyle = 'rgba(255,255,255,0.55)';
    miniCtx.font = '600 14px Inter, system-ui, sans-serif';
    miniCtx.fillText('미니맵은 창을 선택한 뒤 표시됩니다.', 18, 30);
    miniCtx.restore();
    return;
  }

  const fit = fitContain(state.image.width, state.image.height, width, height);
  miniCtx.drawImage(state.image, fit.x, fit.y, fit.w, fit.h);

  const selection = state.dragSelection || state.selection;
  if (selection) {
    const x = fit.x + selection.x * fit.scale;
    const y = fit.y + selection.y * fit.scale;
    const w = selection.w * fit.scale;
    const h = selection.h * fit.scale;

    miniCtx.save();
    miniCtx.fillStyle = 'rgba(255,255,255,0.08)';
    miniCtx.fillRect(x, y, w, h);
    miniCtx.strokeStyle = 'rgba(255,255,255,0.96)';
    miniCtx.lineWidth = 2;
    miniCtx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    miniCtx.fillStyle = '#ffffff';
    const handle = 6;
    [[x, y], [x + w / 2, y], [x + w, y], [x, y + h / 2], [x + w, y + h / 2], [x, y + h], [x + w / 2, y + h], [x + w, y + h]].forEach(([hx, hy]) => {
      miniCtx.fillRect(hx - handle / 2, hy - handle / 2, handle, handle);
    });
    miniCtx.restore();
  }
}

function render() {
  cancelAnimationFrame(state.raf);
  state.raf = requestAnimationFrame(() => {
    resizeCanvas(mainCanvas, mainCtx);
    resizeCanvas(miniCanvas, miniCtx);
    renderMain();
    renderMiniMap();
  });
}

function toImagePoint(event) {
  if (!state.image) return null;
  const rect = miniCanvas.getBoundingClientRect();
  const fit = fitContain(state.image.width, state.image.height, rect.width, rect.height);
  const px = event.clientX - rect.left;
  const py = event.clientY - rect.top;
  if (px < fit.x || py < fit.y || px > fit.x + fit.w || py > fit.y + fit.h) return null;
  return {
    x: (px - fit.x) / fit.scale,
    y: (py - fit.y) / fit.scale,
  };
}

function startDrag(point) {
  state.dragging = true;
  state.dragStart = point;
  state.dragSelection = {
    x: point.x,
    y: point.y,
    w: 0,
    h: 0,
  };
  miniCanvas.classList.add('dragging');
  updateWindowState();
  render();
}

function updateDrag(point) {
  if (!state.dragging || !state.dragStart) return;
  state.dragSelection = normalizeSelection(state.dragStart, point);
  updateWindowState();
  render();
}

function endDrag(point) {
  if (!state.dragging || !state.dragStart) return;
  const selection = normalizeSelection(state.dragStart, point);
  state.dragging = false;
  state.dragStart = null;
  miniCanvas.classList.remove('dragging');
  if (selection) {
    state.selection = selection;
    state.dragSelection = null;
    setStatus(`선택 영역: ${selection.w}×${selection.h}`);
  }
  updateWindowState();
  render();
}

miniCanvas.addEventListener('pointerdown', (event) => {
  if (!state.image) return;
  const point = toImagePoint(event);
  if (!point) return;
  miniCanvas.setPointerCapture(event.pointerId);
  startDrag(point);
});

miniCanvas.addEventListener('pointermove', (event) => {
  if (!state.dragging) return;
  const point = toImagePoint(event);
  if (!point) return;
  updateDrag(point);
});

miniCanvas.addEventListener('pointerup', (event) => {
  if (!state.dragging) return;
  const point = toImagePoint(event) || state.dragStart;
  endDrag(point);
});

miniCanvas.addEventListener('pointercancel', () => {
  state.dragging = false;
  state.dragStart = null;
  state.dragSelection = null;
  miniCanvas.classList.remove('dragging');
  updateWindowState();
  render();
});

sourceButton.addEventListener('click', () => {
  const open = sourceMenu.classList.toggle('open');
  sourceButton.setAttribute('aria-expanded', String(open));
});

document.addEventListener('click', (event) => {
  if (!sourceMenu.contains(event.target) && !sourceButton.contains(event.target)) {
    sourceMenu.classList.remove('open');
    sourceButton.setAttribute('aria-expanded', 'false');
  }
});

window.addEventListener('resize', render);
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    sourceMenu.classList.remove('open');
    sourceButton.setAttribute('aria-expanded', 'false');
  }
});

async function refreshSourcePreview(force = false) {
  const source = state.source;
  if (!source) return;
  try {
    if (force || source.preview !== state.imageKey || !state.image) {
      await updatePreviewFromSource(source);
    }
  } catch (error) {
    console.error(error);
    setStatus('창 미리보기를 불러오지 못했습니다.');
  }
}

async function boot() {
  render();
  await refreshSources();
  state.refreshTimer = setInterval(refreshSources, 1200);
}

boot().catch((error) => {
  console.error(error);
  setStatus('초기화 실패');
});
