import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import PersonalInfo from './PersonalInfo';
import Security from './Security';
import Preferences from './Preferences';
import Privacy from './Privacy';


export default function SettingsComponent() {

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-4 
">
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        <TabsContent value="personal">
          <PersonalInfo />
        </TabsContent>
        <TabsContent value="preferences">
          <Preferences />
        </TabsContent>
        <TabsContent value="privacy">
          <Privacy />
        </TabsContent>
        <TabsContent value="security">
          <Security />
        </TabsContent>
      </Tabs>
    </div>
  )
}
