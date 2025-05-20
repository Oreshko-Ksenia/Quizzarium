import React, { useContext } from 'react';
import { observer } from 'mobx-react-lite';
import { Navbar, Nav, Container, Button, NavDropdown } from 'react-bootstrap';
import { NavLink, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import {
  HOME_ROUTE,
  LOGIN_ROUTE,
  REGISTRATION_ROUTE,
  QUIZCATALOG_ROUTE,
  ADMINPANEL_ROUTE,
  USER_ROUTE,
} from '@utils/consts';
import { Context } from '../index';

const NavBar = observer(() => {
  const context = useContext(Context);
  const navigate = useNavigate();
  const userRole = localStorage.getItem("role");

  if (!context) {
    throw new Error('Context is not provided');
  }

  const { user } = context;

  const logout = () => {
    const emptyUser = {
      user_id: -1,
      email: '',
      role: '',
    };
    user.setUser(emptyUser);
    user.setIsAuth(false);
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate(LOGIN_ROUTE);
  };

  const goToRegistration = () => {
    navigate(REGISTRATION_ROUTE);
  };

  const goToLogin = () => {
    navigate(LOGIN_ROUTE);
  };

  const goToCatalogs = () => {
    navigate(QUIZCATALOG_ROUTE);
  };

  const goToAdminPanel = () => {
    navigate(ADMINPANEL_ROUTE);
  };

  const goToProfile = () => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Вы не авторизованы");
      navigate(LOGIN_ROUTE);
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const user_id = payload.user_id;
      console.log("JWT Payload:", payload);
      if (!user_id) {
        alert("ID пользователя не найден в токене");
        return;
      }

      navigate(USER_ROUTE);
    } catch (e) {
      console.error("Ошибка разбора токена", e);
      alert("Неверный токен");
    }
  };

  return (
    <Navbar 
      expand="md" 
      data-bs-theme="light" 
      style={{ 
        backgroundColor: '#8E44AD',
        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15)',
      }}
    >
      <Container>
        <NavLink to={HOME_ROUTE} className="navbar-brand d-flex align-items-center text-white text-decoration-none">
          <img
            src="/icon.png"
            alt="Логотип"
            style={{ width: '50px', height: '45px', marginRight: '8px' }}
          />
          <span>Quizzarium</span>
        </NavLink>

        <Navbar.Toggle 
        aria-controls="basic-navbar-nav"
        style={{ borderWidth: 0, backgroundColor: "#eec7ff"}}
        />

        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="m-auto d-flex justify-content-center flex-wrap">
            <Button
              variant="light"
              onClick={goToCatalogs}
              style={{
                backgroundColor: '#D2B4DE',
                color: '#fff',
                border: 'none',
                margin: '0.25rem',
                transition: 'background-color 0.3s ease',
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#A569BD'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#D2B4DE'}
            >
              Категории
            </Button>

            {user.isAuth && userRole === "ADMIN" && (
              <Button
                variant="light"
                onClick={goToAdminPanel}
                style={{
                  backgroundColor: '#D2B4DE',
                  color: '#fff',
                  border: 'none',
                  margin: '0.25rem',
                  transition: 'background-color 0.3s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#A569BD'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#D2B4DE'}
              >
                Админ панель
              </Button>
            )}

            {user.isAuth ? (
              <>
                <Button
                  variant="light"
                  onClick={goToProfile}
                  style={{
                    backgroundColor: '#D2B4DE',
                    color: '#fff',
                    border: 'none',
                    margin: '0.25rem',
                    transition: 'background-color 0.3s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#A569BD'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#D2B4DE'}
                >
                  Профиль
                </Button>

                <Button
                  variant="light"
                  onClick={logout}
                  style={{
                    backgroundColor: '#D2B4DE',
                    color: '#fff',
                    border: 'none',
                    margin: '0.25rem',
                    transition: 'background-color 0.3s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#7D3C98'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#D2B4DE'}
                >
                  Выйти
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="light"
                  onClick={goToRegistration}
                  style={{
                    backgroundColor: '#D2B4DE',
                    color: '#fff',
                    border: 'none',
                    margin: '0.25rem',
                    transition: 'background-color 0.3s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#A569BD'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#D2B4DE'}
                >
                  Регистрация
                </Button>

                <Button
                  variant="light"
                  onClick={goToLogin}
                  style={{
                    backgroundColor: '#D2B4DE',
                    color: '#fff',
                    border: 'none',
                    margin: '0.25rem',
                    transition: 'background-color 0.3s ease'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#A569BD'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#D2B4DE'}
                >
                  Войти
                </Button>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
});

export default NavBar;