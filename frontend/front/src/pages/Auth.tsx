import { observer } from 'mobx-react-lite';
import React, { useContext, useEffect, useState } from 'react';
import { Button, Card, Col, Container, Form, Row } from 'react-bootstrap';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  HOME_ROUTE,
  REGISTRATION_ROUTE,
  LOGIN_ROUTE,
} from '@utils/consts';
import { Context } from 'index';
import { login, registration } from 'http/userAPI';
import { ErrorMessage } from '../UI/ErrorMessage'; 
import { SuccessMessage } from 'UI/SuccessMessage';
import axios from 'axios';

const Auth = observer(() => {
  const navigate = useNavigate();
  const { user } = useContext(Context);
  const location = useLocation();
  const isLogin = location.pathname === LOGIN_ROUTE;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    user.setIsAuth(false);
    console.log('isAuth установлен как false');
  }, []);

  useEffect(() => {
    if (user.isAuth) {
      navigate(HOME_ROUTE);
    }
  }, [user.isAuth, navigate]);

  // Валидация email
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Проверка домена для регистрации
  const isValidDomainForRegistration = (email: string): boolean => {
    const allowedDomain = '@mail.ru';
    return email.toLowerCase().endsWith(allowedDomain);
  };

  // Валидация пароля
  const isValidPassword = (password: string): boolean => {
    const minLength = password.length >= 6;
    const hasNumber = /\d/.test(password);
    const hasUpperCase = /[A-ZА-Я]/.test(password);

    return minLength && hasNumber && hasUpperCase;
  };

  const click = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!isValidEmail(email)) {
      setErrorMessage('Пожалуйста, введите корректный email.');
      return;
    }

    if (!isLogin && !isValidDomainForRegistration(email)) {
      setErrorMessage('Регистрация разрешена только с email-адресами @mail.ru');
      return;
    }

    if (!isLogin && !isValidPassword(password)) {
      setErrorMessage(
        'Пароль должен содержать:\n' +
          '- минимум 6 символов\n' +
          '- хотя бы одну цифру\n' +
          '- хотя бы одну заглавную букву'
      );
      return;
    }

    try {
      let data;

      if (isLogin) {
        data = await login(email, password);
      } else {
        data = await registration(email, password);
      }

      console.log('Ответ от сервера:', data);

      const isBlocked =
        (typeof data === 'object' &&
          data !== null &&
          'blocked' in data &&
          data.blocked === true) ||
        (typeof data === 'object' &&
          data !== null &&
          'message' in data &&
          typeof data.message === 'string' &&
          data.message.toLowerCase().includes('заблокирован'));

      if (isBlocked) {
        setErrorMessage('Ваш аккаунт заблокирован. Обратитесь в техническую поддержку для разблокировки.');
        return;
      }

      user.setUser(data);
      user.setIsAuth(true);

      if (data.role) {
        localStorage.setItem('role', data.role);
      }

      setSuccessMessage('Успешная авторизация! Переходим...');

      setTimeout(() => {
        navigate(HOME_ROUTE);
      }, 1);

    }  catch (e) {
    if (axios.isAxiosError(e)) {
      const error = e as any;

      if (error.response) {
        const responseData = error.response.data;
        const status = error.response.status;

        if (status === 403) {
          setErrorMessage('Ваш аккаунт заблокирован. Обратитесь в техническую поддержку.');
          return;
        }

        const message = responseData.message || 'Ошибка авторизации';

        setErrorMessage(message);
      } else {
        setErrorMessage('Не удалось связаться с сервером. Попробуйте позже.');
      }
    } else {
      setErrorMessage('Произошла неизвестная ошибка. Пожалуйста, попробуйте снова.');
    }
  }
}

  return (
    <Container
      className="d-flex justify-content-center align-items-center"
      style={{ height: window.innerHeight - 54 }}
    >
      {errorMessage && (
        <ErrorMessage message={errorMessage} onClose={() => setErrorMessage(null)} />
      )}
      {successMessage && (
        <SuccessMessage message={successMessage} onClose={() => setSuccessMessage(null)} />
      )}

      <Card style={{ width: 600 }} className="p-5">
        <h2 className="m-auto">{isLogin ? 'Авторизация' : 'Регистрация'}</h2>
        <Form className="d-flex flex-column">
          <Form.Control
            className="mt-3"
            placeholder="Введите ваш email..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
          />
          <Form.Control
            className="mt-3"
            placeholder="Введите ваш пароль..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
          />

          <Row className="d-flex justify-content-between mt-3 pl-3 pr-3">
            <Col xs="auto">
              {isLogin ? (
                <div className="d-flex align-items-center">
                  Нет аккаунта?{' '}
                  <NavLink to={REGISTRATION_ROUTE}>Зарегистрируйтесь!</NavLink>
                </div>
              ) : (
                <div>
                  Есть аккаунт?{' '}
                  <NavLink to={LOGIN_ROUTE}>Войдите!</NavLink>
                </div>
              )}
            </Col>
            <Col xs="auto">
              <Button
                className="mt-2 align-self-end"
                variant="outline-success"
                onClick={click}
              >
                {isLogin ? 'Войти' : 'Регистрация'}
              </Button>
            </Col>
          </Row>
        </Form>
      </Card>
    </Container>
  );
});

export default Auth;