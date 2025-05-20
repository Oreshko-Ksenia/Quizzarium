import { $authHost } from "../http/index";
import { Answer } from "../store/AnswerStore";

export const getAnswersByQuestionId = async (questionId: number): Promise<Answer[]> => {
  try {
    const response = await $authHost.get<Answer[]>(
      `/api/question/${questionId}/answers`
    );
    return response.data;
  } catch (error) {
    console.error("Ошибка при получении ответов:", error);
    throw new Error(`Не удалось получить ответы для вопроса ${questionId}`);
  }
};

export const addAnswer = async (
  quiz_id: number,
  question_id: number,
  text: string,
  isCorrect: boolean,
  media?: File
): Promise<Answer> => {
  const formData = new FormData();
  formData.append("text", text);
  formData.append("is_correct", String(isCorrect));
  if (media) {
    formData.append("media", media);
  }

  const response = await $authHost.post(`/api/quiz/${quiz_id}/question/${question_id}/answer`, formData);

  const data = response.data;

  return {
    answer_id: data.answer_id || data.id,
    text: data.text,
    is_correct: data.is_correct,
    media_url: data.media_url || undefined,
    question_id,
  };
};


export const updateAnswer = async (
  answerId: number,
  text: string,
  isCorrect: boolean,
  media?: File
): Promise<Answer> => {
  const formData = new FormData();
  formData.append("text", text);
  formData.append("is_correct", String(isCorrect));
  if (media) {
    formData.append("media", media);
  }

  const response = await $authHost.put<Answer>(
    `/api/answer/${answerId}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};


export const deleteAnswer = async (answerId: number): Promise<void> => {
  try {
    await $authHost.delete(`/api/answer/${answerId}`);
  } catch (error) {
    console.error("Ошибка при удалении ответа:", error);
    throw new Error(`Не удалось удалить ответ с ID ${answerId}`);
  }
};