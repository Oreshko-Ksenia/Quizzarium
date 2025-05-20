import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { getResultsByQuizId } from '../http/quizAPI';
import { Container, Card, ListGroup, Badge, Button } from 'react-bootstrap';
import { ClipLoader } from 'react-spinners';

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
  const [resultData, setResultData] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      console.log("Данные из API:", data);

      if (
        data &&
        typeof data === 'object' &&
        'title' in data &&
        'leaderboard' in data
      ) {
        setResultData(data as QuizResult);
      } else {
        throw new Error('Получены некорректные данные с сервера');
      }
    } catch (err: any) {
      console.error("Ошибка получения результатов:", err.message || err);
      setError(err.message || "Не удалось загрузить результаты");
    } finally {
      setLoading(false);
    }
  };

  fetchResults();
}, [quiz_id]);

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

  if (!resultData) {
    return <div className="text-center mt-5">Результаты не найдены</div>;
  }

  const {leaderboard } = resultData;


  return (
    <Container style={{ marginTop: '40px' }}>
          
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
        </Container>
      );
});

export default Results;