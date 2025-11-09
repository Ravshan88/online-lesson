import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import RegisterPage from "./pages/RegisterPage";
import MaterialsPage from "./pages/MaterialsPage";
import MaterialDetailPage from "./pages/MaterialDetailPage";
import ProtectedRoute from "./components/ProtectRoute";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import AdminPage from "./pages/AdminPage";
import MaterialTestsPage from "./pages/MaterialTestsPage";
import TestPage from "./pages/TestPage";
import NotFoundPage from "./pages/NotFoundPage";
function App() {
  return (
    <Router>
      <Routes>
        <Route path='/login' element={<LoginPage />} />
        <Route path='/register' element={<RegisterPage />} />
        <Route
          path='/home'
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path='/admin'
          element={
            <AdminProtectedRoute>
              <AdminPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path='/admin/material/:id/tests'
          element={
            <AdminProtectedRoute>
              <MaterialTestsPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path='/:section/:id'
          element={
            <ProtectedRoute>
              <MaterialsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path='/:section/:id/material/:material_id'
          element={
            <ProtectedRoute>
              <MaterialDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path='/test/:id'
          element={
            <ProtectedRoute>
              <TestPage />
            </ProtectedRoute>
          }
        />
        <Route path='*' element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default App;
