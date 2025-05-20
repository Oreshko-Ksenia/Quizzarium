import { $authHost } from '../http/index';
import { Question } from '../store/QuestionStore';


export const getQuestionsByQuizId = async (quiz_id: number): Promise<Question[]> => {
  try {
    const response = await $authHost.get<Question[]>(`/api/quiz/${quiz_id}/questions`);
    return response.data;
  } catch (error: any) {
    console.error("Ошибка при получении вопросов:", error.response?.data || error.message);
    throw new Error(`Не удалось получить вопросы викторины ${quiz_id}`);
  }
};

export const addQuestion = async (
  quizId: number,
  text: string,
  media?: File
): Promise<Question> => {
  const formData = new FormData();
  formData.append("text", text);
  if (media) {
    formData.append("media", media);
  }

  try {
    const response = await $authHost.post(`/api/quiz/${quizId}/question`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    const data = response.data;

    return {
      question_id: data.question_id || data.id,
      text: data.text,
      media_url: data.media_url || undefined,
      answers: [],
      quiz_id: quizId,
    };
  } catch (error: any) {
    console.error("Ошибка при добавлении вопроса:", error.response?.data || error.message);
    throw new Error(`Не удалось создать вопрос: ${error.response?.data?.message || error.message}`);
  }
};

export const updateQuestion = async (
  quiz_id: number,
  question_id: number,
  text: string,
  media?: File
): Promise<Question> => {
  const formData = new FormData();
  formData.append('text', text);
  if (media) formData.append('media', media);

  try {
    const response = await $authHost.put<Question>(
      `/api/quiz/${quiz_id}/question/${question_id}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error("Ошибка при обновлении вопроса:", error.response?.data || error.message);
    throw new Error(`Не удалось обновить вопрос: ${error.response?.data.message || error.message}`);
  }
};

export const deleteQuestion = async (quiz_id: number, question_id: number): Promise<void> => {
  try {
    await $authHost.delete(`/api/quiz/${quiz_id}/question/${question_id}`);
  } catch (error: any) {
    console.error("Ошибка при удалении вопроса:", error.response?.data || error.message);
    throw new Error(`Не удалось удалить вопрос с ID ${question_id}: ${error.message}`);
  }
};