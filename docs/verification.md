# Verification log

## Electron build
- `node --check main.js`
- `node --check preload.js`
- `node --check renderer.js`
- `npm run package`
- Output created at `dist/linux-unpacked/`

## Runtime check
- `npm start` initially failed because the host lacked `libgtk-3.so.0`
- Installed the required GTK runtime packages with `apt-get`
- `xvfb-run -a npm start` launches successfully in a headless display session
- `xvfb-run -a ./dist/linux-unpacked/re-render` also stays running, confirming the packaged build boots

## Behavioral checklist
- Window list comes from the native bridge
- Fake preset windows are removed
- Minimaps accept click-and-drag to define a new crop
- Main canvas renders the selected crop
