import { useState } from 'react'
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"


export default function Preferences() {
  const [preferences, setPreferences] = useState({
    theme: 'light',
    notifications: true,
    newsletter: false
  })
  
  const handlePreferencesChange = (key: string, value: any) => {
    setPreferences({ ...preferences, [key]: value })
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferences</CardTitle>
        <CardDescription>Manage your app preferences.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="theme">Theme</Label>
          <Select
            value={preferences.theme}
            onValueChange={(value) => handlePreferencesChange('theme', value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select a theme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="notifications">Enable Notifications</Label>
          <Switch
            id="notifications"
            checked={preferences.notifications}
            onCheckedChange={(checked) => handlePreferencesChange('notifications', checked)}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="newsletter">Subscribe to Newsletter</Label>
          <Switch
            id="newsletter"
            checked={preferences.newsletter}
            onCheckedChange={(checked) => handlePreferencesChange('newsletter', checked)}
          />
        </div>
      </CardContent>
    </Card>
  )
}
