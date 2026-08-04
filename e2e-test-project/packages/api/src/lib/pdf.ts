import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import QRCode from 'qrcode'
import type { Registration } from '@plenarias/shared'



export async function generateNominationPdf(registration: Registration): Promise<Buffer> {
  const doc = await PDFDocument.create()
  const page = doc.addPage([595, 842]) // A4

  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica)

  const { width, height } = page.getSize()
  const margin = 56

  // --- Franja superior ---
  page.drawRectangle({
    x: 0,
    y: height - 110,
    width,
    height: 110,
    color: rgb(0.149, 0.388, 0.922), // #2563EB accent
  })

  // Título en franja
  page.drawText('E2E TEST PLATFORM', {
    x: margin,
    y: height - 52,
    size: 18,
    font: fontBold,
    color: rgb(1, 1, 1),
  })
  page.drawText('PASE OFICIAL DE ACCESO', {
    x: margin,
    y: height - 78,
    size: 13,
    font: fontRegular,
    color: rgb(0.85, 0.91, 0.99),
  })

  // --- Datos del asistente ---
  let y = height - 155

  function drawField(label: string, value: string) {
    page.drawText(label.toUpperCase(), {
      x: margin,
      y,
      size: 8,
      font: fontRegular,
      color: rgb(0.42, 0.45, 0.5),
    })
    y -= 16
    page.drawText(value, {
      x: margin,
      y,
      size: 14,
      font: fontBold,
      color: rgb(0.06, 0.09, 0.16),
    })
    y -= 10
    // Línea divisora
    page.drawLine({
      start: { x: margin, y },
      end: { x: width - margin, y },
      thickness: 0.5,
      color: rgb(0.89, 0.91, 0.94),
    })
    y -= 24
  }

  drawField('Nombre completo', registration.fullName)
  
  
  const tierLabel = registration.ticketTier === 'vip' ? 'VIP' : registration.ticketTier === 'student' ? 'Estudiante' : 'General'
  drawField('Tipo de Entrada', tierLabel)
  

  // --- QR Code centrado ---
  y -= 10
  const qrData = registration.qrToken
  const qrPng = await QRCode.toBuffer(qrData, { type: 'png', width: 180, margin: 1 })
  const qrImage = await doc.embedPng(qrPng)
  const qrSize = 160
  const qrX = (width - qrSize) / 2

  page.drawImage(qrImage, { x: qrX, y: y - qrSize, width: qrSize, height: qrSize })

  page.drawText('Presenta este código en el acceso al evento', {
    x: margin,
    y: y - qrSize - 20,
    size: 9,
    font: fontRegular,
    color: rgb(0.42, 0.45, 0.5),
  })

  // --- Pie de página ---
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height: 40,
    color: rgb(0.95, 0.96, 0.98),
  })
  page.drawText('Documento oficial de acceso — Generado por platform-register', {
    x: margin,
    y: 14,
    size: 8,
    font: fontRegular,
    color: rgb(0.42, 0.45, 0.5),
  })

  const pdfBytes = await doc.save()
  return Buffer.from(pdfBytes)
}
