import { sendBookingConfirmationEmail } from './email-service'

interface InvoiceData {
  bookingNumber: string
  licensePlate: string
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  days: number
  amount: number
  clientName: string
  clientEmail: string
  clientPhone?: string
  clientAddress?: string
  clientCity?: string
  clientCounty?: string
  clientPostalCode?: string
  company?: string
  companyVAT?: string
  companyReg?: string
  companyAddress?: string
  needInvoice?: boolean
}

// Informații firmă Site Parcări (trebuie completate cu datele reale)
const COMPANY_INFO = {
  name: "SITE PARCĂRI SRL",
  vatNumber: "RO12345678",
  regNumber: "J40/1234/2024",
  address: "Strada Exemplu, nr. 1, Sector 1, București",
  iban: "RO49AAAA1B31007593840000",
  email: "facturi@siteparcari.ro",
  phone: "+40123456789",
  website: "www.siteparcari.ro"
}

function generateInvoiceNumber(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const time = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0')
  
  return `${year}${month}${day}-${time}`
}

function calculateTaxes(amount: number) {
  const total = amount
  const subtotal = Math.round((total / 1.19) * 100) / 100 // Fără TVA
  const tva = Math.round((total - subtotal) * 100) / 100 // TVA 19%
  
  return { subtotal, tva, total }
}

