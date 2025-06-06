import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'

// Interfața pentru datele de facturare
interface InvoiceData {
  // Date rezervare
  bookingNumber: string
  licensePlate: string
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  days: number
  subtotal: number // Fără TVA
  tva: number      // TVA 19%
  total: number    // Cu TVA
  
  // Date client
  clientName: string
  clientEmail: string
  clientPhone?: string
  clientAddress?: string
  clientCity?: string
  clientCounty?: string
  clientPostalCode?: string
  
  // Date pentru facturare (opțional - doar pentru persoane juridice)
  company?: string
  companyVAT?: string // CUI/CIF
  companyReg?: string // Număr Registrul Comerțului
  companyAddress?: string
  needInvoice?: boolean
  
  // Date factura
  invoiceNumber: string
  invoiceDate: Date
  dueDate: Date
  
  // Metadata
  paymentIntentId?: string
  source: "webhook" | "test_mode" | "manual"
}

// Date companie
const COMPANY_DATA = {
  name: "PARCARE-AEROPORT SRL",
  cui: "RO12345678",
  regCom: "J23/1234/2023",
  address: "Șoseaua București-Ploiești 42A",
  city: "Otopeni",
  county: "Ilfov",
  postalCode: "075100",
  phone: "+40 123 456 789",
  email: "facturare@parcare-aeroport.ro",
  website: "www.parcare-aeroport.ro",
  bank: "BCR BUCUREȘTI",
  iban: "RO49 RNCB 0082 0195 2533 0001",
  // TVA
  tvaRate: 19, // procent
  isTvaPlyer: true
}

/**
 * Generează numărul de factură în format: FAC-YYYY-NNNNNN
 */
export function generateInvoiceNumber(): string {
  const year = new Date().getFullYear()
  const randomNumber = Math.floor(100000 + Math.random() * 900000) // 6 cifre
  return `FAC-${year}-${randomNumber}`
}

/**
 * Generează documentul PDF pentru factură
 */
