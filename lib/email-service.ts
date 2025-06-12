// Notă: Trebuie instalat pachetul: npm install nodemailer @types/nodemailer

import { generateMultiparkQRBuffer } from './qr-generator'
import nodemailer from 'nodemailer'

// Interfață pentru datele de rezervare pentru email
interface BookingEmailData {
  // Date client
  clientName: string
  clientEmail: string
  clientPhone?: string
  
  // Date rezervare
  licensePlate: string
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  days: number
  amount: number
  
  // Date sistem
  bookingNumber: string
  status: string
  source: "webhook" | "test_mode" | "manual"
  createdAt: Date
}

/**
 * Configurează transporterul Nodemailer pentru Gmail
 */
function createEmailTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER, // Adaugă în .env.local
      pass: process.env.GMAIL_APP_PASSWORD, // App Password generat în Gmail
    },
  })
}

/**
 * Generează HTML-ul pentru email-ul de confirmare
 */
function generateBookingEmailHTML(bookingData: BookingEmailData): string {
  const formattedBookingNumber = bookingData.bookingNumber.padStart(6, '0')
  const isTestMode = bookingData.source === 'test_mode'
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Confirmare Rezervare Parcare</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ff0066, #e6005c); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .logo { max-width: 200px; height: auto; margin: 0 auto 15px; display: block; }
        .header h1 { color: #ffffff; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); margin: 10px 0; }
        .header p { color: #f0f8ff; font-size: 16px; margin: 5px 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
        .detail-label { font-weight: bold; color: #666; }
        .detail-value { color: #333; }
        .qr-section { text-align: center; background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .qr-code { max-width: 200px; height: auto; border: 2px solid #ddd; border-radius: 8px; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .test-mode { background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .contact-section { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .contact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .contact-item { text-align: center; padding: 10px; }
        .contact-item h4 { margin: 0 0 5px; color: #ff0066; font-size: 14px; }
        .contact-item p { margin: 0; font-size: 13px; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
        @media (max-width: 600px) {
          .contact-grid { grid-template-columns: 1fr; gap: 10px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🅿️ Confirmare Rezervare Parcare</h1>
          <p>Rezervarea dumneavoastră a fost confirmată cu succes!</p>
        </div>
        
        <div class="content">
          ${isTestMode ? `
            <div class="test-mode">
              <strong>⚠️ REZERVARE DE TEST</strong><br>
              Aceasta este o rezervare de test. Nu s-a procesat nicio plată.
            </div>
          ` : ''}
          
          <h2>Detalii Rezervare</h2>
          <div class="booking-details">
            <div class="detail-row">
              <span class="detail-label">Număr Rezervare:</span>
              <span class="detail-value"><strong>${formattedBookingNumber}</strong></span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Număr Înmatriculare:</span>
              <span class="detail-value">${bookingData.licensePlate}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Data Intrare:</span>
              <span class="detail-value">${bookingData.startDate} ${bookingData.startTime}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Data Ieșire:</span>
              <span class="detail-value">${bookingData.endDate} ${bookingData.endTime}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Durată:</span>
              <span class="detail-value">${bookingData.days} ${bookingData.days === 1 ? 'zi' : 'zile'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Preț Total:</span>
              <span class="detail-value"><strong>${bookingData.amount.toFixed(2)} RON</strong></span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Status:</span>
              <span class="detail-value">${isTestMode ? 'Confirmat (Test)' : 'Confirmat și Plătit'}</span>
            </div>
          </div>
          
          <div class="qr-section">
            <h3>Cod QR pentru Acces</h3>
            <p>Prezentați acest cod QR la bariera de acces:</p>
            <img src="cid:qrcode" alt="QR Code pentru acces" class="qr-code" />
            <p><small>Cod QR: MPK_RES=${formattedBookingNumber}</small></p>
          </div>
          
          <div class="warning">
            <strong>⚠️ Importante:</strong><br>
            • Prezentați-vă cu maximum 2 ore înainte de ora rezervată<br>
            • Păstrați acest email și codul QR pentru accesul la parcare<br>
            • Anularea se poate face cu minimum 24 ore înainte<br>
            • Pentru suport, contactați-ne folosind datele de mai jos
          </div>
          
          <div class="contact-section">
            <h3 style="text-align: center; color: #ff0066; margin-bottom: 20px;">📞 Contactați-ne</h3>
            <div class="contact-grid">
              <div class="contact-item">
                <h4>📞 Telefon suport</h4>
                <p>+40 734 292 818</p>
              </div>
              <div class="contact-item">
                <h4>📧 Email suport</h4>
                <p>contact@parcare-aeroport.ro</p>
              </div>
              <div class="contact-item">
                <h4>🕒 Program</h4>
                <p><strong>Non-Stop</strong></p>
              </div>
              <div class="contact-item">
                <h4>📍 Locație</h4>
                <p>Str. Calea Bucureştilor, Nr.303A1</p>
                <p>Otopeni, Ilfov</p>
                <p><small>La 500 metri de Aeroportul Henri Coandă</small></p>
                <div style="margin-top: 10px; display: flex; gap: 8px; justify-content: center;">
                  <a href="https://maps.app.goo.gl/GhoVMNWvst6BamHx5?g_st=aw" 
                     style="display: inline-block; background: #ff0066; color: white; padding: 8px 12px; border-radius: 6px; text-decoration: none; font-size: 13px;">
                    📍 Google Maps
                  </a>
                  <a href="https://waze.com/ul?ll=44.575660,26.069918&navigate=yes" 
                     style="display: inline-block; background: #0099ff; color: white; padding: 8px 12px; border-radius: 6px; text-decoration: none; font-size: 13px;">
                    🚗 Waze
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="footer">
          <p>Acest email a fost trimis automat de sistemul Parcare-Aeroport Otopeni.</p>
          <p>Rezervarea a fost creată la: ${bookingData.createdAt.toLocaleString('ro-RO')}</p>
          <p style="margin-top: 10px;">
            <strong>Parcare-Aeroport SRL</strong> | 
                          Str. Calea Bucureştilor, Nr.303A1, Otopeni, Ilfov | 
            contact@parcare-aeroport.ro
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

/**
 * Trimite email de confirmare rezervare cu QR code
 */
export async function sendBookingConfirmationEmail(bookingData: BookingEmailData): Promise<{ success: boolean, error?: string }> {
  try {
    console.log(`📧 Sending booking confirmation email to: ${bookingData.clientEmail}`)
    
    // Generează QR code-ul ca buffer pentru atașament
    const qrBuffer = await generateMultiparkQRBuffer(bookingData.bookingNumber)
    
    // Citește sigla companiei
    const fs = require('fs')
    const path = require('path')
    const logoPath = path.join(process.cwd(), 'public', 'sigla-transparenta.png')
    let logoBuffer: Buffer
    
    try {
      logoBuffer = fs.readFileSync(logoPath)
      console.log(`📷 Logo loaded successfully from: ${logoPath}`)
    } catch (logoError) {
      console.warn(`⚠️ Could not load logo from ${logoPath}, continuing without logo`)
      // Creează un buffer gol dacă sigla nu poate fi încărcată
      logoBuffer = Buffer.alloc(0)
    }
    
    // Creează transporterul email
    const transporter = createEmailTransporter()
    
    // Configurează email-ul
    const mailOptions = {
      from: {
        name: 'Parcare-Aeroport Otopeni',
        address: process.env.GMAIL_USER || 'noreply@parcare-aeroport.ro'
      },
      to: bookingData.clientEmail,
      subject: `Confirmare Rezervare Parcare - ${bookingData.bookingNumber.padStart(6, '0')}`,
      html: generateBookingEmailHTML(bookingData),
      attachments: [
        {
          filename: `qr-code-${bookingData.bookingNumber.padStart(6, '0')}.png`,
          content: qrBuffer,
          cid: 'qrcode', // Content ID pentru a fi referenciat în HTML
        },
        ...(logoBuffer.length > 0 ? [{
          filename: 'sigla-parcare-aeroport.png',
          content: logoBuffer,
          cid: 'logo', // Content ID pentru sigla în header
        }] : [])
      ]
    }
    
    // Trimite email-ul
    const result = await transporter.sendMail(mailOptions)
    
    console.log(`✅ Email sent successfully to ${bookingData.clientEmail}. Message ID: ${result.messageId}`)
    
    return { success: true }
    
  } catch (error) {
    console.error('❌ Error sending booking confirmation email:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown email error' 
    }
  }
}

/**
 * Validează configurația email
 */
export function validateEmailConfig(): { isValid: boolean, missingVars: string[] } {
  const requiredVars = ['GMAIL_USER', 'GMAIL_APP_PASSWORD']
  const missingVars = requiredVars.filter(varName => !process.env[varName])
  
  return {
    isValid: missingVars.length === 0,
    missingVars
  }
} 