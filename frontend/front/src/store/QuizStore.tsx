import { makeAutoObservable } from "mobx";
import { Question } from "store/QuestionStore";

export interface Quiz {
  quiz_id: number; 
  title: string;
  description: string;
  category_id: number;
  user_id: number;
  image_url?: string;
  image_file?: File;
  questions: Question[];
}

class QuizStore {
  private _quizzes: Quiz[] = [];
  private _selectedCategoryId: number | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  get quizzes(): Quiz[] {
    return this._quizzes;
  }

  get selectedCategoryId(): number | null {
    return this._selectedCategoryId;
  }

  setQuizzes(quizzes: Quiz[]): void {
    this._quizzes = quizzes;
  }

  setSelectedCategoryId(category_id: number | null): void {
    this._selectedCategoryId = category_id;
  }
}

export default new QuizStore();