import { makeAutoObservable } from "mobx";
import { Answer } from "./AnswerStore";

export interface Question {
  question_id: number;
  text: string;
  media_url?:  string | File | null | undefined;
  delete_media?: boolean;
  quiz_id: number | null; 
  answers: Answer[];
  deleted?: boolean; 
}

class QuestionStore {
  questions: Question[] = [];

  constructor() {
    makeAutoObservable(this);
  }

  addQuestion(question: Question) {
    this.questions.push(question);
  }

  updateQuestion(id: number, updatedQuestion: Partial<Question>) {
    this.questions = this.questions.map(q => q.question_id === id ? { ...q, ...updatedQuestion } : q);
  }

  removeQuestion(id: number) {
    this.questions = this.questions.filter(q => q.question_id !== id);
  }

  clearQuestions() {
    this.questions = [];
  }
}

export default new QuestionStore();