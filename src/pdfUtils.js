import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

/** Wait for all <img> inside el to finish loading */
function waitForImages(el) {
  const imgs = [...el.querySelectorAll('img')]
  return Promise.all(
    imgs.map(img =>
      img.complete
        ? Promise.resolve()
        : new Promise(res => { img.onload = res; img.onerror = res })
    )
  )
}

/** Capture a DOM element as a base64 JPEG */
export async function captureElement(el) {
  await waitForImages(el)
  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    allowTaint: false,
    backgroundColor: '#ffffff',
    logging: false,
    imageTimeout: 20000,
    width:  el.offsetWidth,
    height: el.offsetHeight,
  })
  return canvas.toDataURL('image/jpeg', 0.92)
}

/**
 * Capture an array of DOM elements and assemble a jsPDF document.
 * onProgress(0-100) is called after each page.
 */
export async function buildPdf(elements, onProgress) {
  await document.fonts.ready

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  for (let i = 0; i < elements.length; i++) {
    if (i > 0) pdf.addPage()
    const imgData = await captureElement(elements[i])
    pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297)
    onProgress?.(Math.round(((i + 1) / elements.length) * 100))
  }

  return pdf
}
