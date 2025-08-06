"use client"

import { Button } from "@/components/ui/button"

export default function ReservationForm() {
  const handleReserveClick = () => {
    window.open('https://rezervari.otp-parking.ro', '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="w-full flex justify-center items-center">
      <Button
        onClick={handleReserveClick}
        className="h-16 px-12 rounded-lg bg-white hover:bg-gray-50 text-[#ee7f1a] font-bold text-xl transition-all duration-200 border-2 border-[#ee7f1a] hover:border-[#d67016]"
      >
        Rezervă acum
      </Button>
    </div>
  )
}
