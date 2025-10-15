import { useState } from 'react'
import { Input } from "@/components/ui/input"

export default function SearchBar() {
  const [search, setSearch] = useState('')

  const handleSearch = (e: any) => {
    e.preventDefault()
    setSearch(e.target.value);
    sessionStorage.setItem('searchKeywords', e.target.value);
  }

  return (
    
      <Input
        type="text"
        placeholder="Search jobs..."
        value={search}
        onChange={handleSearch}
        className="flex-grow"
      />
    
  )
}

