import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import ProfilePage from './pages/Profile';
import TransactionManagement from './components/home/Transactions';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { TransactionProvider } from './context/TransactionContext';
import PrivateRoute from './components/common/PrivateRoute';
import { RefreshProvider } from './context/RefreshContext'; 

function App() {
 return (
   <Router>
     <AuthProvider>
       <LanguageProvider>
         <CurrencyProvider>
         <RefreshProvider>   
           <TransactionProvider>
             <Routes>
               {/* Public routes */}
               <Route path="/login" element={<Login />} />
               <Route path="/register" element={<Register />} />

               {/* Protected routes */}
               <Route
                 path="/"
                 element={
                   <PrivateRoute>
                     <Home />
                   </PrivateRoute>
                 }
               />
               <Route
                 path="/transactions"
                 element={
                   <PrivateRoute>
                     <TransactionManagement />
                   </PrivateRoute>
                 }
               />
               <Route
                 path="/profile"
                 element={
                   <PrivateRoute>
                     <ProfilePage />
                   </PrivateRoute>
                 }
               />

               {/* Catch-all route to redirect to home */}
               <Route path="*" element={<Navigate to="/" replace />} />
             </Routes>
           </TransactionProvider>
           </RefreshProvider>
         </CurrencyProvider>
       </LanguageProvider>
     </AuthProvider>
   </Router>
 );
}

export default App;