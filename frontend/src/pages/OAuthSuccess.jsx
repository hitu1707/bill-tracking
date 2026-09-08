import  { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const OAuthSuccess = () => {
  const [searchParams] = useSearchParams();
  const { handleOAuthToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      handleOAuthToken(token).then(() => {
        navigate('/dashboard');
      });
    } else {
      navigate('/login?error=oauth_failed');
    }
  }, [searchParams, navigate, handleOAuthToken]);

  return (
    <div className="loading">
      <h2>Authenticating...</h2>
      <p>Please wait while we log you in.</p>
    </div>
  );
};

export default OAuthSuccess;