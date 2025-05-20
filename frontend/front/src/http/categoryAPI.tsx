import { $host, $authHost } from "http/index"; 
import { Quiz } from "store/QuizStore";

export interface Category {
  category_id: number; 
  name: string;
  description?: string;
  imageUrl: string;
}

interface GetAllCategoriesResponse {
  categories: Category[];
}


export const getAllCategories = async (): Promise<GetAllCategoriesResponse> => {
    try {
      const response = await $host.get("api/category");
      console.log("Данные категорий с сервера:", response.data);
  
      const categories = response.data.categories.map((category: any) => ({
        category_id: category.id || category.category_id, 
        name: category.name,
        description: category.description,
        imageUrl: category.imageUrl,
      }));
  
      console.log("Преобразованные данные категорий:", categories); 
      return { categories };
    } catch (error) {
      console.error("Ошибка при получении категорий:", error);
      throw error;
    }
  };
  
export const createCategory = async (formData: FormData): Promise<any> => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Токен отсутствует. Пожалуйста, войдите в систему.");
    }

    const response = await $authHost.post("/api/category", formData); 

    return response.data;
  } catch (error) {
    console.error("Ошибка при создании категории:", error);
    throw error;
  }
};

export const updateCategory = async (
  category_id: number,
  name: string,
  description: string,
  image?: File | null
): Promise<any> => {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Токен не найден, пожалуйста, авторизуйтесь");
  }

  try {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);

    if (image) {
      formData.append("image", image);
    }

    const response = await $authHost.put(`/api/category/${category_id}`, formData); 

    return response.data;
  } catch (error: any) {
    console.error("Ошибка при обновлении категории:", error);

    if (error.response) {
      console.error("Ответ от сервера:", error.response.data);
      throw new Error(error.response.data.message || "Неизвестная ошибка сервера");
    } else {
      console.error("Сетевая ошибка или ошибка на стороне клиента");
      throw new Error(error.message || "Неизвестная ошибка");
    }
  }
};

export const deleteCategory = async (category_id: number) => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error('Токен не найден, пожалуйста, авторизуйтесь');
  }
  try {
    const response = await $authHost.delete(`api/category/${category_id}`); 

    return response.data;
  } catch (error: any) {
    throw new Error(`Ошибка при удалении категории: ${error.message}`);
  }
};
  