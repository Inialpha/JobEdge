import { useState, useEffect } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, Trash2, Loader2 } from 'lucide-react'
import { getRequest, deleteRequest } from '@/utils/apis';
import toCamelCaseKeys from '@/utils/toCamelCase';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"


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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [feedback, setFeedback] = useState<{type: 'success' | 'error', message: string} | null>(null)


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
  
  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setShowDeleteDialog(true);
  };
  
  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    
    try {
      const url = `${import.meta.env.VITE_API_URL}/users/${userToDelete.id}/`;
      const response = await deleteRequest(url);
      
      if (response.ok) {
        setUsers(users.filter((u) => u.id !== userToDelete.id));
        setFeedback({type: 'success', message: "User deleted successfully"});
      } else {
        setFeedback({type: 'error', message: "Failed to delete user. Please try again."});
      }
    } catch (error) {
      console.error(error);
      setFeedback({type: 'error', message: "Failed to delete user. Please try again."});
    } finally {
      setShowDeleteDialog(false);
      setUserToDelete(null);
      setTimeout(() => {
        setFeedback(null);
      }, 5000);
    }
  };
  
  const filteredUsers = users.filter(user => 
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div>
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user "{userToDelete?.firstName} {userToDelete?.lastName}" and their associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDeleteDialog(false);
              setUserToDelete(null);
            }}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Feedback Message */}
      {feedback && (
        <div 
          className={`mb-4 p-4 rounded-lg ${
            feedback.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {feedback.message}
        </div>
      )}
      
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
            <TableHead>Actions</TableHead>
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
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteClick(user)}
                  className="hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
