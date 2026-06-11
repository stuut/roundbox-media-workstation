

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
        width: width?width:1024,
        height: height?height:1024,
        steps: 4,
        stream: false
      })
    })


    const data = await response.json();

     return Response.json({base64Image:data.image},{status: 200});

  }catch(error){
      console.log(error)
  }

}
