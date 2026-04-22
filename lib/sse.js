// lib/sse.js
export const sendSSE = (message) => {
  const encoder = new TextEncoder();

  if (!global.sseClients) return;

  const clients = [...global.sseClients]; // copy to avoid mutation during iteration

  clients.forEach((controller) => {
    try {
      controller.enqueue(encoder.encode(`data: ${message}\n\n`));
    } catch (err) {
      console.log('Removed closed SSE client');
      global.sseClients = global.sseClients.filter(c => c !== controller);
    }
  });
};
