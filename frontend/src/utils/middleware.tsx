import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';
import { RootState } from '@/store/store'


export const AuthMiddleware = () => {
  const user = useSelector((state: RootState) => state.user);
  const isAuthenticated = user.id !== '';

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};


export const AdminMiddleware = () => {

  const user = useSelector((state: RootState) => state.user);
  const isStaff = user.isStaff
  return isStaff ? <Outlet /> : <Navigate to="/login" />;
};
