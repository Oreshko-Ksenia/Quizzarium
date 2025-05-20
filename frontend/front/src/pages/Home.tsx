import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Button,
  Carousel,
  ListGroup,
} from "react-bootstrap";
import { observer } from "mobx-react-lite";
import { useNavigate } from 'react-router-dom';
import { QUIZCREATE_ROUTE, QUIZEPLAYER_ROUTE } from '@utils/consts';
import { ClipLoader } from "react-spinners";
import { getAllCategories } from '../http/categoryAPI';
import { getAllQuizzes } from '../http/quizAPI';
import { Category } from "store/CatalogStore";
import { Quiz } from "store/QuizStore";

const getRandomItems = <T extends Record<string, any>>(
  items: T[],
  count: number,
  idKey: keyof T
): T[] => {
  if (!Array.isArray(items) || items.length === 0) return [];

  const validItems = items.filter(item => idKey in item);
  if (validItems.length === 0) return [];

  const shuffled = [...validItems].sort(() => 0.5 - Math.random());

  return shuffled.slice(0, count);
};

const getStableSelection = <T extends Record<string, any>>(
  key: string,
  allItems: T[],
  count: number,
  idKey: keyof T
): T[] => {
  if (!Array.isArray(allItems) || allItems.length === 0) return [];

  const savedIdsStr = localStorage.getItem(key);
  let savedIds: string[] = [];

  try {
    savedIds = savedIdsStr ? JSON.parse(savedIdsStr) : [];
  } catch {
    savedIds = [];
  }

  const existingItems = allItems.filter(item =>
    savedIds.includes(String(item[idKey]))
  );

  if (existingItems.length >= count) {
    return existingItems.slice(0, count);
  }

  const remainingCount = count - existingItems.length;
  const availableNewItems = allItems.filter(
    item => !savedIds.includes(String(item[idKey]))
  );

  const newSelections = getRandomItems(availableNewItems, remainingCount, idKey);

  const selected = [...existingItems, ...newSelections];
  const selectedIds = selected.map(item => String(item[idKey]));

  localStorage.setItem(key, JSON.stringify(selectedIds));

  return selected;
};

export default observer(function Home() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const categoriesData = await getAllCategories();
        const quizzesData = await getAllQuizzes(); 
  
        console.log("Все категории:", categoriesData);
        console.log("Все викторины:", quizzesData);
  
        const stableCategories = getStableSelection(
          "popular_categories",
          categoriesData.categories,
          3,
          "category_id"
        );
        const stableQuizzes = getStableSelection(
          "popular_quizzes",
          quizzesData,
          3,
          "quiz_id"
        );

        setCategories(stableCategories);
        setQuizzes(stableQuizzes);
  
      } catch (err) {
        setError("Не удалось загрузить популярные категории и викторины");
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <ClipLoader color="#bf85cc" size={50} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center mt-5">
        <h4>{error}</h4>
        <Button onClick={() => window.location.reload()} variant="danger">Повторить</Button>
      </div>
    );
  }

  return (
    <Container className="mt-5">
      <div className="text-center mb-5">
        <h1>Добро пожаловать в мир викторин!</h1>
        <p className="lead">
          Проверьте свои знания в различных категориях и станьте экспертом!
        </p>
        <Button variant="primary" size="lg" onClick={() => navigate(QUIZCREATE_ROUTE)}>
          Создать свою викторину
        </Button>
      </div>

      <div className="mb-5">
        <h2 className="text-center mb-4">Популярные категории</h2>
        <Carousel>
          {categories.map((category) => (
            <Carousel.Item key={category.category_id}>
              <div
                style={{
                  height: "400px",
                  backgroundImage: category.imageUrl
                    ? `url(http://localhost:5000${category.imageUrl})`
                    : `url(/static/default-category.jpg)`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  position: "relative",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  color: "white",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    backgroundColor: "rgba(0, 0, 0, 0.6)",
                    zIndex: 1,
                  }}
                ></div>

                <div
                  style={{
                    position: "relative",
                    zIndex: 2,
                    textAlign: "center",
                    padding: "1rem",
                    color: "white",
                  }}
                >
                  <h3>{category.name}</h3>
                </div>
              </div>
            </Carousel.Item>
          ))}
        </Carousel>
      </div>

      <div className="mb-5">
        <h2 className="text-center mb-4">Популярные викторины</h2>
        <Row xs={1} md={2} lg={3} className="g-4">
          {quizzes.map((quiz) => (
            <Col key={quiz.quiz_id}>
              <ListGroup.Item
                style={{
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "1rem",
                  borderRadius: "8px",
                  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
                  transition: "background-color 0.3s",
                  height: "100%",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "150px",
                    backgroundImage: quiz.image_url
                      ? `url(http://localhost:5000${quiz.image_url})`
                      : `url(/static/default-quiz.jpg)`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    marginBottom: "1rem",
                    borderRadius: "8px",
                    overflow: "hidden",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                  }}
                />
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => navigate(`${QUIZEPLAYER_ROUTE}/${quiz.quiz_id}`)}
                >
                  Начать
                </Button>
              </ListGroup.Item>
            </Col>
          ))}
        </Row>
      </div>
    </Container>
  );
});