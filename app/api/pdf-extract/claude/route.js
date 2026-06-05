const { extractImageFromPdf } = require('./extract-image-pdf');

export default async function handler(req, res) {
  const result = await extractImageFromPdf(req.body);
  res.status(200).json({ image: result });
}
