import { makeAutoObservable } from 'mobx';
import { User } from '../http/userAPI';

export default class UserStore {
  user = {} as User; 
  isAuth = false;

  constructor() {
    makeAutoObservable(this);
  }

  setUser(user: User) {
    this.user = user;
    this.setIsAuth(true);
  }

  setIsAuth(isAuth: boolean) {
    this.isAuth = isAuth;
  }
}