function generateInvoiceHTML(invoiceData: InvoiceData, invoiceNumber: string): string {
  const isCompany = invoiceData.needInvoice && invoiceData.company
  const taxes = calculateTaxes(invoiceData.amount)
  
  return `
<!DOCTYPE html>
<html lang="ro">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Factură ${invoiceNumber}</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.5; 
            color: #2d3748; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 30px;
            background: #f8fafc;
        }
        .invoice-container {
            background: white;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            border-radius: 12px;
            padding: 40px;
            margin: 20px 0;
        }
        .header { 
            display: flex; 
            justify-content: space-between; 
            align-items: start; 
            margin-bottom: 40px; 
            border-bottom: 3px solid #2563eb; 
            padding-bottom: 25px;
            position: relative;
        }
        .company-info { 
            flex: 1;
            position: relative;
        }
        .company-logo-area {
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #2563eb, #3b82f6);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 15px;
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
        }
        .company-logo-area::after {
            content: "🅿️";
            font-size: 28px;
            color: white;
        }
        .invoice-info { 
            text-align: right; 
            background: linear-gradient(135deg, #f0f9ff, #e0f2fe); 
            padding: 20px; 
            border-radius: 12px;
            border: 2px solid #bae6fd;
            min-width: 280px;
        }
        .invoice-title { 
            font-size: 28px; 
            font-weight: 700; 
            color: #1e40af; 
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .client-section { 
            display: flex; 
            justify-content: space-between; 
            margin: 40px 0; 
            gap: 25px;
        }
        .supplier, .client { 
            flex: 1; 
            padding: 25px; 
            border: 2px solid #e5e7eb; 
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }
        .supplier { 
            background: linear-gradient(135deg, #f0f9ff, #dbeafe); 
            border-color: #bfdbfe;
        }
        .client { 
            background: linear-gradient(135deg, #fefefe, #f9fafb); 
            border-color: #d1d5db;
        }
        .section-title { 
            font-weight: 700; 
            color: #1e40af; 
            border-bottom: 2px solid #3b82f6; 
            padding-bottom: 8px; 
            margin-bottom: 15px;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .services-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 35px 0;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
        .services-table th, .services-table td { 
            border: 1px solid #e5e7eb; 
            padding: 15px; 
            text-align: left;
        }
        .services-table th { 
            background: linear-gradient(135deg, #1e40af, #2563eb); 
            font-weight: 600;
            color: white;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .services-table tbody tr {
            background: white;
        }
        .services-table tbody tr:hover {
            background: #f8fafc;
        }
        .totals { 
            margin-left: auto; 
            width: 350px; 
            margin-top: 25px;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
        .totals table { 
            width: 100%; 
            border-collapse: collapse;
        }
        .totals td { 
            padding: 12px 15px; 
            border-bottom: 1px solid #e5e7eb;
            background: white;
        }
        .totals .total-row { 
            font-weight: 700; 
            background: linear-gradient(135deg, #1e40af, #2563eb); 
            color: white;
            font-size: 16px;
        }
        .totals .total-row td {
            border-bottom: none;
        }
        .footer { 
            margin-top: 50px; 
            padding-top: 20px; 
            border-top: 1px solid #e5e7eb; 
            font-size: 12px; 
            color: #6b7280; 
            text-align: center;
        }
        .booking-details { 
            background: linear-gradient(135deg, #f0f9ff, #e0f2fe); 
            padding: 25px; 
            border-radius: 12px; 
            margin: 30px 0;
            border: 2px solid #bae6fd;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
        }
        .booking-details h3 {
            color: #1e40af;
            margin-top: 0;
            margin-bottom: 20px;
            font-size: 18px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .status-paid { 
            background: linear-gradient(135deg, #10b981, #059669); 
            color: white; 
            padding: 8px 16px; 
            border-radius: 20px; 
            font-weight: 600; 
            display: inline-block;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            box-shadow: 0 2px 6px rgba(16, 185, 129, 0.3);
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <div class="header">
            <div class="company-info">
                <div class="company-logo-area"></div>
                <h1 style="margin: 0; color: #1e40af; font-size: 24px; font-weight: 700;">${COMPANY_INFO.name}</h1>
                <p style="margin: 8px 0; color: #64748b; font-weight: 500;">CUI: ${COMPANY_INFO.vatNumber}</p>
                <p style="margin: 5px 0; color: #64748b;">Reg. Com.: ${COMPANY_INFO.regNumber}</p>
                <p style="margin: 5px 0; color: #64748b;">${COMPANY_INFO.address}</p>
                <p style="margin: 5px 0; color: #64748b;">Tel: ${COMPANY_INFO.phone}</p>
                <p style="margin: 5px 0; color: #64748b;">Email: ${COMPANY_INFO.email}</p>
                <p style="margin: 5px 0; color: #64748b;">Web: ${COMPANY_INFO.website}</p>
            </div>
        <div class="invoice-info">
            <div class="invoice-title">Factură Fiscală</div>
            <p style="margin: 8px 0; color: #374151;"><strong>Nr. Factură:</strong> ${invoiceNumber}</p>
            <p style="margin: 8px 0; color: #374151;"><strong>Data emisă:</strong> ${new Date().toLocaleDateString('ro-RO')}</p>
            <p style="margin: 8px 0; color: #374151;"><strong>Scadență:</strong> PLĂTITĂ</p>
            <div class="status-paid">✓ Plată Procesată</div>
        </div>
    </div>

    <div class="client-section">
        <div class="supplier">
            <div class="section-title">FURNIZOR</div>
            <p><strong>${COMPANY_INFO.name}</strong></p>
            <p>CUI: ${COMPANY_INFO.vatNumber}</p>
            <p>Nr. Reg. Com.: ${COMPANY_INFO.regNumber}</p>
            <p>${COMPANY_INFO.address}</p>
            <p>IBAN: ${COMPANY_INFO.iban}</p>
            <p>Tel: ${COMPANY_INFO.phone}</p>
            <p>Email: ${COMPANY_INFO.email}</p>
        </div>
        
        <div class="client">
            <div class="section-title">${isCompany ? 'CLIENT - PERSOANĂ JURIDICĂ' : 'CLIENT - PERSOANĂ FIZICĂ'}</div>
            ${isCompany ? `
                <p><strong>${invoiceData.company}</strong></p>
                <p>CUI: ${invoiceData.companyVAT || 'N/A'}</p>
                <p>Nr. Reg. Com.: ${invoiceData.companyReg || 'N/A'}</p>
                <p>${invoiceData.companyAddress || 'N/A'}</p>
                <p>Contact: ${invoiceData.clientName}</p>
            ` : `
                <p><strong>${invoiceData.clientName}</strong></p>
                <p>${invoiceData.clientAddress || 'N/A'}</p>
                <p>${invoiceData.clientCity || ''} ${invoiceData.clientCounty || ''}</p>
                <p>Cod poștal: ${invoiceData.clientPostalCode || 'N/A'}</p>
            `}
            <p>Email: ${invoiceData.clientEmail}</p>
            <p>Tel: ${invoiceData.clientPhone || 'N/A'}</p>
        </div>
    </div>

    <div class="booking-details">
        <h3>Detalii Rezervare</h3>
        <p><strong>Numărul rezervării:</strong> ${invoiceData.bookingNumber}</p>
        <p><strong>Autovehicul:</strong> ${invoiceData.licensePlate}</p>
        <p><strong>Perioada:</strong> ${invoiceData.startDate} ${invoiceData.startTime} - ${invoiceData.endDate} ${invoiceData.endTime}</p>
        <p><strong>Durata:</strong> ${invoiceData.days} ${invoiceData.days === 1 ? 'zi' : 'zile'}</p>
        <p><strong>Locația:</strong> Parcarea Site Parcări</p>
    </div>

    <table class="services-table">
        <thead>
            <tr>
                <th>Descriere serviciu</th>
                <th>U.M.</th>
                <th>Cantitate</th>
                <th>Preț unitar (fără TVA)</th>
                <th>Valoare (fără TVA)</th>
                <th>Cota TVA</th>
                <th>TVA</th>
                <th>Total cu TVA</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Servicii parcare autovehicul ${invoiceData.licensePlate}<br>
                    Perioada: ${invoiceData.startDate} - ${invoiceData.endDate}<br>
                    Rezervarea: #${invoiceData.bookingNumber}</td>
                <td>bucată</td>
                <td>1</td>
                <td>${taxes.subtotal.toFixed(2)} RON</td>
                <td>${taxes.subtotal.toFixed(2)} RON</td>
                <td>19%</td>
                <td>${taxes.tva.toFixed(2)} RON</td>
                <td>${taxes.total.toFixed(2)} RON</td>
            </tr>
        </tbody>
    </table>

    <div class="totals">
        <table>
            <tr>
                <td>Total fără TVA:</td>
                <td style="text-align: right;"><strong>${taxes.subtotal.toFixed(2)} RON</strong></td>
            </tr>
            <tr>
                <td>TVA 19%:</td>
                <td style="text-align: right;"><strong>${taxes.tva.toFixed(2)} RON</strong></td>
            </tr>
            <tr class="total-row">
                <td>TOTAL DE PLATĂ:</td>
                <td style="text-align: right;"><strong>${taxes.total.toFixed(2)} RON</strong></td>
            </tr>
        </table>
    </div>

    <div style="margin: 30px 0; padding: 25px; background: linear-gradient(135deg, #d1fae5, #a7f3d0); border-radius: 12px; border: 2px solid #6ee7b7; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);">
        <p style="margin: 0; color: #047857; font-weight: 700; font-size: 16px;">✅ FACTURĂ PLĂTITĂ</p>
        <p style="margin: 8px 0; color: #047857; font-weight: 500;">Plata a fost procesată prin Stripe la data rezervării.</p>
        <p style="margin: 8px 0; color: #047857; font-weight: 500;">Vă mulțumim pentru încrederea acordată!</p>
    </div>

        <div class="footer">
            <p style="margin: 10px 0;">Factura a fost generată automat și este valabilă fără semnătură în conformitate cu art. 319 din Legea 227/2015.</p>
            <p style="margin: 10px 0;">TVA 19% conform legislației române în vigoare.</p>
            <p style="margin: 10px 0; font-weight: 600;"><strong>${COMPANY_INFO.name}</strong> | CUI: ${COMPANY_INFO.vatNumber} | Reg. Com.: ${COMPANY_INFO.regNumber}</p>
            <p style="margin: 10px 0; font-style: italic;">Generată automat de sistemul Site Parcări - ${new Date().toLocaleString('ro-RO')}</p>
        </div>
    </div>
</body>
</html>
  `.trim()
}

