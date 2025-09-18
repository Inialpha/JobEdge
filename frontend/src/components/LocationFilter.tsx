'use client'

import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const locations = ['All Locations', 'New York', 'San Francisco', 'London', 'Remote']

export default function LocationFilter() {
  const [location, setLocation] = useState('All Locations')

  const handleLocationChange = (value: any) => {
    setLocation(value)
    sessionStorage.setItem('searchLocation', value);
    const l_value = sessionStorage.getItem('searchLocation');
    console.log(l_value);

    // Implement filter functionality here
    console.log('Filtering by location:', value)
  }

  return (
    <Select onValueChange={handleLocationChange} defaultValue={location}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Filter by location" />
      </SelectTrigger>
      <SelectContent>
        {locations.map((loc) => (
          <SelectItem key={loc} value={loc}>{loc}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

