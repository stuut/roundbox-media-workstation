// lib/watcher.js
import chokidar from 'chokidar';

if (!global.watcherStarted) {
  global.watcherStarted = true;

  console.log("Starting file watcher...");

  global.watcher = chokidar.watch('./public/temp-images', {
    usePolling: true,
    interval: 200,
    ignoreInitial: true,
    persistent: true,
  });

  const events = ['add', 'change', 'unlink'];
  events.forEach((eventType) => {
    global.watcher.on(eventType, (filePath) => {
      console.log(`File ${eventType}:`, filePath);

      const relativePath = filePath.split('/public')[1];

      if (!global.sseClients) return;

      const encoder = new TextEncoder();

      // iterate over a copy to avoid issues
      const clients = [...global.sseClients];
      clients.forEach((controller) => {
        try {
          controller.enqueue(encoder.encode(`data: ${relativePath}\n\n`));
        } catch (err) {
          // controller is closed, remove from global array
          console.log('Removed closed SSE client');
          global.sseClients = global.sseClients.filter(c => c !== controller);
        }
      });
    });
  });
}

export const initWatcher = () => {};
