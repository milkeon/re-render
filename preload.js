const { contextBridge, desktopCapturer } = require('electron');

const APP_TITLE_HINTS = [
  're:render',
  'screen-reframe',
  're-render',
];

function isOwnWindowName(name) {
  const value = String(name || '').toLowerCase();
  return APP_TITLE_HINTS.some((hint) => value.includes(hint));
}

async function listRunningSources() {
  const sources = await desktopCapturer.getSources({
    types: ['window', 'screen'],
    thumbnailSize: { width: 1280, height: 720 },
    fetchWindowIcons: true,
  });

  return sources
    .filter((source) => {
      if (!source || !source.name) return false;
      const kind = source.id.startsWith('screen:') ? 'screen' : 'window';
      return kind === 'screen' || !isOwnWindowName(source.name);
    })
    .map((source) => {
      const size = source.thumbnail.getSize();
      const kind = source.id.startsWith('screen:') ? 'screen' : 'window';
      return {
        id: source.id,
        name: source.name,
        kind,
        preview: source.thumbnail.toDataURL(),
        width: size.width,
        height: size.height,
      };
    })
    .sort((a, b) => {
      const kindOrder = a.kind === b.kind ? 0 : a.kind === 'window' ? -1 : 1;
      return kindOrder || a.name.localeCompare(b.name, 'ko');
    });
}

contextBridge.exposeInMainWorld('__rerenderNative', {
  listRunningSources,
  listRunningWindows: async () => {
    const sources = await listRunningSources();
    return sources.filter((source) => source.kind === 'window');
  },
  listRunningScreens: async () => {
    const sources = await listRunningSources();
    return sources.filter((source) => source.kind === 'screen');
  },
});
