"use client"

import type * as React from "react"
import { Clock } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

interface TimePickerDemoProps {
  value: string
  onChange: (time: string) => void
}

export function TimePickerDemo({ value, onChange }: TimePickerDemoProps) {
  const [hours, minutes] = value.split(":").map(Number)

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHours = Number.parseInt(e.target.value)
    if (isNaN(newHours) || newHours < 0 || newHours > 23) return
    onChange(`${newHours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`)
  }

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMinutes = Number.parseInt(e.target.value)
    if (isNaN(newMinutes) || newMinutes < 0 || newMinutes > 59) return
    onChange(`${hours.toString().padStart(2, "0")}:${newMinutes.toString().padStart(2, "0")}`)
  }

  return (
    <div className="flex items-center space-x-2">
      <div className="grid gap-1 text-center">
        <Label htmlFor="hours" className="text-xs">
          Ore
        </Label>
        <Input
          id="hours"
          className="w-16 text-center"
          value={hours}
          onChange={handleHoursChange}
          type="number"
          min={0}
          max={23}
        />
      </div>
      <div className="grid gap-1 text-center">
        <Label htmlFor="minutes" className="text-xs">
          Minute
        </Label>
        <Input
          id="minutes"
          className="w-16 text-center"
          value={minutes}
          onChange={handleMinutesChange}
          type="number"
          min={0}
          max={59}
          step={5}
        />
      </div>
      <div className="flex h-10 items-center justify-center">
        <Clock className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  )
}
