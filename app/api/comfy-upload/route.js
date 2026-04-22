
export async function POST(req) {
  try {

    const formData = await req.formData();
    const file = formData.get("file");

    const serverAddress = "http://127.0.0.1:8188";

    const comfyFormData = new FormData();
    comfyFormData.append("image", file);
    comfyFormData.append("overwrite", "true"); // Optional: set to true to replace existing files

    const response = await fetch(`http://127.0.0.1:8188/upload/image`, {
        method: "POST",
        body: comfyFormData
    });

    if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    //return data; // Returns { name: "filename.png", subfolder: "", type: "input" }

    return new Response(
      JSON.stringify({ data: data }),
      { status: 200 }
    );
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: 'Conversion failed' }),
      { status: 500 }
    );
  }
}