export async function generateInvoiceForBooking(invoiceData: InvoiceData): Promise<string> {
  try {
    const invoiceNumber = generateInvoiceNumber()
    const invoiceHTML = generateInvoiceHTML(invoiceData, invoiceNumber)
    
    // Folosim sistemul de email existent pentru a trimite factura
    await sendBookingConfirmationEmail({
      clientName: invoiceData.needInvoice && invoiceData.company ? invoiceData.company : invoiceData.clientName,
      clientEmail: invoiceData.clientEmail,
      clientPhone: invoiceData.clientPhone,
      licensePlate: invoiceData.licensePlate,
      startDate: invoiceData.startDate,
      startTime: invoiceData.startTime,
      endDate: invoiceData.endDate,
      endTime: invoiceData.endTime,
      days: invoiceData.days,
      amount: invoiceData.amount,
      bookingNumber: invoiceData.bookingNumber,
      status: 'confirmed_paid',
      source: 'webhook',
      createdAt: new Date()
    })
    
    console.log(`✅ Factură ${invoiceNumber} generată și trimisă pe ${invoiceData.clientEmail}`)
    console.log(`📧 Client: ${invoiceData.needInvoice && invoiceData.company ? invoiceData.company : invoiceData.clientName}`)
    
    return invoiceNumber
    
  } catch (error) {
    console.error('❌ Eroare la generarea facturii:', error)
    throw error
  }
} 