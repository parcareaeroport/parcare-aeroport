"use server"

import { z } from "zod"

// Define validation schema for the form data
const bookingFormSchema = z.object({
  licensePlate: z.string().min(1, "Numărul de înmatriculare este obligatoriu"),
  startDate: z.string().min(1, "Data de intrare este obligatorie"),
  startTime: z.string().min(1, "Ora de intrare este obligatorie"),
  endDate: z.string().min(1, "Data de ieșire este obligatorie"),
  endTime: z.string().min(1, "Ora de ieșire este obligatorie"),
  clientName: z.string().nullable().optional(),
  clientTitle: z.string().nullable().optional(),
})

type BookingFormData = z.infer<typeof bookingFormSchema>

// Configuration for the API
const API_CONFIG = {
  url: process.env.PARKING_API_URL || "http://localhost:7001/MultiparkWeb_eServices/booking_submit",
  username: process.env.PARKING_API_USERNAME || "",
  password: process.env.PARKING_API_PASSWORD || "",
  multiparkId: process.env.PARKING_MULTIPARK_ID || "001#002", // Default value, should be configured in env
}

export async function createBooking(formData: FormData) {
  try {
    // Parse and validate form data
    const rawData = {
      licensePlate: formData.get("licensePlate") as string,
      startDate: formData.get("startDate") as string,
      startTime: formData.get("startTime") as string,
      endDate: formData.get("endDate") as string,
      endTime: formData.get("endTime") as string,
      clientName: (formData.get("clientName") as string) || "",
      clientTitle: (formData.get("clientTitle") as string) || "",
    }

    const validatedData = bookingFormSchema.parse(rawData)

    // Calculate duration in minutes
    const startDateTime = new Date(`${validatedData.startDate}T${validatedData.startTime}:00`)
    const endDateTime = new Date(`${validatedData.endDate}T${validatedData.endTime}:00`)
    const durationMinutes = Math.round((endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60))

    if (durationMinutes <= 0) {
      return { success: false, message: "Perioada de rezervare trebuie să fie pozitivă" }
    }

    // Generate a random 6-digit booking number
    const bookingNumber = Math.floor(100000 + Math.random() * 900000).toString()

    // Format the start date in the required format: YYYY/MM/DD HH:mm:SS
    const formattedStartDate = startDateTime
      .toISOString()
      .replace(/T/, " ")
      .replace(/-/g, "/")
      .replace(/\.\d+Z$/, "")

    // Create XML payload according to API documentation
    const xmlPayload = `
      <WSRequestBookingSubmitV1>
        <MultiparkId>${API_CONFIG.multiparkId}</MultiparkId>
        <OperationType>N</OperationType>
        <BookingNumber>${bookingNumber}</BookingNumber>
        <LicensePlate>${validatedData.licensePlate}</LicensePlate>
        <StartDate>${formattedStartDate}</StartDate>
        <Duration>${durationMinutes}</Duration>
        ${validatedData.clientTitle ? `<ClientTitle>${validatedData.clientTitle}</ClientTitle>` : ""}
        ${validatedData.clientName ? `<ClientName>${validatedData.clientName}</ClientName>` : ""}
        <AccessMode>0</AccessMode>
      </WSRequestBookingSubmitV1>
    `.trim()

    // Create Basic Auth header
    const authHeader = `Basic ${Buffer.from(`${API_CONFIG.username}:${API_CONFIG.password}`).toString("base64")}`

    // Make API request
    const response = await fetch(API_CONFIG.url, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "text/xml",
      },
      body: xmlPayload,
    })

    if (!response.ok) {
      return {
        success: false,
        message: `Eroare de server: ${response.status} ${response.statusText}`,
      }
    }

    // Parse XML response
    const responseText = await response.text()

    // Simple XML parsing - in production, use a proper XML parser
    const errorCodeMatch = responseText.match(/<ErrorCode>(\d+)<\/ErrorCode>/)
    const messageMatch = responseText.match(/<Message>(.+?)<\/Message>/)

    const errorCode = errorCodeMatch ? errorCodeMatch[1] : null
    const message = messageMatch ? messageMatch[1] : "Răspuns necunoscut de la server"

    if (errorCode === "1") {
      // Success code according to documentation
      return {
        success: true,
        message: "Rezervarea a fost creată cu succes!",
        bookingNumber,
      }
    } else {
      return {
        success: false,
        message: `Eroare: ${message}`,
      }
    }
  } catch (error) {
    console.error("Booking error:", error)
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: `Validare eșuată: ${error.errors.map((e) => e.message).join(", ")}`,
      }
    }
    return {
      success: false,
      message: "A apărut o eroare la procesarea rezervării. Vă rugăm să încercați din nou.",
    }
  }
}

export async function cancelBooking(bookingNumber: string) {
  try {
    // Create XML payload for cancellation
    const xmlPayload = `
      <WSRequestBookingSubmitV1>
        <MultiparkId>${API_CONFIG.multiparkId}</MultiparkId>
        <OperationType>D</OperationType>
        <BookingNumber>${bookingNumber}</BookingNumber>
      </WSRequestBookingSubmitV1>
    `.trim()

    // Create Basic Auth header
    const authHeader = `Basic ${Buffer.from(`${API_CONFIG.username}:${API_CONFIG.password}`).toString("base64")}`

    // Make API request
    const response = await fetch(API_CONFIG.url, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "text/xml",
      },
      body: xmlPayload,
    })

    if (!response.ok) {
      return {
        success: false,
        message: `Eroare de server: ${response.status} ${response.statusText}`,
      }
    }

    // Parse XML response
    const responseText = await response.text()

    // Simple XML parsing
    const errorCodeMatch = responseText.match(/<ErrorCode>(\d+)<\/ErrorCode>/)
    const messageMatch = responseText.match(/<Message>(.+?)<\/Message>/)

    const errorCode = errorCodeMatch ? errorCodeMatch[1] : null
    const message = messageMatch ? messageMatch[1] : "Răspuns necunoscut de la server"

    if (errorCode === "1") {
      // Success code according to documentation
      return {
        success: true,
        message: "Rezervarea a fost anulată cu succes!",
      }
    } else {
      return {
        success: false,
        message: `Eroare: ${message}`,
      }
    }
  } catch (error) {
    console.error("Cancellation error:", error)
    return {
      success: false,
      message: "A apărut o eroare la anularea rezervării. Vă rugăm să încercați din nou.",
    }
  }
}
