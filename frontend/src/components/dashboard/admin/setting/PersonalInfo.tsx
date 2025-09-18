import { useState } from 'react'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"


export default function PersonalInfo() {
  const [personalInfo, setPersonalInfo] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1 (555) 123-4567'
  })

  const handlePersonalInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPersonalInfo({ ...personalInfo, [e.target.name]: e.target.value })
  }

  return (
  <Card className="">
    <CardHeader>
      <CardTitle>Personal Information</CardTitle>
      <CardDescription>Update your personal details here.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" value={personalInfo.name} onChange={handlePersonalInfoChange} />
       </div>
       <div className="space-y-2">
         <Label htmlFor="email">Email</Label>
         <Input id="email" name="email" type="email" value={personalInfo.email} onChange={handlePersonalInfoChange} />
       </div>
       <div className="space-y-2">
         <Label htmlFor="phone">Phone</Label>
         <Input id="phone" name="phone" type="tel" value={personalInfo.phone} onChange={handlePersonalInfoChange} />
       </div>
     </CardContent>
     <CardFooter>
       <Button>Save Changes</Button>
     </CardFooter>
   </Card>
  )
}
