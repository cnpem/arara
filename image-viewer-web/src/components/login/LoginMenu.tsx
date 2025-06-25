// @ts-nocheck
import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { useViewerStore } from '../../store/useViewerStore';
import { Toaster, toast } from 'sonner';
import flowerImage from './flower_image.jpg';

function LoginMenu() {
  const { 
    setIsLogged,
    username, setUsername,
    password, setPassword,
    loginIsHappening, setLoginIsHappening,
    setProposals,
   } = useViewerStore();

  const loginMutation = useMutation({
    mutationFn: async ({ username, password }) => {

      const csrfResponse = await fetch(`/api/csrf-token`, {
        method: 'GET',
        credentials: 'include'
      });
      const csrfData = await csrfResponse.json();
      const csrfToken = csrfData.csrf_token;

      const response = await fetch(`/api/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      return response.json();
    },
    onMutate: () => {
      setLoginIsHappening(true);
    },
    onSuccess: (data) => {
      setProposals(data.proposals);
      setIsLogged(data.success);
      if (data.message !== 'none') {
        toast(data.message, { autoClose: 20000, draggable: true });
      }
    },
    onError: (error) => {
      console.error('Login failed:', error);
      toast('Login failed. Please try again.', { autoClose: 5000 });
    },
    onSettled: () => {
      setLoginIsHappening(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ username, password });
  };

  return (
    <div style={{ 
      backgroundImage: `url(${flowerImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      width: '100vw',
      height: '100vh', }}>

      <Toaster position="bottom-right"/>
      <form
        onSubmit={handleSubmit}
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          padding: '30px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          width: '300px',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <h1 style={{ marginTop: 0, fontSize: '24px', textAlign: 'center' }}>Login</h1>

        {loginIsHappening && (
          <p style={{ textAlign: 'center', color: 'gray', fontStyle: 'italic' }}>Loading...</p>
        )}

        <div style={{ marginBottom: '15px' }}>
          <input
            type="text"
            placeholder="Username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            readOnly={loginIsHappening}
            autoComplete="username"
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid #ccc',
              fontSize: '16px',
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            readOnly={loginIsHappening}
            autoComplete="current-password"
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid #ccc',
              fontSize: '16px',
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loginIsHappening}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '8px',
            backgroundColor: loginIsHappening ? '#aaa' : '#4CAF50',
            color: 'white',
            fontSize: '16px',
            border: 'none',
            cursor: loginIsHappening ? 'not-allowed' : 'pointer',
          }}
        >
          Login
        </button>
      </form>

    </div>
  )
}
export default LoginMenu;
