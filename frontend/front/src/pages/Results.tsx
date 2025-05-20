import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useParams, useNavigate } from 'react-router-dom';
import { getResultsByQuizId } from '../http/quizAPI';
import { Container, Card, ListGroup, Badge, Button } from 'react-bootstrap';
import { ClipLoader } from 'react-spinners';
import { jwtDecode } from 'jwt-decode';
import { DecodedToken } from '../http/userAPI';

export interface QuizResult {
  title?: string;
  leaderboard: Array<{
    user_id: number;
    email: string;
    correct_answers: number;
    total_questions: number;
    score: number;
    completed_at: string;
  }>;
}

const Results = observer(() => {
  const { quiz_id } = useParams<{ quiz_id: string }>();
  const navigate = useNavigate();
  const [resultData, setResultData] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getCurrentUser = (): { user_id: number; email: string } | null => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      return {
        user_id: decoded.user_id,
        email: decoded.email,
      };
    } catch {
      return null;
    }
  };

  const currentUser = getCurrentUser();

  useEffect(() => {
    const fetchResults = async () => {
      if (!quiz_id) {
        setError("ID викторины не указан");
        setLoading(false);
        return;
      }

      try {
        const numericQuizId = parseInt(quiz_id, 10);
        if (isNaN(numericQuizId)) {
          setError("Некорректный ID викторины");
          setLoading(false);
          return;
        }

        const data = await getResultsByQuizId(numericQuizId);
        setResultData(data);
      } catch (err: any) {
        setError(err.message || "Не удалось загрузить результаты");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [quiz_id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', height: '100vh' }}>
        <ClipLoader color="#bf85cc" size={50} />
      </div>
    );
  }

  if (error) {
    return <div className="text-danger text-center mt-5">{error}</div>;
  }

  if (!resultData) {
    return <div className="text-center mt-5">Результаты не найдены</div>;
  }

  const { title, leaderboard } = resultData;

  const currentUserResult = currentUser
    ? leaderboard
        .filter(entry => entry.user_id === currentUser.user_id)
        .sort((a, b) =>
          new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
        )
        .find(Boolean)
    : null;

  const correct = currentUserResult?.correct_answers ?? 0;
  const total = currentUserResult?.total_questions ?? 0;
  const percentage = currentUserResult?.score ?? 0;

  return (
    <Container style={{ marginTop: '40px' }}>
      <h2>
        Результат викторины: "<strong>{title ?? 'Без названия'}</strong>"
      </h2>

      <Card bg="light" className="mb-4">
        <Card.Body>
          <h4>Ваш результат:</h4>
          {currentUser ? (
            currentUserResult ? (
              <>
                <p>
                  Правильных ответов: <strong>{correct}</strong> из{' '}
                  <strong>{total}</strong>
                </p>
                <p>
                  Процент правильных: <Badge bg="success">{percentage}%</Badge>
                </p>
              </>
            ) : (
              <p>Вы ещё не проходили эту викторину.</p>
            )
          ) : (
            <p>Пользователь не авторизован.</p>
          )}
        </Card.Body>
      </Card>

      <h4>Таблица лидеров:</h4>
      {leaderboard.length > 0 ? (
        <ListGroup>
          {leaderboard
            .slice()
            .sort((a, b) => {
              if (b.correct_answers !== a.correct_answers) {
                return b.correct_answers - a.correct_answers;
              }
              return new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime();
            })
            .map((entry, index) => (
              <ListGroup.Item key={index}>
                <strong>{entry.email}</strong> — {entry.correct_answers} / {entry.total_questions}
                <small className="text-muted ms-3">
                  {new Date(entry.completed_at).toLocaleString()}
                </small>
              </ListGroup.Item>
            ))}
        </ListGroup>
      ) : (
        <p>Результатов пока нет.</p>
      )}

      <div className="mt-4 text-center">
        <Button onClick={() => navigate(-1)} variant="outline-primary">
          Вернуться к викторине
        </Button>
      </div>
    </Container>
  );
});

export default Results;