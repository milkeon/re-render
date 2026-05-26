# re:render

`re:render` is an Electron desktop app that lists *real running windows*, shows their live thumbnails, and lets you redraw a selected region with a simple drag-based minimap.

## What it does
- Shows only actual running windows from the OS bridge
- Lets you choose a window with one button
- Uses the bottom-right minimap to **click + drag** a new crop region
- Renders the selected crop full-screen in the main view
- Refreshes window thumbnails automatically so the preview stays live

## Tech stack
- Electron
- TypeScript-ready structure with plain JavaScript renderer files for now
- `desktopCapturer` bridge via `preload.js`
- Canvas-based rendering for the main view and minimap

## Run locally
```bash
cd /home/ubuntu/projects/screen-reframe
npm install
npm start
```

## Package
```bash
npm run package
```

This creates an unpacked Linux build in:
- `dist/linux-unpacked/`

## Notes
- The app intentionally filters out its own window from the source list.
- The current implementation uses real window thumbnails, not fake presets.
- The minimap is a selection tool, not a panning tool.

## Project goal
Turn a selected running window into a simple re-rendered viewport that can be re-cropped instantly.
