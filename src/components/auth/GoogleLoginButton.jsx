import { useGoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';

export const isGoogleAuthConfigured = () => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  return Boolean(
    clientId &&
    clientId !== 'your_google_client_id_here' &&
    !clientId.includes('your_google_client_id') &&
    clientId.trim() !== '' &&
    clientId !== 'undefined'
  );
};

const ActiveGoogleButton = ({ onSuccess, text }) => {
  const gLogin = useGoogleLogin({
    onSuccess,
    onError: (err) => {
      console.error('Google Login Error:', err);
      toast.error('Google Sign-In failed');
    }
  });

  return (
    <button 
      type="button"
      onClick={() => gLogin()}
      className="mt-4 w-full glass-input flex items-center justify-center gap-2 hover:bg-white/10 transition py-3 font-semibold text-white cursor-pointer"
    >
      <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="h-5 w-5" alt="Google" />
      {text}
    </button>
  );
};

const UnconfiguredGoogleButton = ({ text }) => {
  const handleClick = () => {
    toast.error('Google Client ID is missing. Please set VITE_GOOGLE_CLIENT_ID in Vercel Environment Variables.');
  };

  return (
    <button 
      type="button"
      onClick={handleClick}
      className="mt-4 w-full glass-input flex items-center justify-center gap-2 hover:bg-white/10 transition py-3 font-semibold text-white/70 cursor-pointer"
    >
      <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="h-5 w-5 opacity-60" alt="Google" />
      {text}
    </button>
  );
};

export const GoogleLoginButton = ({ onSuccess, text = 'Google' }) => {
  if (!isGoogleAuthConfigured()) {
    return <UnconfiguredGoogleButton text={text} />;
  }
  return <ActiveGoogleButton onSuccess={onSuccess} text={text} />;
};

export default GoogleLoginButton;
