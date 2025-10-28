import { useState, useEffect } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search } from 'lucide-react'
import { getRequest } from '@/utils/apis';
import toCamelCaseKeys from '@/utils/toCamelCase';
import CircularLoader from '@/components/ui/circularLoader';


type User = {
  id: string
  firstName: string
  lastName: string
  email: string
  isAdmin: boolean
  isStaff: boolean
  role: 'patient' | 'provider' | 'admin'
  status: 'active' | 'inactive'
}


export default function UserComponent() {
  const [users, setUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)


  useEffect(() => {
    const fetchUser = async () => {
      const url = `${import.meta.env.VITE_API_URL}/users/`;
      console.log("................", url)
      try {
        const res = await getRequest(url);
        if (res.ok) {
          const users = await res.json()
          const C_users = toCamelCaseKeys(users) as User[]
          console.log(C_users)
          setUsers(C_users)
          setIsLoading(false)
        }
      } catch (error) {
          console.log(error)
          setIsLoading(false)
      }
    }
    fetchUser();
  }, []);
  const filteredUsers = users.filter(user => 
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <CircularLoader size="large" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center mb-4">
        <Search className="mr-2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredUsers.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.firstName} {user.lastName}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Badge variant={user.isAdmin ? 'default' : 'outline'}>
                 
                  {user.isAdmin && (<p>admin</p>) }
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={'default'}>
                  <p>Active</p>
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
