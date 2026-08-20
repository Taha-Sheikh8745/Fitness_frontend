import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { isGoogleAuthConfigured } from './components/auth/GoogleLoginButton'
import './index.css'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const hasValidGoogleId = isGoogleAuthConfigured();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {hasValidGoogleId ? (
      <GoogleOAuthProvider clientId={googleClientId}>
        <App />
      </GoogleOAuthProvider>
    ) : (
      <App />
    )}
  </StrictMode>,
)

