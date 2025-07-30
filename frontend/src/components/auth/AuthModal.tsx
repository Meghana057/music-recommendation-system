// src/components/auth/AuthModal.tsx

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
} from '@mui/material';
import LoginForm from './LoginForm';
import SignUpForm from './SignUpForm';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ open, onClose }) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');

  const handleToggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
  };

  const handleForgotPassword = () => {
    setMode('forgot');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogContent sx={{ p: 0 }}>
        {mode === 'login' && (
          <LoginForm 
            onToggleMode={handleToggleMode}
            onForgotPassword={handleForgotPassword}
          />
        )}
        {mode === 'signup' && (
          <SignUpForm onToggleMode={handleToggleMode} />
        )}
      </DialogContent>
    </Dialog>
  );
};
export default AuthModal;