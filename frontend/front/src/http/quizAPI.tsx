import { $authHost, $host } from "http/index";
import { Quiz } from "store/QuizStore";
import { Question } from "store/QuestionStore";
import { QuizResult } from "pages/Results";


export const createQuiz = async (
  title: string,
  description: string,
  categoryId: number,
  questions: Question[],
  imageFile?: File | null,
  ownerId?: number
): Promise<any> => {
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
    question_id: q.question_id,
    text: q.text,
    media_url: q.media_url instanceof File ? null : q.media_url,
    answers: q.answers.map(a => ({
      answer_id: a.answer_id,
      text: a.text,
      is_correct: a.is_correct,
      media_url: a.media_url instanceof File ? null : a.media_url,
      question_id: a.question_id
    })),
    quiz_id: q.quiz_id
  }));

  formData.append('questions', JSON.stringify(plainQuestions));

  questions.forEach((question) => {
    if (question.media_url instanceof File) {
      formData.append(`question_media_${question.question_id}`, question.media_url);
    }

    question.answers.forEach(answer => {
      if (answer.media_url instanceof File) {
        formData.append(`answer_media_${answer.answer_id}`, answer.media_url);
      }
    });
  });

  const response = await $authHost.post('/api/quiz/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

export const updateQuiz = async (
  quizId: number,
  title: string,
  description: string,
  categoryId: number,
  questions: Question[],
  image?: File | null,
  deleteImage?: boolean,
  deletedQuestionIds: number[] = []
): Promise<any> => {
  const formData = new FormData();

  formData.append('title', title.trim());
  formData.append('description', description.trim());
  formData.append('category_id', String(categoryId));

  console.log("deletedQuestionIds отправляется:", deletedQuestionIds);
  console.log("typeof:", typeof deletedQuestionIds);
  console.log("Array?", Array.isArray(deletedQuestionIds));
  console.log("Длина:", deletedQuestionIds.length);

  formData.append('deleted_questions', JSON.stringify(deletedQuestionIds));
  
  const serializableQuestions = questions.map(q => ({
    text: q.text,
    media_url: typeof q.media_url === 'string' ? q.media_url : null,
    delete_media: Boolean(q.delete_media),
    answers: q.answers.map(a => ({
      answer_id: a.answer_id,
      text: a.text,
      is_correct: Boolean(a.is_correct),
      media_url: typeof a.media_url === 'string' ? a.media_url : null,
      delete_media: Boolean(a.delete_media),
    })),
    question_id: q.question_id,
  }));

  formData.append('questions', JSON.stringify(serializableQuestions));


  questions.forEach((question, qIndex) => {
    if (question.media_url instanceof File) {
      formData.append(`questionMedia[${qIndex}]`, question.media_url);
    }

    question.answers.forEach((answer, aIndex) => {
      if (answer.media_url instanceof File) {
        formData.append(`answerMedia[${qIndex}][${aIndex}]`, answer.media_url);
      }
    });
  });

  if (image instanceof File) {
    formData.append('image', image);
  } else if (deleteImage) {
    formData.append('delete_image', 'true');
  }


  const { data } = await $authHost.put(`/api/quiz/${quizId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return data;
};

export const getAllQuizzes = async (): Promise<Quiz[]> => {
  try {
    const response = await $host.get('/api/quiz/');
    
    if (Array.isArray(response.data)) {
      return response.data;
    }

    return response.data.quizzes || [];
  } catch (error: any) {
    console.error("Ошибка при загрузке викторин:", error.message);
    return [];
  }
};

export const getQuizzesByCategory = async (categoryId: number): Promise<Quiz[]> => {
  try {
    const response = await $host.get<{ quizzes: Quiz[] }>(`/api/category/${categoryId}`);
    return response.data.quizzes || [];
  } catch (error) {
    console.error("Ошибка при получении викторин по категории:", error);
    throw new Error(`Не удалось получить викторины по категории ${categoryId}`);
  }
};

export const getQuizById = async (quizId: number): Promise<Quiz> => {
  try {
    const response = await $authHost.get<Quiz>(`/api/quiz/${quizId}`);
    return response.data;
  } catch (error) {
    console.error("Ошибка при получении викторины:", error);
    throw new Error(`Не удалось загрузить викторину с ID ${quizId}`);
  }
};

export const getQuestionsByQuizId = async (quizId: number): Promise<Question[]> => {
  try {
    const response = await $authHost.get<Question[]>(`/api/quiz/${quizId}/questions`);
    return response.data;
  } catch (error) {
    console.error("Ошибка при получении вопросов:", error);
    throw new Error(`Не удалось получить вопросы викторины ${quizId}`);
  }
};

export const deleteQuiz = async (quizId: number): Promise<void> => {
  try {
    await $authHost.delete(`/api/quiz/${quizId}`);
  } catch (error) {
    console.error("Ошибка при удалении викторины:", error);
    throw new Error(`Не удалось удалить викторину с ID ${quizId}`);
  }
};

export const getCategories = async (): Promise<{ categories: { id: number; name: string }[] }> => {
  try {
    const response = await $host.get("/api/category");
    return response.data;
  } catch (error: any) {
    console.error("Ошибка при загрузке категорий:", error);
    throw error;
  }
};

export const getUserQuizzes = async (userId?: number): Promise<Quiz[]> => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Токен отсутствует");

  try {
      let url = `/api/quiz/user/${userId}`;

      const response = await $authHost.get<Quiz[]>(url, {
          headers: { Authorization: `Bearer ${token}` },
      });

      return response.data;
  } catch (error: any) {
      console.error("Ошибка при загрузке викторин:", error);

      if (error.response?.status === 401) {
          throw new Error("Неавторизован");
      }

      if (error.response?.data?.message) {
          throw new Error(error.response.data.message);
      }

      throw new Error("Ошибка при загрузке викторин");
  }
};


export const getResultsByQuizId = async (quiz_id: number, user_id?: number): Promise<QuizResult> => {
  try {
    const params = user_id ? { params: { user_id } } : {};
    const response = await $authHost.get(`/api/quiz/result/${quiz_id}`, params);
    

    if (!response.data || typeof response.data !== 'object') {
      throw new Error('Некорректный формат данных от сервера');
    }

    return response.data;
  } catch (error: any) {

    if (error.response) {
      console.error("Ответ сервера:", error.response);
    } else if (error.request) {
      console.error("Нет ответа от сервера:", error.request);
    }

    return {
      leaderboard: [],
      title: 'Неизвестная викторина'
    };
  }
};

export const submitQuizResult = async (
  quiz_id: number,
  correctAnswers: number,
  totalQuestions: number
): Promise<void> => {
  console.log("Отправляем результат:", {
    quiz_id,
    correctAnswers,
    totalQuestions
  });

  try {
    await $authHost.post(`/api/quiz/${quiz_id}/submit`, {
      correct_answers: correctAnswers,
      total_questions: totalQuestions
    });
  } catch (error) {
    console.error("Ошибка отправки результата:", error);
    throw error;
  }
};