import React, { useContext, useEffect, useState } from 'react';
import AppRouter from './components/AppRouter';
import NavBar from './components/NavBar';
import { BrowserRouter } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { Context } from './index';
import { check } from './http/userAPI';
import { ClipLoader } from 'react-spinners';
import { FaTools } from 'react-icons/fa'; 

const App = observer(() => {
  const { user } = useContext(Context);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const authenticateUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const userData = await check();
        user.setUser(userData);
        user.setIsAuth(true);
      } catch (e) {
        console.error('Ошибка при проверке токена', e);
        user.setIsAuth(false);
      } finally {
        setLoading(false);
      }
    };

    authenticateUser();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <ClipLoader color="#bf85cc" size={50} />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(to right,rgb(243, 225, 251), #fff, #fff, #fff, rgb(243, 225, 251)',
          zIndex: -1,
          transition: 'background-color 0.5s ease',
        }}
      />

      <NavBar />
      <AppRouter />

      <a
        href="https://t.me/tttechnicalSupport_bot "
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Техническая поддержка"
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '60px',
          height: '60px',
          backgroundColor: '#4a90e2',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
          zIndex: 10000,
          textDecoration: 'none',
          transition: 'background-color 0.3s ease',
        }}
      >
        <FaTools size={24} color="#ffffff" />
      </a>
    </BrowserRouter>
  );
});

export default App;