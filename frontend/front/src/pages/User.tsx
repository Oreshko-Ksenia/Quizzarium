import React, { useEffect, useState, useRef } from "react";
import {
  getUserById,
  check,
  changePassword as apiChangePassword,
  updateAvatar,
  User as UserType,
} from "../http/userAPI";
import { getUserQuizzes, deleteQuiz } from "../http/quizAPI";
import { Button, Form, ListGroup, Alert } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { LEADER_ROUTE, QUIZCREATE_ROUTE, QUIZEDIT_ROUTE, QUIZEPLAYER_ROUTE, RESULTS_ROUTE } from "@utils/consts";
import { Quiz } from "store/QuizStore";
import { ClipLoader } from "react-spinners";
import { FiEdit, FiTrash2, FiPlay, FiAward } from "react-icons/fi"; 
import { ErrorMessage } from 'UI/ErrorMessage';
import { SuccessMessage } from 'UI/SuccessMessage';
import { ConfirmModal } from 'UI/ConfirmModal';

// Функция для генерации цвета на основе email
const getColorIndex = (email: string) => {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

const colors = [
  "#FF5733",
  "#33FF57",
  "#3357FF",
  "#F1C40F",
  "#8E44AD",
  "#16A085",
  "#E67E22",
  "#2C3E50",
  "#E74C3C",
  "#2980B9"
];

const getColorByEmail = (email: string | undefined): string => {
  if (!email) return "#999";
  const index = getColorIndex(email) % colors.length;
  return colors[index];
};

// Компонент карточки викторины с подтверждением удаления
const QuizCard = ({ quiz }: { quiz: Quiz }) => {
  const imageUrl = quiz.image_url;
  const navigate = useNavigate();
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleDeleteClick = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteQuiz(quiz.quiz_id);
      window.location.reload();
    } catch (error) {
      alert("Ошибка при удалении викторины");
    }
  };

  return (
    <>
      <ListGroup.Item key={quiz.quiz_id}>
        <div style={{ display: "flex", alignItems: "center" }}>
          {imageUrl ? (
            <img
              src={`http://localhost:5000${imageUrl}`}
              alt={quiz.title}
              style={{
                width: "60px",
                height: "60px",
                objectFit: "cover",
                borderRadius: "8px",
                marginRight: "15px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            />
          ) : (
            <div
              style={{
                width: "60px",
                height: "60px",
                backgroundColor: "#ddd",
                borderRadius: "8px",
                marginRight: "15px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                color: "#888",
                fontSize: "12px",
                textAlign: "center",
              }}
            >
              Нет<br />изобр.
            </div>
          )}
          <div>
            <h6 style={{ margin: 0, fontWeight: "bold" }}>{quiz.title}</h6>
            {quiz.description && (
              <small style={{ color: "#777", display: "block" }}>
                {quiz.description}
              </small>
            )}
          </div>
        </div>

        {/* Адаптивный контейнер для кнопок */}
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "5px",
          marginTop: "10px"
        }}>
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => {
              if (quiz.quiz_id) {
                navigate(`${QUIZEDIT_ROUTE}/${quiz.quiz_id}`);
              } else {
                alert("ID викторины не найден");
              }
            }}
            title={quiz.quiz_id ? "Редактировать" : "Невозможно редактировать"}
            disabled={!quiz.quiz_id}
          >
            <FiEdit />
          </Button>
          <Button
            variant="outline-danger"
            size="sm"
            onClick={handleDeleteClick}
            title="Удалить"
          >
            <FiTrash2 />
          </Button>
          <Button
            variant="outline-success"
            size="sm"
            onClick={() => {
              if (quiz.quiz_id) {
                navigate(`${QUIZEPLAYER_ROUTE}/${quiz.quiz_id}`);
              } else {
                alert("ID викторины не найден");
              }
            }}
            title="Пройти викторину"
          >
            <FiPlay />
          </Button>
          <Button
            variant="outline-info"
            size="sm"
            onClick={() => {
              if (quiz.quiz_id) {
                navigate(`${LEADER_ROUTE}/${quiz.quiz_id}`);
              } else {
                alert("ID викторины не найден");
              }
            }}
            title="Посмотреть таблицу лидеров"
          >
            <FiAward />
          </Button>
        </div>
      </ListGroup.Item>

      <ConfirmModal
        show={showConfirmModal}
        title="Подтвердите удаление"
        message="Вы уверены, что хотите удалить эту викторину?"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowConfirmModal(false)}
      />
    </>
  );
};

