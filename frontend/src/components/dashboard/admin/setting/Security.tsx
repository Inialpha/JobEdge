import  { useState } from 'react'
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"


export default function Security() {
  const [security, setSecurity] = useState({
    twoFactor: false,
    passwordLastChanged: '2023-01-01'
  })

  const handleSecurityChange = (key: string, value: any) => {
    setSecurity({ ...security, [key]: value })
  }
  return (
    <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your account security.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="twoFactor">Two-Factor Authentication</Label>
                <Switch
                  id="twoFactor"
                  checked={security.twoFactor}
                  onCheckedChange={(checked) => handleSecurityChange('twoFactor', checked)}
                />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <p className="text-sm text-gray-500">Last changed: {security.passwordLastChanged}</p>
                <Button variant="outline">Change Password</Button>
              </div>
            </CardContent>
          </Card>
  )
}
  
