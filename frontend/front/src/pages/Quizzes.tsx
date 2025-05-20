import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { getQuizzesByCategory } from "../http/quizAPI";
import quizStore from "../store/QuizStore";
import { Button, Form, Row, Col } from "react-bootstrap";
import { QUIZCATALOG_ROUTE, QUIZEPLAYER_ROUTE } from "@utils/consts";
import { Quiz } from "../store/QuizStore";
import { ClipLoader } from "react-spinners";

const Quizzes = observer(() => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [filteredQuizzes, setFilteredQuizzes] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        console.log("quizStore.selectedCategoryId:", quizStore.selectedCategoryId);

        if (!quizStore.selectedCategoryId) {
          console.error("ID категории не определен в MobX store");
          return;
        }

        const response = await getQuizzesByCategory(quizStore.selectedCategoryId);
        console.log("Ответ от сервера:", response);

        const quizzesData = response;
        setQuizzes(quizzesData);
        setFilteredQuizzes(quizzesData);
      } catch (error) {
        console.error("Ошибка при загрузке викторин:", error);
        alert("Не удалось загрузить викторины. Попробуйте еще раз.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <ClipLoader color="#bf85cc" size={50} />
      </div>
    );
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    const filtered = quizzes.filter((quiz) =>
      quiz.title.toLowerCase().includes(query)
    );
    setFilteredQuizzes(filtered);
  };

  return (
    <div
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1
        style={{
          textAlign: "center",
          marginBottom: "40px",
          fontWeight: "bold",
        }}
      >
        Викторины категории
      </h1>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "30px",
        }}
      >
        <Button
          variant="secondary"
          onClick={() => navigate(QUIZCATALOG_ROUTE)}
          style={{
            backgroundColor: "#8E44AD",
            border: "none",
            transition: "background-color 0.3s ease",
            fontSize: "1rem",
            marginRight: "5px",
            borderRadius: "8px",
            textAlign: "center",
            width: "auto", 
            height: "5%",
          }}
        >
          Назад
        </Button>

        <Form.Control
          type="text"
          placeholder="Поиск викторин..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="custom-search-input"
        />
      </div>

      {filteredQuizzes.length > 0 ? (
        <Row>
          {filteredQuizzes.map((quiz) => (
            <Col xs={12} sm={6} md={4} lg={3} key={quiz.quiz_id}>
              <QuizCard quiz={quiz} />
            </Col>
          ))}
        </Row>
      ) : (
        <p
          style={{
            textAlign: "center",
            marginTop: "40px",
            color: "#888",
            fontSize: "18px",
          }}
        >
          Нет доступных викторин.
        </p>
      )}
    </div>
  );
});

export default Quizzes;

const QuizCard = ({ quiz }: { quiz: Quiz }) => {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: "500px",
        height: "200px", 
        borderRadius: "10px",
        overflow: "hidden",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        marginRight: "20px",
        marginBottom: "20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      {quiz.image_url && (
        <img
          src={`http://localhost:5000${quiz.image_url}`}
          alt={quiz.title}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "brightness(50%)",
          }}
        />
      )}

      <div
        style={{
          position: "absolute",
          top: "15%",
          left: "50%",
          transform: "translateX(-50%)",
          color: "#fff",
          textAlign: "center",
        }}
      >
        <h3
          style={{
            whiteSpace: "nowrap", 
            overflow: "hidden", 
            textOverflow: "ellipsis", 
          }}
        >
          {quiz.title}
        </h3>
        {quiz.description && (
          <p
            style={{
              textAlign: "center",
              width: "100%",
            }}
          >
            {quiz.description}
          </p>
        )}
      </div>

      <Link to={`${QUIZEPLAYER_ROUTE}/${quiz.quiz_id}`}>
        <Button
          variant="primary"
          style={{
            position: "absolute",
            bottom: "10px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "50%",
            padding: "10px 20px",
          }}
        >
          Начать
        </Button>
      </Link>
    </div>
  );
};