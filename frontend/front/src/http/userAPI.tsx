import { $host, $authHost } from 'http/index';
import { jwtDecode } from 'jwt-decode';

export interface DecodedToken {
  user_id: number;
  email: string;
  role: string;
  avatar?: string;
  blocked: boolean;
  iat: number;
  exp: number;
}

export interface User {
    user_id: number; 
    email: string;
    role: string;
    avatar?: string; 
    blocked?: boolean;
  }

 export const login = async (email: string, password: string): Promise<DecodedToken> => {
    const { data } = await $host.post<{ token: string }>('api/user/login', { email, password });
    if (!data.token) {
      throw new Error('Токен отсутствует в ответе сервера');
    }
    localStorage.setItem('token', data.token);
    return jwtDecode<DecodedToken>(data.token);
  };

export const registration = async (email: string, password: string): Promise<DecodedToken> => {
    const { data } = await $host.post<{ token: string }>('api/user/register', { email, password });
    if (!data.token) {
        throw new Error('Токен отсутствует в ответе сервера');
    }
    localStorage.setItem('token', data.token);
    return jwtDecode<DecodedToken>(data.token); 
};

export const check = async (): Promise<DecodedToken> => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Токен отсутствует');

  const { data } = await $authHost.get<{ token: string }>('api/user/auth', {
    headers: { Authorization: `Bearer ${token}` },
  });

  const decodedToken = jwtDecode<DecodedToken>(data.token);

  if (decodedToken.blocked) {
    localStorage.removeItem('token');
    throw new Error('Ваш аккаунт заблокирован');
  }

  localStorage.setItem('token', data.token); 
  return decodedToken;
};

export const changePassword = async (newPassword: string, userId?: number): Promise<void> => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Токен отсутствует");

  let url = "/api/user/change-password";

  if (userId) {
    url += `?id=${userId}`;
  }

  try {
    await $authHost.post(url, { newPassword }, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error: any) {
    throw new Error(error.response?.data?.message || "Не удалось изменить пароль");
  }
};

export const updateAvatar = async (user_id: number, formData: FormData): Promise<User> => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Токен отсутствует');

  const { data } = await $authHost.put<{ user: User }>(
    `api/user/${user_id}/avatar`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return data.user; 
};

export const getAllUsers = async (): Promise<User[]> => {
  try {
    const { data } = await $authHost.get<any>("api/user/users");

    if (Array.isArray(data)) {
      return data;
    }

    if (data && Array.isArray(data.users)) {
      return data.users;
    }

    return []; 
  } catch (e) {
    console.error("Ошибка при получении списка пользователей", e);
    return [];
  }
};

export const blockUser = async (user_id: number, blocked: boolean): Promise<User> => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Токен отсутствует");

  const { data } = await $authHost.put<{ user: User }>(
    `api/user/${user_id}/block`,
    { blocked },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return data.user;
};

export const changeUserRole = async (
  user_id: number,
  role: string
): Promise<User> => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Токен отсутствует");

  const { data } = await $authHost.put<{ user: User}>(
    `api/user/${user_id}/role`,
    { role },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return data.user;
};

export const createUser = async (
  email: string,
  password: string,
  role: string = "CLIENT"
): Promise<User> => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Токен отсутствует");

  const { data } = await $authHost.post<{ user: User }>(
    "api/user/register",
    { email, password, role },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return data.user;
};

export const getUserById = async (user_id: number): Promise<User> => {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Токен отсутствует");

  const { data } = await $authHost.get<{ user: User }>(`api/user/${user_id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return data.user;
};

export const deleteUser = async (user_id: number): Promise<void> => {
  try {
    await $authHost.delete(`/api/user/delete/${user_id}`);
  } catch (error) {
    console.error("Ошибка удаления пользователя:", error);
    throw error;
  }
};