import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import ProfilePage from './pages/Profile';
import TransactionManagement from './components/home/Transactions/TransactionManagement';

import PrivateRoute from './components/common/PrivateRoute';

import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { TransactionProvider } from './context/TransactionContext';
import { DateProvider } from './context/DateContext';
import { RefreshProvider } from './context/RefreshContext';
import { AccessibilityProvider } from './context/AccessibilityContext'; 

function App() {
 // Suppress React Router warnings
 const originalWarn = console.warn;
 console.warn = (msg, ...args) => {
   if (msg.includes('React Router Future Flag Warning')) {
     return;
   }
   originalWarn(msg, ...args);
 };

 return (
   <>
     {/* Wrap everything in AccessibilityProvider to maintain settings across pages */}
     <Router>
       <AccessibilityProvider>
         <AuthProvider>
           <LanguageProvider>
             <RefreshProvider>
               <DateProvider>
                 <CurrencyProvider>
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
                 </CurrencyProvider>
               </DateProvider>
             </RefreshProvider>
           </LanguageProvider>
         </AuthProvider>
       </AccessibilityProvider>
     </Router>

     {/* Toast container for notifications - loaded once for entire app */}
     <ToastContainer
       position="top-center"
       autoClose={3000}
       hideProgressBar
       newestOnTop={false}
       closeOnClick
       rtl={false}
       pauseOnFocusLoss
       draggable
       pauseOnHover
       theme="colored"
     />
   </>
 );
}

export default App;