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

async function listRunningWindows() {
  const sources = await desktopCapturer.getSources({
    types: ['window'],
    thumbnailSize: { width: 960, height: 540 },
    fetchWindowIcons: true,
  });

  return sources
    .filter((source) => source && source.name && !isOwnWindowName(source.name))
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

contextBridge.exposeInMainWorld('__rerenderNative', {
  listRunningWindows,
});
