import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { QUIZCATALOG_ROUTE, USER_ROUTE } from '@utils/consts';
import { $authHost } from 'http/index';
import { getAllCategories, Category } from 'http/categoryAPI';
import { Question } from '../store/QuestionStore';
import { Button } from 'react-bootstrap';
import { ErrorMessage } from 'UI/ErrorMessage';
import { SuccessMessage } from 'UI/SuccessMessage';
import { ConfirmModal } from 'UI/ConfirmModal';

const FileUploadButton = ({
  onChange,
  currentFile,
  onRemove,
}: {
  onChange: (file: File) => void;
  currentFile: File | string | null | undefined;
  onRemove: () => void;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const getMediaType = (fileOrUrl: File | string | null | undefined): 'image' | 'video' | 'audio' | 'unknown' => {
    if (!fileOrUrl) return 'unknown';
    let url = '';
    if (typeof fileOrUrl === 'string') {
      url = fileOrUrl;
    } else {
      url = URL.createObjectURL(fileOrUrl);
    }
    if (/\.jpe?g|\.png|\.gif$/i.test(url)) return 'image';
    if (/\.mp4|\.webm|\.ogg$/i.test(url)) return 'video';
    if (/\.mp3|\.wav|\.ogg$/i.test(url)) return 'audio';
    return 'unknown';
  };

  const renderPreview = () => {
    if (!currentFile) return null;
    const mediaType = getMediaType(currentFile);
    if (mediaType === 'image') {
      const src = typeof currentFile === 'string' ? currentFile : URL.createObjectURL(currentFile);
      return <img src={src} alt="Предпросмотр" style={{ maxWidth: "100%", maxHeight: "150px", objectFit: "contain" }} />;
    }
    if (mediaType === 'video') {
      const src = typeof currentFile === 'string' ? currentFile : URL.createObjectURL(currentFile);
      return <video src={src} controls style={{ maxWidth: "100%", maxHeight: "150px" }}></video>;
    }
    if (mediaType === 'audio') {
      const src = typeof currentFile === 'string' ? currentFile : URL.createObjectURL(currentFile);
      return <audio src={src} controls style={{ width: "100%" }}></audio>;
    }
    return <p>Неподдерживаемый тип файла</p>;
  };

  return (
    <div style={{ position: "relative" }}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onChange(file);
        }}
        style={{ display: "none" }}
      />
      {renderPreview() && <div style={{ marginBottom: "10px" }}>{renderPreview()}</div>}
      <Button
        variant="outline-primary"
        size="sm"
        onClick={handleButtonClick}
        style={{
          padding: "6px 12px",
          fontSize: "14px",
          borderRadius: "6px",
          backgroundColor: "#9455ab",
          color: "white",
          border: "none",
          transition: "background-color 0.3s ease",
          marginBottom: "10px",
        }}
        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#7f3d8a")}
        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#9455ab")}
      >
        Загрузить медиа
      </Button>
      {currentFile && (
        <button
          onClick={onRemove}
          style={{
            position: "absolute",
            top: "0",
            right: "0",
            backgroundColor: "red",
            color: "white",
            border: "none",
            borderRadius: "50%",
            width: "24px",
            height: "24px",
            cursor: "pointer",
            fontSize: "16px",
            zIndex: 10,
          }}
        >
          &times;
        </button>
      )}
    </div>
  );
};

