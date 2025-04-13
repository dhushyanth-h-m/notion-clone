import { Provider } from 'react-redux';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { store } from './store/store';
import Editor from './components/Editor';
import Sidebar from './components/Sidebar';
import { AuthProvider, useAuth } from './context/AuthContext';
import Auth from './pages/Auth/Auth';
import Pages from './pages/Pages/Pages';
import './App.css';

const ProtectedRoute: React.FC<{ element: JSX.Element }> = ({ element }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return isAuthenticated ? element : <Navigate to="/login" />;
};

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/pages" /> : <Auth />} />
      <Route path="/signup" element={isAuthenticated ? <Navigate to="/pages" /> : <Auth />} />
      <Route path="/pages" element={<ProtectedRoute element={<Pages />} />} />
      <Route path="/pages/:id" element={<ProtectedRoute element={<Pages />} />} />
      <Route path="/pages/new" element={<ProtectedRoute element={<Pages />} />} />
      
      {/* Legacy routes for editor */}
      <Route path="/editor" element={
        <ProtectedRoute element={
          <div className="app">
            <Sidebar />
            <div className="editor-container">
              <Editor />
            </div>
          </div>
        } />
      } />
      
      {/* Redirect root to pages or login */}
      <Route path="/" element={isAuthenticated ? <Navigate to="/pages" /> : <Navigate to="/login" />} />
    </Routes>
  );
};

function App() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </Provider>
  );
}

export default App;
