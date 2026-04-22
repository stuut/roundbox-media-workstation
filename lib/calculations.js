export function convertMMToPixels(mm, dpi){
  const mmToInch = 1 / 25.4;
  return Math.round(mm * mmToInch * dpi);

}
