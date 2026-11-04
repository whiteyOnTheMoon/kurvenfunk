import React from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider, useAuth } from '../src/features/auth/auth-provider';

function Probe() {
  const auth = useAuth();
  return React.createElement(
    'main',
    null,
    React.createElement('div', { id: 'auth-ready' }, String(auth.initialized)),
    React.createElement('div', { id: 'auth-status' }, auth.authenticated ? 'authenticated' : 'anonymous'),
    React.createElement('div', { id: 'auth-error' }, auth.error ?? ''),
    React.createElement('div', { id: 'token-fingerprint' }, auth.token?.slice(-12) ?? ''),
    React.createElement('div', { id: 'user-status' }, auth.user?.status ?? ''),
    React.createElement(
      'button',
      { type: 'button', id: 'login', onClick: () => void auth.login() },
      'Login',
    ),
  );
}

const config = (window as Window & {
  __kurvenfunkTest?: { apiUrl: string; authUrl: string };
}).__kurvenfunkTest;

if (!config) {
  throw new Error('Missing isolated browser test configuration');
}

createRoot(document.getElementById('root')!).render(
  <AuthProvider apiUrl={config.apiUrl} authUrl={config.authUrl}>
    <Probe />
  </AuthProvider>,
);
