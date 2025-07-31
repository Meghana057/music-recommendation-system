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
  const [mode, setMode] = useState<'login' | 'signup' >('login');

  const handleToggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
  };
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogContent sx={{ p: 0 }}>
        {mode === 'login' && (
          <LoginForm 
            onToggleMode={handleToggleMode}
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