const QuizCreate = () => {
  const navigate = useNavigate();

  // Состояния формы
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [categoryId, setCategoryId] = useState<number | string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false); // Модалка
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const searchParams = new URLSearchParams(window.location.search);
  const ownerIdParam = searchParams.get("user_id");
  const ownerId = ownerIdParam ? parseInt(ownerIdParam) : undefined;

  let tempIdCounter = -1;

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

  // Проверка изменений для предупреждения о выходе
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = 'Вы уверены, что хотите покинуть страницу? Несохраненные данные будут потеряны.';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    if (title || description || categoryId || questions.length > 0 || imageFile) {
      setIsDirty(true);
    }
  }, [title, description, categoryId, questions, imageFile]);

  // Функции управления вопросами и ответами...
  const addQuestion = () => {
    const newQuestionId = tempIdCounter--;
    setQuestions([
      ...questions,
      {
        question_id: newQuestionId,
        text: '',
        media_url: undefined,
        answers: [
          {
            answer_id: tempIdCounter--,
            text: '',
            is_correct: false,
            media_url: undefined,
            question_id: newQuestionId,
          },
          {
            answer_id: tempIdCounter--,
            text: '',
            is_correct: false,
            media_url: undefined,
            question_id: newQuestionId,
          },
        ],
        quiz_id: 0,
      },
    ]);
  };

  const removeQuestion = (questionId: number) => {
    setQuestions(questions.filter(q => q.question_id !== questionId));
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
        q.question_id === questionId ? { ...q, media_url: file } : q
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
                a.answer_id === answerId ? { ...a, media_url: file } : a
              ),
            }
          : q
      )
    );
  };

  const updateAnswerCorrectness = (
    questionId: number,
    answerId: number,
    isCorrect: boolean
  ) => {
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
    if (!question) return;
    if ((question.answers?.length ?? 0) >= 5) {
      alert("Максимум 5 вариантов на один вопрос");
      return;
    }
    const newAnswerId = tempIdCounter--;
    const newAnswer = {
      answer_id: newAnswerId,
      text: '',
      is_correct: false,
      media_url: undefined,
      question_id: questionId,
    };
    setQuestions(
      questions.map(q =>
        q.question_id === questionId
          ? { ...q, answers: [...(q.answers || []), newAnswer] } : q
      )
    );
  };

  const removeOption = (questionId: number, answerId: number) => {
    setQuestions(
      questions.map(q =>
        q.question_id === questionId
          ? {
              ...q,
              answers: q.answers.filter(a => a.answer_id !== answerId),
            }
          : q
      )
    );
  };

  const handleImageChange = (file: File) => {
    setImageFile(file);
  };

  const handleImageRemove = () => {
    setImageFile(null);
  };

  const renderMediaPreview = (fileOrUrl: File | string | null | undefined) => {
    if (!fileOrUrl) return null;
    if (typeof fileOrUrl === 'string') {
      if (/\.jpe?g|\.png|\.gif$/i.test(fileOrUrl)) {
        return <img src={fileOrUrl} alt="Медиа" style={{ maxWidth: "100%", maxHeight: "200px", objectFit: "contain" }} />;
      } else if (/\.mp4|\.webm|\.ogg$/i.test(fileOrUrl)) {
        return <video src={fileOrUrl} controls style={{ maxWidth: "100%", maxHeight: "200px" }}></video>;
      } else if (/\.mp3|\.wav|\.ogg$/i.test(fileOrUrl)) {
        return <audio src={fileOrUrl} controls style={{ width: "100%" }}></audio>;
      }
      return <p>Неподдерживаемый тип файла</p>;
    }

    const url = URL.createObjectURL(fileOrUrl);
    const type = fileOrUrl.type;
    if (type.startsWith('image')) {
      return <img src={url} alt="Предпросмотр" style={{ maxWidth: "100%", maxHeight: "200px", objectFit: "contain" }} />;
    } else if (type.startsWith('video')) {
      return <video src={url} controls style={{ maxWidth: "100%", maxHeight: "200px" }}></video>;
    } else if (type.startsWith('audio')) {
      return <audio src={url} controls style={{ width: "100%" }}></audio>;
    }
    return null;
  };

  const saveQuiz = async () => {
    if (!categoryId) {
      setError("Выберите категорию");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('category_id', String(categoryId));
    if (ownerId !== undefined) {
      formData.append('owner_id', String(ownerId));
    }
    if (imageFile) {
      formData.append('image', imageFile);
    }

    const plainQuestions = questions.map(q => ({
      text: q.text,
      answers: q.answers.map(a => ({
        text: a.text,
        is_correct: a.is_correct,
      })),
    }));
    formData.append('questions', JSON.stringify(plainQuestions));

    questions.forEach((question, index) => {
      if (question.media_url instanceof File) {
        formData.append(`question_media_${index}`, question.media_url);
      }
      question.answers.forEach((answer, aid) => {
        if (answer.media_url instanceof File) {
          formData.append(`answer_media_${index}_${aid}`, answer.media_url);
        }
      });
    });

    try {
      const response = await $authHost.post('/api/quiz/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSuccess("Викторина успешно создана!");
      setTimeout(() => navigate(USER_ROUTE), 1);
    } catch (err: any) {
      console.error("Ошибка при сохранении викторины:", err.message);
      setError(err.response?.data?.message || "Не удалось создать викторину");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSave = () => {
    setShowConfirmModal(false);
    saveQuiz();
  };

  const handleCancelSave = () => {
    setShowConfirmModal(false);
  };

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
      <h2 style={{ textAlign: "center", marginBottom: "1rem" }}>Создание новой викторины</h2>

      {error && <ErrorMessage message={error} onClose={() => setError(null)} />}
      {success && <SuccessMessage message={success} onClose={() => setSuccess(null)} />}
      <ConfirmModal
        show={showConfirmModal}
        title="Подтвердите создание"
        message="Вы уверены, что хотите создать эту викторину?"
        onConfirm={handleConfirmSave}
        onCancel={handleCancelSave}
      />

      {/* --- Форма --- */}
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
        <FileUploadButton
          onChange={handleImageChange}
          currentFile={imageFile}
          onRemove={handleImageRemove}
        />
        {imageFile && renderMediaPreview(imageFile)}
      </div>

      <div style={{ marginTop: "2rem" }}>
        <h3>Вопросы</h3>
        {questions.map((question) => (
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

            <div style={{ marginTop: "10px" }}>
              <label>Добавить медиа к вопросу</label>
              <FileUploadButton
                onChange={(file) => updateQuestionMedia(question.question_id, file)}
                currentFile={question.media_url}
                onRemove={() => updateQuestionMedia(question.question_id, new File([], ""))}
              />
              {renderMediaPreview(question.media_url)}
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
                      checked={answer.is_correct}
                      onChange={(e) => updateAnswerCorrectness(question.question_id, answer.answer_id, e.target.checked)}
                    />{" "}
                    Правильный ответ
                  </label>
                </div>

                <div style={{ marginTop: "10px" }}>
                  <label>Добавить медиа к ответу</label>
                  <FileUploadButton
                    onChange={(file) => updateAnswerMedia(question.question_id, answer.answer_id, file)}
                    currentFile={answer.media_url}
                    onRemove={() => updateAnswerMedia(question.question_id, answer.answer_id, new File([], ""))}
                  />
                  {renderMediaPreview(answer.media_url)}
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

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem" }}>
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
          onClick={() => setShowConfirmModal(true)} // <-- Открываем модалку перед созданием
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
          {loading ? "Сохранение..." : "Создать викторину"}
        </button>
      </div>
    </div>
  );
};

export default QuizCreate;