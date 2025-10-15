import { useState } from 'react'
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"


export default function Privacy() {
  const [privacy, setPrivacy] = useState({
    profileVisibility: 'public',
    activityStatus: true
  })

  const handlePrivacyChange = (key: string, value: any) => {
    setPrivacy({ ...privacy, [key]: value })
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Privacy Settings</CardTitle>
        <CardDescription>Manage your privacy preferences.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="profileVisibility">Profile Visibility</Label>
          <Select
            value={privacy.profileVisibility}
            onValueChange={(value) => handlePrivacyChange('profileVisibility', value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select visibility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="friends">Friends Only</SelectItem>
              <SelectItem value="private">Private</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="activityStatus">Show Activity Status</Label>
          <Switch
            id="activityStatus"
            checked={privacy.activityStatus}
            onCheckedChange={(checked) => handlePrivacyChange('activityStatus', checked)}
          />
        </div>
      </CardContent>
    </Card>
  )
}
