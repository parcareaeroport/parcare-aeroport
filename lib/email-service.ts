// Notă: Trebuie instalat pachetul: npm install nodemailer @types/nodemailer

import { generateMultiparkQRBuffer } from './qr-generator'
import nodemailer from 'nodemailer'
import fs from 'fs'
import path from 'path'

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
  source: "webhook" | "test_mode" | "manual" | "pay_on_site"
  createdAt: Date
}

/**
 * Configurează transporterul Nodemailer pentru Gmail cu setări robuste
 */
function createEmailTransporter() {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true pentru 465, false pentru alte porturi
    auth: {
      user: process.env.GMAIL_USER!, // Adaugă în .env.local
      pass: process.env.GMAIL_APP_PASSWORD!, // App Password generat în Gmail
    },
    connectionTimeout: 30000, // 30 secunde connection timeout
    greetingTimeout: 30000,   // 30 secunde greeting timeout  
    socketTimeout: 30000,     // 30 secunde socket timeout
    debug: false,             // activează doar pentru debugging SMTP
    logger: false,            // elimină log-urile SMTP verbose
  } as any) // bypass TypeScript pentru setări avansate
}

/**
 * Generează HTML-ul pentru email-ul de confirmare
 */
function generateBookingEmailHTML(bookingData: BookingEmailData, hasLogo: boolean = true): string {
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
        .header { background: linear-gradient(135deg, #ee7f1a, #d67016); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }

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
        .contact-item h4 { margin: 0 0 5px; color: #ee7f1a; font-size: 14px; }
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
          ${hasLogo ? '<img src="cid:logo" alt="OTP Parking Logo" style="max-width: 120px; height: auto; margin-bottom: 10px;" />' : ''}
          <h1>🅿️ Confirmare Rezervare OTP Parking</h1>
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
              <span class="detail-value"><strong>${bookingData.amount.toFixed(2)} RON</strong>${bookingData.source === 'pay_on_site' ? '<br><small style="color: #ee7f1a; font-weight: bold;">Plata se va efectua la parcare</small>' : ''}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Status:</span>
              <span class="detail-value">${isTestMode ? 'Confirmat (Test)' : 'Confirmat'}</span>
            </div>
          </div>
          
          <div class="qr-section">
            <h3>Cod QR pentru Acces</h3>
            <p>Pentru accesul în parcare puteți folosi codul QR de mai jos!</p>
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
          
          <!-- Buton Anulare Rezervare -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://parcare-aeroport.ro/anulare" 
               style="display: inline-block; background: #dc3545; color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: bold; box-shadow: 0 4px 6px rgba(220, 53, 69, 0.3);">
              🚫 Anulează rezervarea
            </a>
            <p style="color: #666; font-size: 13px; margin-top: 10px;">
              Anularea se poate face cu minimum 24 ore înainte de sosire
            </p>
          </div>

          <div class="contact-section">
            <h3 style="text-align: center; color: #ee7f1a; margin-bottom: 20px;">📞 Contactați-ne</h3>
            <div class="contact-grid">
              <div class="contact-item">
                <h4>📞 Telefon suport</h4>
                <p>0742.039.955</p>
              </div>
              <div class="contact-item">
                <h4>📧 Email suport</h4>
                <p>contact.parcareaeroport@gmail.com</p>
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
                     style="display: inline-block; background: #ee7f1a; color: white; padding: 8px 12px; border-radius: 6px; text-decoration: none; font-size: 13px;">
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
          <p>Acest email a fost trimis automat de sistemul OTP Parking.</p>
          <p>Rezervarea a fost creată la: ${bookingData.createdAt.toLocaleString('ro-RO')}</p>
          <p style="margin-top: 10px;">
            <strong>OTP Parking SRL</strong> | 
                          Str. Calea Bucureştilor, Nr.303A1, Otopeni, Ilfov | 
            contact.parcareaeroport@gmail.com
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
  const emailProcessId = `${bookingData.bookingNumber}_${Date.now()}`
  
  try {
    console.log(`📧 [EMAIL-${emailProcessId}] ===== STARTING EMAIL PROCESS =====`)
    console.log(`📧 [EMAIL-${emailProcessId}] Recipient: ${bookingData.clientEmail}`)
    console.log(`📧 [EMAIL-${emailProcessId}] Booking Number: ${bookingData.bookingNumber}`)
    console.log(`📧 [EMAIL-${emailProcessId}] License Plate: ${bookingData.licensePlate}`)
    console.log(`📧 [EMAIL-${emailProcessId}] Source: ${bookingData.source}`)
    console.log(`📧 [EMAIL-${emailProcessId}] Status: ${bookingData.status}`)
    console.log(`📧 [EMAIL-${emailProcessId}] Amount: ${bookingData.amount} RON`)
    console.log(`📧 [EMAIL-${emailProcessId}] Days: ${bookingData.days}`)
    console.log(`📧 [EMAIL-${emailProcessId}] Start: ${bookingData.startDate} ${bookingData.startTime}`)
    console.log(`📧 [EMAIL-${emailProcessId}] End: ${bookingData.endDate} ${bookingData.endTime}`)
    console.log(`📧 [EMAIL-${emailProcessId}] Timestamp: ${new Date().toISOString()}`)
    
    // Validare configurație email
    const emailConfig = validateEmailConfig()
    if (!emailConfig.isValid) {
      console.error(`❌ [EMAIL-${emailProcessId}] Email configuration invalid!`)
      console.error(`❌ [EMAIL-${emailProcessId}] Missing variables: ${emailConfig.missingVars.join(', ')}`)
      return { 
        success: false, 
        error: `Email configuration missing: ${emailConfig.missingVars.join(', ')}` 
      }
    }
    console.log(`✅ [EMAIL-${emailProcessId}] Email configuration validated`)
    console.log(`📧 [EMAIL-${emailProcessId}] Gmail User: ${process.env.GMAIL_USER ? 'SET' : 'NOT SET'}`)
    console.log(`📧 [EMAIL-${emailProcessId}] Gmail Password: ${process.env.GMAIL_APP_PASSWORD ? 'SET (length=' + process.env.GMAIL_APP_PASSWORD.length + ')' : 'NOT SET'}`)
    
    // Generează QR code-ul ca buffer pentru atașament
    console.log(`🔲 [EMAIL-${emailProcessId}] Generating QR code buffer...`)
    const qrBuffer = await generateMultiparkQRBuffer(bookingData.bookingNumber)
    console.log(`✅ [EMAIL-${emailProcessId}] QR code generated, buffer size: ${qrBuffer.length} bytes`)
    
    // Citește logo-ul pentru atașament - încearcă mai multe căi
    console.log(`🖼️ [EMAIL-${emailProcessId}] Reading logo file...`)
    const possibleLogoPaths = [
      path.join(process.cwd(), 'public', 'otp_parking.png'),
      path.join(process.cwd(), 'app', 'public', 'otp_parking.png'),
      path.join(__dirname, '..', 'public', 'otp_parking.png'),
      path.join(__dirname, '..', 'app', 'public', 'otp_parking.png'),
      path.join(process.cwd(), '.next', 'static', 'media', 'otp_parking.png'),
      path.join(process.cwd(), '.next', 'server', 'static', 'media', 'otp_parking.png'),
      './public/otp_parking.png',
      '/var/task/public/otp_parking.png',
      '/var/task/.next/static/media/otp_parking.png'
    ]
    
    let logoBuffer: Buffer | null = null
    let logoPath: string | null = null
    
    for (const possiblePath of possibleLogoPaths) {
      try {
        console.log(`🔍 [EMAIL-${emailProcessId}] Trying logo path: ${possiblePath}`)
        logoBuffer = fs.readFileSync(possiblePath)
        logoPath = possiblePath
        console.log(`✅ [EMAIL-${emailProcessId}] Logo loaded from: ${possiblePath}`)
        console.log(`✅ [EMAIL-${emailProcessId}] Logo buffer size: ${logoBuffer.length} bytes`)
        break
      } catch (error) {
        console.log(`❌ [EMAIL-${emailProcessId}] Logo not found at: ${possiblePath}`)
      }
    }
    
    if (!logoBuffer) {
      console.warn(`⚠️ [EMAIL-${emailProcessId}] Logo file not found in any of the paths:`)
      possibleLogoPaths.forEach(path => console.warn(`⚠️ [EMAIL-${emailProcessId}]   - ${path}`))
      
      // Debug: Verifică ce fișiere există în directorul curent
      try {
        const currentDir = process.cwd()
        console.log(`🔍 [EMAIL-${emailProcessId}] Current working directory: ${currentDir}`)
        const files = fs.readdirSync(currentDir)
        console.log(`🔍 [EMAIL-${emailProcessId}] Files in current directory: ${files.join(', ')}`)
        
        const publicDirPath = path.join(currentDir, 'public')
        if (fs.existsSync(publicDirPath)) {
          const publicFiles = fs.readdirSync(publicDirPath)
          console.log(`🔍 [EMAIL-${emailProcessId}] Files in public directory: ${publicFiles.join(', ')}`)
        } else {
          console.log(`🔍 [EMAIL-${emailProcessId}] Public directory does not exist at: ${publicDirPath}`)
        }
        
        // Încearcă să verifice și directorul .next dacă există
        const nextDirPath = path.join(currentDir, '.next')
        if (fs.existsSync(nextDirPath)) {
          console.log(`🔍 [EMAIL-${emailProcessId}] .next directory exists`)
          const nextFiles = fs.readdirSync(nextDirPath)
          console.log(`🔍 [EMAIL-${emailProcessId}] Files in .next directory: ${nextFiles.join(', ')}`)
        } else {
          console.log(`🔍 [EMAIL-${emailProcessId}] .next directory does not exist`)
        }
      } catch (debugError) {
        console.log(`🔍 [EMAIL-${emailProcessId}] Debug directory listing failed: ${debugError}`)
      }
      
      
      // Backup: Creează un logo simplu programatic dacă nu se găsește fișierul
      console.log(`🔧 [EMAIL-${emailProcessId}] Attempting to create fallback logo...`)
      try {
        // SVG simplu care poate fi convertit la PNG
        const simpleLogo = `<svg width="200" height="80" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="80" fill="#13005a"/>
          <text x="100" y="30" font-family="Arial, sans-serif" font-size="18" font-weight="bold" text-anchor="middle" fill="white">OTP</text>
          <text x="100" y="55" font-family="Arial, sans-serif" font-size="14" text-anchor="middle" fill="#ee7f1a">PARKING</text>
        </svg>`
        
        // Pentru acum, să nu folosim logo-ul fallback - e mai sigur fără logo
        console.log(`🔧 [EMAIL-${emailProcessId}] Fallback logo created but not used for compatibility`)
        console.warn(`⚠️ [EMAIL-${emailProcessId}] Continuing without logo...`)
      } catch (fallbackError) {
        console.warn(`⚠️ [EMAIL-${emailProcessId}] Fallback logo creation failed: ${fallbackError}`)
        console.warn(`⚠️ [EMAIL-${emailProcessId}] Continuing without logo...`)
      }
    }
    
    // Creează transporterul email
    console.log(`🚀 [EMAIL-${emailProcessId}] Creating email transporter...`)
    const transporter = createEmailTransporter()
    console.log(`✅ [EMAIL-${emailProcessId}] Email transporter created`)
    
    // Configurează email-ul
    const formattedBookingNumber = bookingData.bookingNumber.padStart(6, '0')
    const attachments: any[] = [
      {
        filename: `qr-code-${formattedBookingNumber}.png`,
        content: qrBuffer,
        cid: 'qrcode', // Content ID pentru a fi referenciat în HTML
      }
    ]
    
    // Adaugă logo-ul doar dacă a fost încărcat cu succes
    if (logoBuffer) {
      attachments.push({
        filename: 'otp_parking.png',
        content: logoBuffer,
        cid: 'logo', // Content ID pentru logo
      })
    }
    
    const mailOptions = {
      from: {
        name: 'OTP Parking',
        address: process.env.GMAIL_USER || 'noreply@parcare-aeroport.ro'
      },
      to: bookingData.clientEmail,
      subject: `Confirmare Rezervare OTP Parking - ${formattedBookingNumber}`,
      html: generateBookingEmailHTML(bookingData, !!logoBuffer),
      attachments: attachments
    }
    
    console.log(`📧 [EMAIL-${emailProcessId}] Email options configured:`)
    console.log(`📧 [EMAIL-${emailProcessId}]   From: ${mailOptions.from.name} <${mailOptions.from.address}>`)
    console.log(`📧 [EMAIL-${emailProcessId}]   To: ${mailOptions.to}`)
    console.log(`📧 [EMAIL-${emailProcessId}]   Subject: ${mailOptions.subject}`)
    console.log(`📧 [EMAIL-${emailProcessId}]   HTML Length: ${mailOptions.html.length} chars`)
    console.log(`📧 [EMAIL-${emailProcessId}]   Attachments: ${mailOptions.attachments.length} files`)
    console.log(`📧 [EMAIL-${emailProcessId}]   QR Attachment Size: ${qrBuffer.length} bytes`)
    console.log(`📧 [EMAIL-${emailProcessId}]   Logo Attachment Size: ${logoBuffer ? logoBuffer.length : 0} bytes`)
    
    // Trimite email-ul cu timeout
    console.log(`🚀 [EMAIL-${emailProcessId}] Sending email via Gmail SMTP...`)
    const sendStartTime = Date.now()
    
    // Timeout de 30 secunde pentru SMTP
    const emailPromise = transporter.sendMail(mailOptions)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('SMTP timeout - 30 seconds')), 30000)
    )
    
    const result = await Promise.race([emailPromise, timeoutPromise]) as any
    const sendDuration = Date.now() - sendStartTime
    
    console.log(`✅ [EMAIL-${emailProcessId}] ===== EMAIL SENT SUCCESSFULLY =====`)
    console.log(`✅ [EMAIL-${emailProcessId}] Message ID: ${result.messageId}`)
    console.log(`✅ [EMAIL-${emailProcessId}] Response: ${result.response}`)
    console.log(`✅ [EMAIL-${emailProcessId}] Send Duration: ${sendDuration}ms`)
    console.log(`✅ [EMAIL-${emailProcessId}] Final Status: SUCCESS`)
    console.log(`✅ [EMAIL-${emailProcessId}] Timestamp: ${new Date().toISOString()}`)
    console.log(`✅ [EMAIL-${emailProcessId}] Recipient Confirmed: ${bookingData.clientEmail}`)
    console.log(`✅ [EMAIL-${emailProcessId}] Booking Confirmed: ${formattedBookingNumber}`)
    
    return { success: true }
    
  } catch (error) {
    console.error(`❌ [EMAIL-${emailProcessId}] ===== EMAIL FAILED =====`)
    console.error(`❌ [EMAIL-${emailProcessId}] Error Type: ${error instanceof Error ? error.constructor.name : typeof error}`)
    console.error(`❌ [EMAIL-${emailProcessId}] Error Message: ${error instanceof Error ? error.message : String(error)}`)
    console.error(`❌ [EMAIL-${emailProcessId}] Error Code: ${(error as any)?.code || 'N/A'}`)
    console.error(`❌ [EMAIL-${emailProcessId}] Error Errno: ${(error as any)?.errno || 'N/A'}`)
    console.error(`❌ [EMAIL-${emailProcessId}] Error Syscall: ${(error as any)?.syscall || 'N/A'}`)
    console.error(`❌ [EMAIL-${emailProcessId}] Error Stack:`, error instanceof Error ? error.stack : 'N/A')
    console.error(`❌ [EMAIL-${emailProcessId}] Timestamp: ${new Date().toISOString()}`)
    console.error(`❌ [EMAIL-${emailProcessId}] Target Email: ${bookingData.clientEmail}`)
    console.error(`❌ [EMAIL-${emailProcessId}] Booking Number: ${bookingData.bookingNumber}`)
    console.error(`❌ [EMAIL-${emailProcessId}] Gmail User Config: ${process.env.GMAIL_USER ? 'SET' : 'NOT SET'}`)
    console.error(`❌ [EMAIL-${emailProcessId}] Gmail Pass Config: ${process.env.GMAIL_APP_PASSWORD ? 'SET' : 'NOT SET'}`)
    
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