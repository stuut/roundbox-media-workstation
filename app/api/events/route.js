// app/api/watch/route.ts
import chokidar from "chokidar"

export async function GET(request) {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()
      const watcher = chokidar.watch("./public/edit-images")

      // Handle file events
      const handleEvent = (event, path) => {
        const message = `${event.toUpperCase()}: ${path}`
        const relativePath = path.split('public')[1]

        if (event === 'change'){
          controller.enqueue(encoder.encode(`data: ${relativePath }\n\n`))
        }



      }

      watcher.on("add", p => handleEvent("add", p))
      watcher.on("change", p => handleEvent("change", p))
      watcher.on("unlink", p => handleEvent("unlink", p))

      // Cleanup watcher on close

      request.signal.onabort = () => {
        watcher.close();
    };



    }
  })

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream" }
  })
}
