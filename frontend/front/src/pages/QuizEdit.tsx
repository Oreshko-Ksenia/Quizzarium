import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { QUIZCATALOG_ROUTE, USER_ROUTE } from '@utils/consts';
import { getQuizById, updateQuiz } from 'http/quizAPI';
import { getAllCategories } from 'http/categoryAPI';
import { Question } from '../store/QuestionStore';
import { ClipLoader } from 'react-spinners';
import { Answer } from 'store/AnswerStore';
import { Button } from 'react-bootstrap';
import { ErrorMessage } from 'UI/ErrorMessage';
import { SuccessMessage } from 'UI/SuccessMessage';
import { ConfirmModal } from 'UI/ConfirmModal';

const QuizEdit = observer(() => {
  const navigate = useNavigate();
  const { quiz_id } = useParams();
  const quizId = quiz_id ? parseInt(quiz_id) : undefined;

  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [categoryId, setCategoryId] = useState<number | string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ category_id: number; name: string }[]>([]);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [deleteImageFlag, setDeleteImageFlag] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Загрузка данных викторины
  useEffect(() => {
    if (!quizId) {
      setError('ID викторины не указан');
      setLoading(false);
      return;
    }

    const loadQuiz = async () => {
      try {
        const data = await getQuizById(quizId);
        setTitle(data.title || '');
        setDescription(data.description || '');
        setCategoryId(data.category_id ? Number(data.category_id) : '');
        if (data.image_url) {
          setCurrentImageUrl(`http://localhost:5000${data.image_url}`);
        }

        const loadedQuestions = (data.questions || []).map(q => ({
          question_id: q.question_id,
          text: q.text,
          media_url: typeof q.media_url === 'string' && q.media_url ? q.media_url : null,
          delete_media: false,
          answers: (q.answers || []).map(a => ({
            answer_id: a.answer_id,
            text: a.text,
            is_correct: Boolean(a.is_correct),
            media_url: typeof a.media_url === 'string' && a.media_url ? a.media_url : null,
            delete_media: false,
            question_id: q.question_id,
          })),
          quiz_id: quizId,
        }));

        setQuestions(loadedQuestions);
      } catch (e: any) {
        console.error("Ошибка загрузки викторины:", e.message);
        setError("Не удалось загрузить данные викторины");
      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
  }, [quizId]);

  // Загрузка категорий
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getAllCategories();
        if (response && Array.isArray(response.categories)) {
          setCategories(response.categories);
        } else {
          throw new Error("Неверный формат данных");
        }
      } catch (err: any) {
        console.error("Ошибка при загрузке категорий:", err.message);
        setError("Не удалось загрузить список категорий");
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    return () => {
      if (currentImageUrl && currentImageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(currentImageUrl);
      }
    };
  }, [currentImageUrl]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    setDeleteImageFlag(false);
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setCurrentImageUrl(previewUrl);
    } else {
      setCurrentImageUrl(null);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setCurrentImageUrl(null);
    setDeleteImageFlag(true);
  };

  const renderMediaPreview = (
    fileOrUrl: File | string | null | undefined,
    onRemove?: () => void
  ) => {
    if (!fileOrUrl) return null;
    let mediaElement = null;
    if (typeof fileOrUrl === 'string') {
      const url = fileOrUrl.startsWith('http')
        ? fileOrUrl
        : `http://localhost:5000${fileOrUrl.startsWith('/') ? '' : '/'}${fileOrUrl}`;
      const lowerCaseUrl = url.toLowerCase();
      if (/\.(jpe?g|png|gif)$/i.test(lowerCaseUrl)) {
        mediaElement = <img src={url} alt="Медиа" style={{ maxWidth: "100%", maxHeight: "200px", objectFit: "contain" }} />;
      } else if (/\.(mp4|webm|ogg)$/i.test(lowerCaseUrl)) {
        mediaElement = <video src={url} controls style={{ maxWidth: "100%", maxHeight: "200px" }}></video>;
      } else if (/\.(mp3|wav|ogg)$/i.test(lowerCaseUrl)) {
        mediaElement = <audio src={url} controls style={{ width: "100%" }}></audio>;
      }
    } else {
      const url = URL.createObjectURL(fileOrUrl);
      const type = fileOrUrl.type;
      if (type.startsWith('image')) {
        mediaElement = <img src={url} alt="Предпросмотр" style={{ maxWidth: "100%", maxHeight: "200px", objectFit: "contain" }} />;
      } else if (type.startsWith('video')) {
        mediaElement = <video src={url} controls style={{ maxWidth: "100%", maxHeight: "200px" }}></video>;
      } else if (type.startsWith('audio')) {
        mediaElement = <audio src={url} controls style={{ width: "100%" }}></audio>;
      }
    }

    return (
      <div style={{ position: "relative", marginTop: "10px" }}>
        {mediaElement}
        {onRemove && (
          <button
            onClick={(e) => {
              e.preventDefault();
              onRemove();
            }}
            style={{
              position: "absolute",
              top: "5px",
              right: "5px",
              backgroundColor: "red",
              color: "white",
              border: "none",
              borderRadius: "50%",
              width: "24px",
              height: "24px",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            &times;
          </button>
        )}
      </div>
    );
  };

  const addQuestion = () => {
    const newQuestionId = -Date.now();
    const newQuestion: Question = {
      question_id: newQuestionId,
      text: '',
      media_url: null,
      delete_media: false,
      answers: [
        {
          answer_id: Date.now(),
          text: '',
          is_correct: false,
          media_url: null,
          delete_media: false,
          question_id: newQuestionId,
        },
        {
          answer_id: Date.now() + 1,
          text: '',
          is_correct: false,
          media_url: null,
          delete_media: false,
          question_id: newQuestionId,
        },
      ],
      quiz_id: quizId || 0,
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (questionId: number) => {
    setQuestions(
      questions.map(q =>
        q.question_id === questionId ? { ...q, deleted: true } : q
      )
    );
  };

  const updateQuestionText = (questionId: number, newText: string) => {
    setQuestions(
      questions.map(q =>
        q.question_id === questionId ? { ...q, text: newText } : q
      )
    );
  };

  const updateQuestionMedia = (questionId: number, file: File) => {
    setQuestions(
      questions.map(q =>
        q.question_id === questionId ? { ...q, media_url: file, delete_media: false } : q
      )
    );
  };

  const removeQuestionMedia = (questionId: number) => {
    setQuestions(
      questions.map(q =>
        q.question_id === questionId ? { ...q, media_url: null, delete_media: true } : q
      )
    );
  };

  const updateAnswerText = (questionId: number, answerId: number, newText: string) => {
    setQuestions(
      questions.map(q =>
        q.question_id === questionId
          ? {
              ...q,
              answers: q.answers.map(a =>
                a.answer_id === answerId ? { ...a, text: newText } : a
              ),
            }
          : q
      )
    );
  };

  const updateAnswerMedia = (questionId: number, answerId: number, file: File) => {
    setQuestions(
      questions.map(q =>
        q.question_id === questionId
          ? {
              ...q,
              answers: q.answers.map(a =>
                a.answer_id === answerId ? { ...a, media_url: file, delete_media: false } : a
              ),
            }
          : q
      )
    );
  };

  const removeAnswerMedia = (questionId: number, answerId: number) => {
    setQuestions(
      questions.map(q =>
        q.question_id === questionId
          ? {
              ...q,
              answers: q.answers.map(a =>
                a.answer_id === answerId ? { ...a, media_url: null, delete_media: true } : a
              ),
            }
          : q
      )
    );
  };

  const updateAnswerCorrectness = (questionId: number, answerId: number, isCorrect: boolean) => {
    setQuestions(
      questions.map(q =>
        q.question_id === questionId
          ? {
              ...q,
              answers: q.answers.map(a =>
                a.answer_id === answerId ? { ...a, is_correct: isCorrect } : a
              ),
            }
          : q
      )
    );
  };

  const addOption = (questionId: number) => {
    const question = questions.find(q => q.question_id === questionId);
    if (!question || question.answers.length >= 5) {
      alert("Максимум 5 вариантов на один вопрос");
      return;
    }
    const newAnswer: Answer = {
      answer_id: Date.now(),
      text: '',
      is_correct: false,
      media_url: null,
      question_id: questionId,
    };
    setQuestions(
      questions.map(q =>
        q.question_id === questionId ? { ...q, answers: [...q.answers, newAnswer] } : q
      )
    );
  };

  const removeOption = (questionId: number, answerId: number) => {
    setQuestions(
      questions.map(q =>
        q.question_id === questionId
          ? {
              ...q,
              answers: q.answers.filter(a => a.answer_id !== answerId)
            }
          : q
      )
    );
  };

  const saveQuiz = async () => {
    if (!categoryId) {
      alert("Выберите категорию");
      return;
    }

    const categoryIdNumber = Number(categoryId);
    if (isNaN(categoryIdNumber)) {
      alert("Неверный формат категории");
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmSave = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    setError(null);

    try {
      const existingQuestionIds = questions.filter(q => !q.deleted).map(q => q.question_id);
      const allSavedQuestionIds = questions.filter(q => q.question_id > 0).map(q => q.question_id);
      const deletedQuestionIds = allSavedQuestionIds.filter(id => !existingQuestionIds.includes(id));
      const filteredQuestions = questions.filter(q => !q.deleted);

      await updateQuiz(
        quizId!,
        title,
        description,
        Number(categoryId),
        filteredQuestions,
        imageFile ?? undefined,
        deleteImageFlag,
        deletedQuestionIds
      );

      setSuccessMessage("Викторина успешно обновлена!");
      setTimeout(() => {
        navigate(USER_ROUTE);
      }, 1);
    } catch (err: any) {
      console.error("Ошибка при обновлении:", err.message);
      setErrorMessage(err.response?.data?.message || "Не удалось обновить викторину");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSave = () => {
    setShowConfirmModal(false);
  };

  const createUploadButton = (onClickHandler: () => void) => (
    <div style={{ textAlign: 'center' }}>
      <p style={{ marginBottom: '5px', fontSize: '0.9rem', color: '#666' }}/>
      <button
        onClick={onClickHandler}
        style={{
          background: '#9c27b0',
          color: 'white',
          border: 'none',
          padding: '0.3rem 0.6rem',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '0.85rem', 
          width: '130px', 
          height: '30px',  
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        Загрузить медиа
      </button>
    </div>
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <ClipLoader color="#bf85cc" size={50} />
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: "600px",
      margin: "0 auto",
      padding: "20px",
      fontFamily: "Arial, sans-serif",
      border: "1px solid #ddd",
      borderRadius: "8px",
      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    }}>
      <h2 style={{ textAlign: "center", marginBottom: "1rem" }}>Редактирование викторины</h2>
      {error && <div style={{ color: "red", marginBottom: "1rem" }}>{error}</div>}
      <div style={{ marginBottom: "1rem" }}>
        <label>Название</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Введите название викторины"
          style={{
            width: "100%",
            padding: "0.5rem",
            fontSize: "1rem",
            borderRadius: "4px",
            border: "1px solid #ccc",
          }}
        />
      </div>
      <div style={{ marginBottom: "1rem" }}>
        <label>Описание</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Введите описание викторины"
          style={{
            width: "100%",
            padding: "0.5rem",
            fontSize: "1rem",
            borderRadius: "4px",
            border: "1px solid #ccc",
          }}
        />
      </div>
      <div style={{ marginBottom: "1rem" }}>
        <label>Категория</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(Number(e.target.value))}
          style={{
            width: "100%",
            padding: "0.5rem",
            fontSize: "1rem",
            borderRadius: "4px",
            border: "1px solid #ccc",
          }}
        >
          <option value="">Выберите категорию</option>
          {categories.map((cat) => (
            <option key={cat.category_id} value={cat.category_id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label>Загрузите изображение</label>
        {createUploadButton(() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.onchange = (event) => {
            handleImageChange(event as unknown as React.ChangeEvent<HTMLInputElement>);
          };
          input.click();
        })}
        {currentImageUrl && (
          <div style={{ marginTop: "10px", position: "relative" }}>
            <img
              src={currentImageUrl}
              alt="Предпросмотр"
              style={{ maxWidth: "100%", maxHeight: "200px", objectFit: "contain" }}
            />
            <button
              onClick={removeImage}
              style={{
                position: "absolute",
                top: "5px",
                right: "5px",
                backgroundColor: "red",
                color: "white",
                border: "none",
                borderRadius: "50%",
                width: "24px",
                height: "24px",
                cursor: "pointer",
                fontSize: "16px",
              }}
            >
              &times;
            </button>
          </div>
        )}
      </div>

      <div style={{ marginTop: "2rem" }}>
        <h3>Вопросы</h3>
        {questions
          .filter(q => !q.deleted)
          .map((question) => (
            <div key={question.question_id} style={{
              marginBottom: "1rem",
              border: "1px solid #ccc",
              padding: "1rem",
              borderRadius: "8px"
            }}>
              <div style={{ marginBottom: "0.5rem" }}>
                <label>Текст вопроса</label>
                <input
                  type="text"
                  value={question.text}
                  onChange={(e) => updateQuestionText(question.question_id, e.target.value)}
                  placeholder="Введите текст вопроса"
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    fontSize: "1rem",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                  }}
                />
              </div>
              <div style={{ marginBottom: "0.5rem" }}>
                <label>Добавить медиа к вопросу</label>
                {createUploadButton(() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*, video/*, audio/*';
                  input.onchange = (e) => {
                    const target = e.target as HTMLInputElement;
                    const file = target.files?.[0];
                    if (file) updateQuestionMedia(question.question_id, file);
                  };
                  input.click();
                })}
                {renderMediaPreview(
                  question.media_url,
                  () => removeQuestionMedia(question.question_id)
                )}
              </div>
              {question.answers.map((answer) => (
                <div key={answer.answer_id} style={{
                  border: "1px solid #eee",
                  padding: "0.5rem",
                  marginBottom: "0.5rem"
                }}>
                  <div style={{ marginBottom: "0.5rem" }}>
                    <label>Текст ответа</label>
                    <input
                      type="text"
                      value={answer.text}
                      onChange={(e) => updateAnswerText(question.question_id, answer.answer_id, e.target.value)}
                      placeholder="Введите текст ответа"
                      style={{
                        width: "100%",
                        padding: "0.5rem",
                        fontSize: "1rem",
                        borderRadius: "4px",
                        border: "1px solid #ccc",
                      }}
                    />
                  </div>
                  <div style={{ marginBottom: "0.5rem" }}>
                    <label>
                      <input
                        type="checkbox"
                        checked={Boolean(answer.is_correct)}
                        onChange={(e) => updateAnswerCorrectness(question.question_id, answer.answer_id, e.target.checked)}
                      />{" "}
                      Правильный ответ
                    </label>
                  </div>
                  <div style={{ marginBottom: "0.5rem" }}>
                    <label>Добавить медиа к ответу</label>
                    {createUploadButton(() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*, video/*, audio/*';
                      input.onchange = (e) => {
                        const target = e.target as HTMLInputElement;
                        const file = target.files?.[0];
                        if (file) updateAnswerMedia(question.question_id, answer.answer_id, file);
                      };
                      input.click();
                    })}
                    {renderMediaPreview(
                      answer.media_url,
                      () => removeAnswerMedia(question.question_id, answer.answer_id)
                    )}
                  </div>
                  <button
                    onClick={() => removeOption(question.question_id, answer.answer_id)}
                    style={{
                      backgroundColor: "#dc3545",
                      color: "white",
                      border: "none",
                      padding: "0.3rem 0.6rem",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    Удалить вариант
                  </button>
                </div>
              ))}
              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button
                  onClick={() => addOption(question.question_id)}
                  disabled={question.answers.length >= 5}
                  style={{
                    backgroundColor: "#28a745",
                    color: "white",
                    border: "none",
                    padding: "0.5rem 1rem",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Добавить вариант
                </button>
                <button
                  onClick={() => removeQuestion(question.question_id)}
                  style={{
                    backgroundColor: "#dc3545",
                    color: "white",
                    border: "none",
                    padding: "0.5rem 1rem",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Удалить вопрос
                </button>
              </div>
            </div>
          ))}
        <button
          onClick={addQuestion}
          disabled={questions.length >= 10}
          style={{
            marginTop: "1rem",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            padding: "0.5rem 1rem",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Добавить вопрос
        </button>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "2rem" }}>
        <button
          onClick={saveQuiz}
          disabled={loading}
          style={{
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            padding: "0.5rem 1rem",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "1rem",
          }}
        >
          {loading ? "Сохранение..." : "Обновить викторину"}
        </button>
      </div>

      {successMessage && <SuccessMessage message={successMessage} onClose={() => setSuccessMessage(null)} />}
      {errorMessage && <ErrorMessage message={errorMessage} onClose={() => setErrorMessage(null)} />}
      <ConfirmModal
        show={showConfirmModal}
        title="Подтвердите сохранение"
        message="Вы уверены, что хотите сохранить изменения?"
        onConfirm={handleConfirmSave}
        onCancel={handleCancelSave}
      />
    </div>
  );
});

export default QuizEdit;