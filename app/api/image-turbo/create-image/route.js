export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb"
    }
  }
}

export async function POST(req) {
  const {prompt, width, height} = await req.json();



  try{

    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'x/z-image-turbo:fp8',
        prompt: prompt,
        width: width,
        height: height,
        steps: 4,
        stream: false
      })
    })


    const data = await response.json();
    console.log('data', data)

     return Response.json({base64Image:data.image},{status: 200});

  }catch(error){
      console.log(error)
  }

}