export async function generateInvoicePDF(invoiceData: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'A4', 
        margin: 50,
        info: {
          Title: `Factura ${invoiceData.invoiceNumber}`,
          Author: COMPANY_DATA.name,
          Subject: `Servicii parcare - Rezervarea ${invoiceData.bookingNumber}`,
          Creator: 'Parcare-Aeroport System',
          Producer: 'PDFKit'
        }
      })
      
      const chunks: Buffer[] = []
      
      doc.on('data', chunk => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      // Header cu logo și date companie
      addHeader(doc, invoiceData)
      
      // Date client
      addClientInfo(doc, invoiceData)
      
      // Tabelul cu serviciile
      addServicesTable(doc, invoiceData)
      
      // Total și TVA
      addTotalsSection(doc, invoiceData)
      
      // Footer cu informații legale
      addFooter(doc, invoiceData)
      
      doc.end()
      
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Header cu logo și date companie
 */
function addHeader(doc: PDFDocument, invoiceData: InvoiceData) {
  const pageWidth = doc.page.width - 100 // margin 50 pe fiecare parte
  
  // Logo placeholder (dacă există)
  doc.fontSize(20)
     .font('Helvetica-Bold')
     .fillColor('#ff0066')
     .text('🅿️ ' + COMPANY_DATA.name, 50, 50)
  
  // Date companie
  doc.fontSize(10)
     .font('Helvetica')
     .fillColor('#333333')
     .text(COMPANY_DATA.address, 50, 80)
     .text(`${COMPANY_DATA.city}, ${COMPANY_DATA.county} ${COMPANY_DATA.postalCode}`, 50, 95)
     .text(`CUI: ${COMPANY_DATA.cui} | Reg. Com.: ${COMPANY_DATA.regCom}`, 50, 110)
     .text(`Tel: ${COMPANY_DATA.phone} | Email: ${COMPANY_DATA.email}`, 50, 125)
     .text(`IBAN: ${COMPANY_DATA.iban}`, 50, 140)
  
  // Titlu FACTURĂ
  doc.fontSize(24)
     .font('Helvetica-Bold')
     .fillColor('#ff0066')
     .text('FACTURĂ FISCALĂ', pageWidth - 200, 50, { width: 200, align: 'right' })
  
  // Numărul facturii și data
  doc.fontSize(12)
     .font('Helvetica')
     .fillColor('#333333')
     .text(`Nr: ${invoiceData.invoiceNumber}`, pageWidth - 200, 85, { width: 200, align: 'right' })
     .text(`Data: ${invoiceData.invoiceDate.toLocaleDateString('ro-RO')}`, pageWidth - 200, 100, { width: 200, align: 'right' })
     .text(`Scadența: ${invoiceData.dueDate.toLocaleDateString('ro-RO')}`, pageWidth - 200, 115, { width: 200, align: 'right' })
  
  // Linie separator
  doc.strokeColor('#dddddd')
     .lineWidth(1)
     .moveTo(50, 170)
     .lineTo(pageWidth + 50, 170)
     .stroke()
}

/**
 * Informații client
 */
function addClientInfo(doc: PDFDocument, invoiceData: InvoiceData) {
  let yPos = 190
  
  // Furnizor
  doc.fontSize(14)
     .font('Helvetica-Bold')
     .fillColor('#333333')
     .text('FURNIZOR:', 50, yPos)
  
  doc.fontSize(10)
     .font('Helvetica')
     .text(COMPANY_DATA.name, 50, yPos + 20)
     .text(`CUI: ${COMPANY_DATA.cui}`, 50, yPos + 35)
     .text(COMPANY_DATA.address, 50, yPos + 50)
     .text(`${COMPANY_DATA.city}, ${COMPANY_DATA.county}`, 50, yPos + 65)
  
  // Client
  const clientX = 300
  doc.fontSize(14)
     .font('Helvetica-Bold')
     .text('CLIENT:', clientX, yPos)
  
  doc.fontSize(10)
     .font('Helvetica')
  
  if (invoiceData.needInvoice && invoiceData.company) {
    // Persoană juridică
    doc.text(invoiceData.company, clientX, yPos + 20)
    if (invoiceData.companyVAT) {
      doc.text(`CUI: ${invoiceData.companyVAT}`, clientX, yPos + 35)
    }
    if (invoiceData.companyReg) {
      doc.text(`Reg. Com.: ${invoiceData.companyReg}`, clientX, yPos + 50)
    }
    if (invoiceData.companyAddress) {
      doc.text(invoiceData.companyAddress, clientX, yPos + 65)
    }
  } else {
    // Persoană fizică
    doc.text(invoiceData.clientName, clientX, yPos + 20)
    if (invoiceData.clientAddress) {
      doc.text(invoiceData.clientAddress, clientX, yPos + 35)
    }
    if (invoiceData.clientCity && invoiceData.clientCounty) {
      doc.text(`${invoiceData.clientCity}, ${invoiceData.clientCounty}`, clientX, yPos + 50)
    }
  }
  
  if (invoiceData.clientEmail) {
    doc.text(`Email: ${invoiceData.clientEmail}`, clientX, yPos + 80)
  }
  if (invoiceData.clientPhone) {
    doc.text(`Tel: ${invoiceData.clientPhone}`, clientX, yPos + 95)
  }
}

/**
 * Tabel cu serviciile
 */
function addServicesTable(doc: PDFDocument, invoiceData: InvoiceData) {
  const tableY = 320
  const pageWidth = doc.page.width - 100
  
  // Header tabel
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .fillColor('#ffffff')
     .rect(50, tableY, pageWidth, 25)
     .fill('#ff0066')
  
  // Coloanele
  doc.fillColor('#ffffff')
     .text('Descriere serviciu', 55, tableY + 8, { width: 250 })
     .text('U.M.', 310, tableY + 8, { width: 40, align: 'center' })
     .text('Cant.', 355, tableY + 8, { width: 40, align: 'center' })
     .text('Preț unit.', 400, tableY + 8, { width: 60, align: 'right' })
     .text('Valoare', 465, tableY + 8, { width: 80, align: 'right' })
  
  // Linia de serviciu
  const serviceY = tableY + 30
  doc.fontSize(10)
     .font('Helvetica')
     .fillColor('#333333')
  
  const serviceName = `Servicii parcare autoturism - ${invoiceData.licensePlate}`
  const serviceDescription = `Perioada: ${invoiceData.startDate} ${invoiceData.startTime} - ${invoiceData.endDate} ${invoiceData.endTime}`
  
  doc.text(serviceName, 55, serviceY)
     .text(serviceDescription, 55, serviceY + 12, { fontSize: 8, fillColor: '#666666' })
     .text(`Rezervarea nr: ${invoiceData.bookingNumber}`, 55, serviceY + 24, { fontSize: 8, fillColor: '#666666' })
     .text('zi', 310, serviceY, { width: 40, align: 'center' })
     .text(invoiceData.days.toString(), 355, serviceY, { width: 40, align: 'center' })
     .text(`${(invoiceData.subtotal / invoiceData.days).toFixed(2)}`, 400, serviceY, { width: 60, align: 'right' })
     .text(`${invoiceData.subtotal.toFixed(2)}`, 465, serviceY, { width: 80, align: 'right' })
  
  // Linie separator
  doc.strokeColor('#dddddd')
     .lineWidth(0.5)
     .moveTo(50, serviceY + 40)
     .lineTo(pageWidth + 50, serviceY + 40)
     .stroke()
}

/**
 * Secțiunea cu totaluri
 */
function addTotalsSection(doc: PDFDocument, invoiceData: InvoiceData) {
  const totalsY = 420
  const rightX = 400
  
  doc.fontSize(10)
     .font('Helvetica')
     .fillColor('#333333')
  
  // Subtotal
  doc.text('Subtotal (fără TVA):', rightX, totalsY, { width: 100, align: 'left' })
     .text(`${invoiceData.subtotal.toFixed(2)} RON`, rightX + 100, totalsY, { width: 80, align: 'right' })
  
  // TVA
  doc.text(`TVA (${COMPANY_DATA.tvaRate}%):`, rightX, totalsY + 15, { width: 100, align: 'left' })
     .text(`${invoiceData.tva.toFixed(2)} RON`, rightX + 100, totalsY + 15, { width: 80, align: 'right' })
  
  // Linie
  doc.strokeColor('#333333')
     .lineWidth(0.5)
     .moveTo(rightX, totalsY + 30)
     .lineTo(rightX + 180, totalsY + 30)
     .stroke()
  
  // Total
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .text('TOTAL DE PLATĂ:', rightX, totalsY + 40, { width: 100, align: 'left' })
     .text(`${invoiceData.total.toFixed(2)} RON`, rightX + 100, totalsY + 40, { width: 80, align: 'right' })
  
  // Status plată
  const paymentStatus = invoiceData.source === 'test_mode' ? 'NEPLĂTIT (TEST)' : 'PLĂTIT'
  const statusColor = invoiceData.source === 'test_mode' ? '#ff6b35' : '#28a745'
  
  doc.fontSize(10)
     .font('Helvetica-Bold')
     .fillColor(statusColor)
     .text(`Status: ${paymentStatus}`, rightX, totalsY + 60, { width: 180, align: 'center' })
  
  if (invoiceData.paymentIntentId && invoiceData.source !== 'test_mode') {
    doc.fontSize(8)
       .fillColor('#666666')
       .text(`ID Tranzacție: ${invoiceData.paymentIntentId}`, rightX, totalsY + 75, { width: 180, align: 'center' })
  }
}

/**
 * Footer cu informații legale
 */
function addFooter(doc: PDFDocument, invoiceData: InvoiceData) {
  const footerY = doc.page.height - 120
  const pageWidth = doc.page.width - 100
  
  // Linie separator
  doc.strokeColor('#dddddd')
     .lineWidth(0.5)
     .moveTo(50, footerY - 20)
     .lineTo(pageWidth + 50, footerY - 20)
     .stroke()
  
  doc.fontSize(8)
     .font('Helvetica')
     .fillColor('#666666')
  
  // Informații legale
  doc.text('Această factură este generată electronic și este valabilă fără semnătură și ștampilă conform', 50, footerY)
     .text('Legii nr. 571/2003 privind Codul fiscal și normelor metodologice de aplicare.', 50, footerY + 10)
  
  doc.text(`Societatea este înregistrată la Registrul Comerțului cu nr. ${COMPANY_DATA.regCom}`, 50, footerY + 25)
  
  doc.text(`Capital social: 200 RON | Cont bancar: ${COMPANY_DATA.iban}`, 50, footerY + 40)
  
  // Data generării
  doc.text(`Factură generată la: ${new Date().toLocaleString('ro-RO')}`, 50, footerY + 55)
  
  // Numărul paginii
  doc.text('Pagina 1 din 1', pageWidth - 50, footerY + 55, { width: 100, align: 'right' })
}

/**
 * Prepară datele pentru facturare din booking
 */
export function prepareInvoiceData(bookingData: any, invoiceNumber?: string): InvoiceData {
  const invoiceDate = new Date()
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 30) // 30 zile termen de plată
  
  // Calculează subtotal și TVA
  const total = bookingData.amount || 0
  const subtotal = total / (1 + COMPANY_DATA.tvaRate / 100)
  const tva = total - subtotal
  
  return {
    // Date rezervare
    bookingNumber: bookingData.apiBookingNumber || bookingData.id || 'N/A',
    licensePlate: bookingData.licensePlate,
    startDate: bookingData.startDate,
    startTime: bookingData.startTime,
    endDate: bookingData.endDate,
    endTime: bookingData.endTime,
    days: bookingData.days || 1,
    subtotal,
    tva,
    total,
    
    // Date client
    clientName: bookingData.clientName || '',
    clientEmail: bookingData.clientEmail || '',
    clientPhone: bookingData.clientPhone,
    clientAddress: bookingData.address,
    clientCity: bookingData.city,
    clientCounty: bookingData.county,
    clientPostalCode: bookingData.postalCode,
    
    // Date pentru facturare
    company: bookingData.company,
    companyVAT: bookingData.companyVAT,
    companyReg: bookingData.companyReg,
    companyAddress: bookingData.companyAddress,
    needInvoice: bookingData.needInvoice,
    
    // Date factura
    invoiceNumber: invoiceNumber || generateInvoiceNumber(),
    invoiceDate,
    dueDate,
    
    // Metadata
    paymentIntentId: bookingData.paymentIntentId,
    source: bookingData.source || 'manual'
  }
}

export default {
  generateInvoicePDF,
  generateInvoiceNumber,
  prepareInvoiceData
} 