// Основной компонент пользователя
const User = observer(() => {
  const navigate = useNavigate();
  const location = useLocation();

  // Состояния
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Получаем ID из строки запроса
  const searchParams = new URLSearchParams(location.search);
  const userIdFromQuery = searchParams.get("id");
  const targetUserId = userIdFromQuery ? parseInt(userIdFromQuery) : undefined;

  // Загрузка данных пользователя
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const decodedToken = await check(); 
        const currentUserId = decodedToken.user_id;
        const currentUserRole = decodedToken.role;

        const userIdToLoad = targetUserId || currentUserId;

        if (userIdToLoad !== currentUserId && currentUserRole !== "ADMIN") {
          throw new Error("Вы можете просматривать только свой профиль");
        }

        const userData = await getUserById(userIdToLoad);
        setUser(userData);
        const quizzesData = await getUserQuizzes(userIdToLoad);
        setQuizzes(quizzesData);
      } catch (err: any) {
        setError(err.message || "Ошибка при загрузке данных");
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [targetUserId]);

  // Обработка изменения пароля
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (!newPassword.trim()) {
      setPasswordError("Пароль не может быть пустым");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Пароль должен содержать минимум 6 символов");
      return;
    }

    console.log("Отправляемый пароль:", newPassword);
    console.log("targetUserId:", targetUserId);

    try {
      const decodedToken = await check(); 
      const currentUserId = decodedToken.user_id;

      const userIdToChange = targetUserId || currentUserId;

      await apiChangePassword(newPassword, userIdToChange); 
      setPasswordSuccess(true);
      setNewPassword("");
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || "Ошибка при изменении пароля";
      setPasswordError(errorMessage);
    }
  };

  // Обработчики аватара
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0] || null;
    if (!file || !user) return;

    setAvatarFile(file);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const updatedUser = await updateAvatar(user.user_id, formData);
      setUser(updatedUser);
      setAvatarFile(null);
    } catch (err: any) {
      console.error("Ошибка при загрузке аватара:", err.message);
    }
  };

  // Рендер загрузки
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <ClipLoader color="#bf85cc" size={50} />
      </div>
    );
  }

  // Рендер ошибки
  if (error) {
    return (
      <Alert variant="danger">
        {error}
        <Button variant="outline-danger" onClick={() => navigate(0)}>
          Повторить
        </Button>
      </Alert>
    );
  }

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "0 auto",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
        border: "1px solid #ddd",
        borderRadius: "8px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
      }}
    >
      <h2
        style={{
          textAlign: "center",
          marginBottom: "20px",
          color: "#333",
          fontWeight: "bold",
        }}
      >
        Профиль пользователя
      </h2>

      {user && (
        <>
          <div
            style={{
              textAlign: "center",
              marginBottom: "20px",
              cursor: "pointer",
            }}
            onClick={handleAvatarClick}
          >
            {user.avatar ? (
              <img
                src={`http://localhost:5000${user.avatar}?v=${Date.now()}`}
                alt="Аватар"
                style={{
                  width: "100px",
                  height: "100px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "3px solid #ccc",
                  transition: "border-color 0.3s",
                }}
                title="Нажмите, чтобы изменить аватар"
              />
            ) : (
              <div
                style={{
                  width: "100px",
                  height: "100px",
                  backgroundColor: getColorByEmail(user.email),
                  color: "#fff",
                  fontSize: "48px",
                  fontWeight: "bold",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  margin: "0 auto",
                  textTransform: "uppercase",
                  borderRadius: "50%",
                  border: "3px solid #ccc",
                  transition: "border-color 0.3s",
                }}
                title="Нажмите, чтобы установить аватар"
              >
                {user.email.charAt(0)}
              </div>
            )}
          </div>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
          <p style={{ fontSize: "18px", marginBottom: "10px" }}>
            <strong>Email:</strong> {user.email}
          </p>
        </>
      )}

      <Form onSubmit={handlePasswordChange} style={{ marginTop: "20px" }}>
        <h4
          style={{
            marginBottom: "10px",
            color: "#555",
          }}
        >
          Изменить пароль
        </h4>
        <Form.Group className="mb-3">
          <Form.Control
            type="password"
            placeholder="Новый пароль"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </Form.Group>
        {passwordError && <ErrorMessage message={passwordError} onClose={() => setPasswordError(null)} />}
        {passwordSuccess && <SuccessMessage message="Пароль успешно изменён!" onClose={() => setPasswordSuccess(false)} />}
        <Button variant="primary" type="submit">
          Сохранить новый пароль
        </Button>
      </Form>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "10px",
        }}
      >
        <span>Список ваших викторин:</span>
        <Button
          variant="success"
          onClick={() =>
            navigate(`${QUIZCREATE_ROUTE}?user_id=${user?.user_id}`)
          }
          style={{
            border: "none",
            background: "#9455ab",
            transition: "background-color 0.3s ease", 
            cursor: "pointer", 
            marginTop: "10px",
            padding: "0.5rem 1rem",
            borderRadius: "8px", 
            fontSize: "1rem", 
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#7f3d8a")} 
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#9455ab")} 
        >
          + Создать викторину
        </Button>
      </div>

      {quizzes.length > 0 ? (
        <ListGroup>
          {quizzes.map((quiz) => (
            <QuizCard key={quiz.quiz_id} quiz={quiz} />
          ))}
        </ListGroup>
      ) : (
        <Alert variant="info">У пользователя пока нет викторин</Alert>
      )}
    </div>
  );
});

export default User;