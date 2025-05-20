import React, { useEffect, useState } from "react";
import {
  getAllUsers,
  blockUser,
  changeUserRole,
  createUser,
  deleteUser,
  User
} from "../http/userAPI";
import {
  ListGroup,
  Container,
  Row,
  Col,
  Button,
  Form,
  Alert
} from "react-bootstrap";
import { USER_ROUTE } from "@utils/consts";
import { useNavigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { ClipLoader } from "react-spinners";
import { FiUser, FiLock, FiUnlock, FiEdit2, FiTrash2 } from "react-icons/fi";
import { ConfirmModal } from '../UI/ConfirmModal';
import { SuccessMessage } from '../UI/SuccessMessage';
import { ErrorMessage } from '../UI/ErrorMessage';

export default observer(function AdminPanel() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [newEmail, setNewEmail] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [newRole, setNewRole] = useState<string>("CLIENT");

  // Для модального окна
  const [showConfirm, setShowConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getAllUsers();
        setUsers(data);
      } catch (err: any) {
        setError(err.message || "Не удалось загрузить пользователей");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleBlockToggle = async (user: User) => {
    if (!user.user_id) return;
    try {
      const updatedUser = await blockUser(user.user_id, !user.blocked);
      setUsers(users.map(u => u.user_id === updatedUser.user_id ? updatedUser : u));
    } catch (err) {
      console.error("Ошибка при изменении статуса блокировки:", err);
      setError("Не удалось изменить статус блокировки");
      setSuccess(null);
    }
  };

  const handleChangeRole = async (user: User) => {
    if (!user.user_id) return;
    const newRole = user.role === "CLIENT" ? "ADMIN" : "CLIENT";
    try {
      const updatedUser = await changeUserRole(user.user_id, newRole);
      setUsers(users.map(u => u.user_id === updatedUser.user_id ? updatedUser : u));
    } catch (err) {
      console.error("Ошибка при смене роли:", err);
      setError("Не удалось изменить роль пользователя");
      setSuccess(null);
    }
  };

  const handleAddUser = async () => {
    // Валидация email и пароля
    if (!newEmail.trim()) {
      setError("Введите email");
      setSuccess(null);
      return;
    }

    if (!newPassword.trim()) {
      setError("Введите пароль");
      setSuccess(null);
      return;
    }

    try {
      const newUser = await createUser(newEmail, newPassword, newRole);
      setUsers([...users, newUser]);
      setNewEmail("");
      setNewPassword("");
      setNewRole("CLIENT");
      setSuccess("Пользователь успешно добавлен");
      setError(null);
    } catch (err) {
      console.error("Ошибка при создании пользователя:", err);
      setError("Не удалось создать пользователя");
      setSuccess(null);
    }
  };

  const confirmDeleteUser = (user: User) => {
    setUserToDelete(user);
    setShowConfirm(true);
  };

  const handleDeleteConfirmed = async () => {
  const user = userToDelete;
  if (!user?.user_id) {
    setError("ID пользователя отсутствует");
    return;
  }

  try {
    await deleteUser(user.user_id);
    setUsers(users.filter(u => u.user_id !== user.user_id)); 
    setSuccess("Пользователь успешно удалён");
  } catch (err: any) {
    console.error("Ошибка при удалении пользователя:", err.message);
    
    if (err.response?.status === 500) {
      setError("Внутренняя ошибка сервера. Попробуйте позже.");
    } else {
      setError(err.response?.data?.message || "Не удалось удалить пользователя");
    }
    } finally {
      setShowConfirm(false);
      setUserToDelete(null);
    }
  };

  const closeError = () => setError(null);
  const closeSuccess = () => setSuccess(null);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <ClipLoader color="#bf85cc" size={50} />
      </div>
    );
  }

  return (
    <Container style={{ marginTop: "2rem", paddingBottom: "60px" }}>
      <h2 className="mb-4">Панель администратора</h2>

      {/* Сообщения об ошибках и успехе */}
      {error && <ErrorMessage message={error} onClose={closeError} />}
      {success && <SuccessMessage message={success} onClose={closeSuccess} />}

      <div style={{ marginBottom: "2rem", border: "1px solid #ccc", padding: "1rem", borderRadius: "8px" }}>
        <h5>Добавить пользователя</h5>
        <Form.Group className="mb-2">
          <Form.Control
            type="email"
            placeholder="Email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
          />
        </Form.Group>
        <Form.Group className="mb-2">
          <Form.Control
            type="password"
            placeholder="Пароль"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </Form.Group>
        <Form.Select
          className="mb-2"
          value={newRole}
          onChange={(e) => setNewRole(e.target.value)}
        >
          <option value="CLIENT">CLIENT</option>
          <option value="ADMIN">ADMIN</option>
        </Form.Select>
        <Button variant="success" onClick={handleAddUser}>
          Добавить
        </Button>
      </div>

      <ListGroup>
        <ListGroup.Item variant="dark">
          <Row>
            <Col>ID</Col>
            <Col>Email</Col>
            <Col>Роль</Col>
            <Col>Блокирован</Col>
            <Col>Действия</Col>
          </Row>
        </ListGroup.Item>

        {users.length > 0 ? (
          users.map((user) => (
            <ListGroup.Item key={user.user_id}>
              <Row className="align-items-center">
                <Col>{user.user_id}</Col>
                <Col>{user.email}</Col>
                <Col>{user.role}</Col>
                <Col>{user.blocked ? "Да" : "Нет"}</Col>
                <Col className="d-flex align-items-center gap-2">
                  <Button
                    variant="info"
                    title="Открыть профиль"
                    onClick={() => navigate(`${USER_ROUTE}?id=${user.user_id}`)}
                    style={{
                      width: "36px",
                      height: "36px",
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.1rem"
                    }}
                  >
                    <FiUser />
                  </Button>

                  <Button
                    variant={user.blocked ? "success" : "danger"}
                    title={user.blocked ? "Разблокировать" : "Заблокировать"}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBlockToggle(user);
                    }}
                    style={{
                      width: "36px",
                      height: "36px",
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.1rem"
                    }}
                  >
                    {user.blocked ? <FiUnlock /> : <FiLock />}
                  </Button>

                  <Button
                    variant="warning"
                    title={user.role === "CLIENT" ? "Сделать ADMIN" : "Сделать CLIENT"}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleChangeRole(user);
                    }}
                    style={{
                      width: "36px",
                      height: "36px",
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.1rem"
                    }}
                  >
                    <FiEdit2 />
                  </Button>

                  <Button
                    variant="outline-danger"
                    title="Удалить пользователя"
                    onClick={(e) => confirmDeleteUser(user)}
                    style={{
                      width: "36px",
                      height: "36px",
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.1rem"
                    }}
                  >
                    <FiTrash2 />
                  </Button>
                </Col>
              </Row>
            </ListGroup.Item>
          ))
        ) : (
          <ListGroup.Item>Пользователи не найдены</ListGroup.Item>
        )}
      </ListGroup>

      {/* Модальное окно подтверждения */}
      <ConfirmModal
        show={showConfirm}
        title="Подтверждение удаления"
        message="Вы уверены, что хотите удалить этого пользователя?"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setShowConfirm(false)}
      />
    </Container>
  );
});