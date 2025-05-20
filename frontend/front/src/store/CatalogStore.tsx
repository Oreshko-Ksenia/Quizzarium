import { makeAutoObservable } from "mobx";

export interface Category {
  category_id: number; 
  name: string;
  description?: string;
  imageUrl: string;
}

export default class CatalogStore {
  private _categories: Category[] = [];

  constructor() {
    makeAutoObservable(this);
  }

  get categories(): Category[] {
    return this._categories;
  }

  setCategories(categories: Category[]): void {
    this._categories = categories;
  }
}