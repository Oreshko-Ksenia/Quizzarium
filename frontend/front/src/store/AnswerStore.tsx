import { makeAutoObservable } from "mobx";

export interface Answer {
    answer_id: number;
    text: string;
    is_correct: boolean;
    media_url?: string | File | null | undefined;
    delete_media?: boolean;
    question_id: number;
  }

class AnswerStore {
  answers: Answer[] = [];

  constructor() {
    makeAutoObservable(this);
  }

  addAnswer(answer: Answer) {
    this.answers.push(answer);
  }

  updateAnswer(id: number, updatedAnswer: Partial<Answer>) {
    this.answers = this.answers.map(a => a.answer_id === id ? { ...a, ...updatedAnswer } : a);
  }

  removeAnswer(id: number) {
    this.answers = this.answers.filter(a => a.answer_id !== id);
  }

  clearAnswers() {
    this.answers = [];
  }
}

export default new AnswerStore();