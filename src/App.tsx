import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Layout } from '@/components/Layout';
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { PlanList } from '@/pages/PlanList';
import { PlanCreate } from '@/pages/PlanCreate';
import { PlanDetail } from '@/pages/PlanDetail';
import { Reminders } from '@/pages/Reminders';
import { Resources } from '@/pages/Resources';
import { Profile } from '@/pages/Profile';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isLoggedIn = useAuthStore(state => state.isLoggedIn);
  const token = localStorage.getItem('token');
  
  if (!isLoggedIn && !token) {
    return <Navigate to="/" />;
  }
  
  return <>{children}</>;
};

export default function App() {
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      fetch('http://localhost:5000/api/auth/profile', {
        headers: { Authorization: `Bearer ${savedToken}` },
      })
        .then(res => res.json())
        .then(user => {
          useAuthStore.getState().login(user, savedToken);
        })
        .catch(() => {
          localStorage.removeItem('token');
        });
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/plans" 
          element={
            <ProtectedRoute>
              <Layout>
                <PlanList />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/plans/create" 
          element={
            <ProtectedRoute>
              <Layout>
                <PlanCreate />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/plans/:id" 
          element={
            <ProtectedRoute>
              <Layout>
                <PlanDetail />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/reminders" 
          element={
            <ProtectedRoute>
              <Layout>
                <Reminders />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/resources" 
          element={
            <ProtectedRoute>
              <Layout>
                <Resources />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Layout>
                <Profile />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
