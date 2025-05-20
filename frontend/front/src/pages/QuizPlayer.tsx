import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useParams, useNavigate } from 'react-router-dom';
import { RESULTS_ROUTE } from '@utils/consts';
import { submitQuizResult } from '../http/quizAPI';
import { ClipLoader } from 'react-spinners';
import { Quiz } from 'store/QuizStore';
import { $authHost } from 'http/index';
import { Question } from 'store/QuestionStore';
import { Answer } from 'store/AnswerStore';
import { jwtDecode } from 'jwt-decode';
import { DecodedToken } from 'http/userAPI';
import { ErrorMessage } from 'UI/ErrorMessage';
import { SuccessMessage } from 'UI/SuccessMessage';

interface QuestionWithAnswers extends Question {
  answers: Answer[];
}

interface QuizData extends Quiz {
  questions: QuestionWithAnswers[];
}

const QuizPlayer = observer(() => {
  const { quiz_id } = useParams<{ quiz_id: string }>();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [questionId: number]: number[] }>({});
  const [highlightedAnswers, setHighlightedAnswers] = useState<{
    correct: number[];
    incorrect: number[];
    unselectedCorrect: number[];
  }>({
    correct: [],
    incorrect: [],
    unselectedCorrect: [],
  });
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | null;
  } | null>(null);

  const getUserIdFromToken = (): number | null => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const decoded: DecodedToken = jwtDecode(token);
      return decoded.user_id;
    } catch {
      return null;
    }
  };

  const user_id = getUserIdFromToken();

  useEffect(() => {
    if (!quiz_id) {
      setError('ID викторины не указан');
      setLoading(false);
      return;
    }

    const fetchQuiz = async () => {
      try {
        const numericQuizId = parseInt(quiz_id, 10);
        if (isNaN(numericQuizId)) {
          setError("Некорректный ID викторины");
          setLoading(false);
          return;
        }
        const response = await $authHost.get(`/api/quiz/${numericQuizId}`);
        setQuiz(response.data);
      } catch (err: any) {
        console.error('Ошибка загрузки викторины:', err.message || err);
        setError('Не удалось загрузить викторину');
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [quiz_id]);

  const currentQuestion = quiz?.questions[currentQuestionIndex];

  const handleAnswerSelect = (answerId: number) => {
    if (!currentQuestion || isSubmitted) return;
    const qId = currentQuestion.question_id;
    const currentSelections = selectedAnswers[qId] || [];
    const isAlreadySelected = currentSelections.includes(answerId);
    const newSelections = isAlreadySelected
      ? currentSelections.filter(id => id !== answerId)
      : [...currentSelections, answerId];
    setSelectedAnswers({
      ...selectedAnswers,
      [qId]: newSelections,
    });
  };

  const handleSubmit = () => {
    if (!currentQuestion) return;

    const qId = currentQuestion.question_id;
    const selected = selectedAnswers[qId] || [];

    if (selected.length === 0) {
      setNotification({ message: 'Выберите хотя бы один вариант', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    const correctAnswerIds = currentQuestion.answers
      .filter(a => a.is_correct)
      .map(a => a.answer_id);

    const correctHighlights = selected.filter(id => correctAnswerIds.includes(id));
    const incorrectHighlights = selected.filter(id => !correctAnswerIds.includes(id));
    const unselectedCorrect = correctAnswerIds.filter(id => !selected.includes(id));

    setHighlightedAnswers({
      correct: correctHighlights,
      incorrect: incorrectHighlights,
      unselectedCorrect: unselectedCorrect,
    });

    setIsSubmitted(true);
  };

  const goToNextQuestion = () => {
    setHighlightedAnswers({
      correct: [],
      incorrect: [],
      unselectedCorrect: [],
    });
    setIsSubmitted(false);
    if (!quiz) return;
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
    } else {
      submitQuiz();
    }
  };

  const goToPrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prevIndex => prevIndex - 1);
      setIsSubmitted(false);
    }
  };

  const submitQuiz = async () => {
    if (!quiz || !quiz.quiz_id) {
      setNotification({ message: 'Викторина не загружена', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    let correctQuestions = 0;
    quiz.questions.forEach(q => {
      const selectedAnswerIds = selectedAnswers[q.question_id] || [];
      const correctAnswerIds = q.answers
        .filter(a => a.is_correct)
        .map(a => a.answer_id);
      const allCorrect =
        correctAnswerIds.length > 0 &&
        correctAnswerIds.every(id => selectedAnswerIds.includes(id)) &&
        selectedAnswerIds.every(id => correctAnswerIds.includes(id));

      if (allCorrect) correctQuestions += 1;
    });

    try {
      await submitQuizResult(quiz.quiz_id, correctQuestions, quiz.questions.length);
      setNotification({ message: 'Викторина успешно завершена!', type: 'success' });
      setTimeout(() => {
        navigate(`${RESULTS_ROUTE}/${quiz.quiz_id}`);
      }, 1);
    } catch (err) {
      console.error('Ошибка отправки результата:', err);
      setNotification({ message: 'Ошибка сохранения результата', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const renderMedia = (media: string | File | null | undefined) => {
    if (!media) return null;
    let url: string;
    if (media instanceof File) {
      url = URL.createObjectURL(media);
    } else if (typeof media === 'string') {
      url = media.startsWith('http') ? media : `http://localhost:5000${media}`;
    } else {
      return null;
    }
    const ext = url.split('.').pop()?.toLowerCase() || '';
    const supportedImages = ['jpg', 'jpeg', 'png', 'gif'];
    const supportedVideos = ['mp4', 'webm', 'ogg'];
    const supportedAudios = ['mp3', 'wav', 'ogg'];

    if (supportedImages.includes(ext)) {
      return (
        <img
          src={url}
          alt="Медиа"
          style={{
            width: '100%',
            maxHeight: '300px',
            objectFit: 'contain',
            margin: '1rem 0',
          }}
        />
      );
    } else if (supportedVideos.includes(ext)) {
      return (
        <video
          src={url}
          controls
          style={{ width: '100%', maxHeight: '300px' }}
        >
          Ваш браузер не поддерживает видео.
        </video>
      );
    } else if (supportedAudios.includes(ext)) {
      return (
        <audio
          src={url}
          controls
          style={{ width: '100%', margin: '1rem 0' }}
        >
          Ваш браузер не поддерживает аудио.
        </audio>
      );
    } else {
      return <p>Неподдерживаемый формат медиа</p>;
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
      }}>
        <ClipLoader color="#bf85cc" size={50} />
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div style={{
        textAlign: 'center',
        marginTop: '40px',
      }}>
        <h3>{error || 'Викторина не найдена'}</h3>
        <button onClick={() => navigate(-1)} style={{ padding: '10px 20px', fontSize: '16px' }}>
          Вернуться назад
        </button>
      </div>
    );
  }

  const qId = currentQuestion?.question_id ?? -1;
  const isSelected = (answerId: number) =>
    selectedAnswers[qId]?.includes(answerId) || false;
  const isCorrectHighlighted = (answerId: number) =>
    highlightedAnswers.correct.includes(answerId);
  const isIncorrectHighlighted = (answerId: number) =>
    highlightedAnswers.incorrect.includes(answerId);
  const isUnselectedCorrect = (answerId: number) =>
    highlightedAnswers.unselectedCorrect.includes(answerId);

  return (
    <div style={{
      maxWidth: '700px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: '"Segoe UI", sans-serif',
      textAlign: 'center',
    }}>
      {/* Уведомления */}
      {notification && notification.type === 'error' && (
        <ErrorMessage message={notification.message} onClose={() => setNotification(null)} />
      )}
      {notification && notification.type === 'success' && (
        <SuccessMessage message={notification.message} onClose={() => setNotification(null)} />
      )}

      <h1 style={{
        fontSize: '28px',
        fontWeight: 'bold',
        marginBottom: '20px',
      }}>{quiz.title}</h1>

      <div style={{
        fontSize: '16px',
        color: '#666',
        marginBottom: '20px',
      }}>
        Вопрос {currentQuestionIndex + 1} из {quiz.questions.length}
      </div>

      <div style={{
        backgroundColor: '#fff',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        padding: '30px',
        transition: 'all 0.3s ease',
      }}>
        <h2 style={{
          fontSize: '22px',
          fontWeight: '600',
          marginBottom: '20px',
        }}>
          {currentQuestion?.text || 'Без текста'}
        </h2>
        {renderMedia(currentQuestion?.media_url)}

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '15px',
          marginBottom: '30px',
        }}>
          {currentQuestion?.answers.map((answer) => (
            <div key={answer.answer_id}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                backgroundColor: isCorrectHighlighted(answer.answer_id)
                  ? '#d4f4dd'
                  : isIncorrectHighlighted(answer.answer_id)
                  ? '#f8d7da'
                  : isUnselectedCorrect(answer.answer_id)
                  ? '#cce5ff'
                  : isSelected(answer.answer_id)
                  ? '#e6d3f7'
                  : 'white',
                width: '100%',
                boxSizing: 'border-box',
              }}>
                <input
                  type="checkbox"
                  checked={isSelected(answer.answer_id)}
                  onChange={() => handleAnswerSelect(answer.answer_id)}
                  disabled={isSubmitted}
                  style={{ marginRight: '15px', transform: 'scale(1.2)' }}
                />
                <span style={{ flex: 1, textAlign: 'left', fontSize: '16px' }}>
                  {answer.text}
                </span>
              </label>
              {renderMedia(answer.media_url)}
            </div>
          ))}
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
        }}>
          {currentQuestionIndex > 0 && (
            <button
              onClick={goToPrevQuestion}
              style={{
                padding: '10px 20px',
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#fff',
                backgroundColor: '#7b4cdf',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              Назад
            </button>
          )}

          {!isSubmitted ? (
            <button
              onClick={handleSubmit}
              style={{
                marginLeft: 'auto',
                padding: '10px 20px',
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#fff',
                backgroundColor: '#7b4cdf',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              Проверить
            </button>
          ) : (
            <button
              onClick={goToNextQuestion}
              style={{
                marginLeft: 'auto',
                padding: '10px 20px',
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#fff',
                backgroundColor: '#4caf50',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              {currentQuestionIndex === quiz.questions.length - 1 ? 'Завершить' : 'Далее'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

export default QuizPlayer;