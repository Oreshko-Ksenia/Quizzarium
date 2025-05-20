const fs = require('fs');
const path = require('path');
const { Category } = require('../models/models');
const ApiError = require('../error/ApiError');
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const mime = require('mime-types'); 
const { Quiz } = require('../models/models');


class CategoryController {
  async createCategory(req, res, next) {
    try {
        const { name, description } = req.body;
        const file = req.file;

        if (!name || typeof name !== "string") {
            return next(ApiError.badRequest("Название категории не может быть пустым"));
        }
        if (!description || typeof description !== "string") {
            return next(ApiError.badRequest("Описание категории не может быть пустым"));
        }

        let imageUrl = null;
        if (file) {
          imageUrl = `/uploads/${file.filename}`;
        }

        const existingIds = await Category.findAll({
            attributes: ['category_id'],
            order: [['category_id', 'ASC']]
        }).then(categories => categories.map(cat => cat.category_id));

        let newId = 1;
        while (existingIds.includes(newId)) {
            newId++;
        }

        const category = await Category.create({
            category_id: newId,
            name,
            description,
            imageUrl,
        });

        return res.json({
            id: category.category_id,
            name: category.name,
            description: category.description,
            imageUrl: category.imageUrl,
        });
    } catch (e) {
        console.error(`Ошибка при создании категории: ${e.message}`);
        return next(ApiError.internal("Ошибка при создании категории"));
    }
}

async updateCategory(req, res, next) {
  try {
    const { category_id } = req.params;

    const name = req.body.name;
    const description = req.body.description;
    const file = req.file;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return next(ApiError.badRequest("Название категории не может быть пустым"));
    }
    if (!description || typeof description !== "string") {
      return next(ApiError.badRequest("Описание категории не может быть пустым"));
    }

    const existingCategory = await Category.findByPk(category_id);
    if (!existingCategory) {
      return next(ApiError.notFound("Категория не найдена"));
    }

    let imageUrl = existingCategory.imageUrl;
    if (file) {
      try {
        imageUrl = `/uploads/${file.filename}`;
        if (existingCategory.imageUrl) {
          const oldImagePath = path.join(__dirname, "..", "uploads", existingCategory.imageUrl.split("/").pop());
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }
      } catch (err) {
        return next(ApiError.badRequest("Ошибка при обработке изображения"));
      }
    }

    await existingCategory.update({ name, description, imageUrl });
    return res.json({
      id: existingCategory.id,
      name: existingCategory.name,
      description: existingCategory.description,
      imageUrl: existingCategory.imageUrl,
    });
  } catch (e) {
    console.error(`Ошибка при обновлении категории: ${e.message}`);
    return next(ApiError.internal("Ошибка при обновлении категории"));
  }
}

  async getAllCategory(req, res, next) {
    try {
      const categories = await Category.findAll();
      return res.json({ categories });
    } catch (e) {
      console.error(`Ошибка при получении категорий: ${e.message}`);
      return next(ApiError.internal('Ошибка при получении категорий'));
    }
  }

  async getQuizzesByCategory(req, res, next) {
    try {
      const { category_id } = req.params;
  
      if (!category_id) {
        return next(ApiError.badRequest('ID категории не указан'));
      }
  
      const quizzes = await Quiz.findAll({
        where: { category_id },
        attributes: ['quiz_id', 'title', 'description', 'image_url']
      });
  
      return res.json({ quizzes });
    } catch (e) {
      console.error(`Ошибка при получении категории: ${e.message}`);
      return next(ApiError.internal('Ошибка при получении категории'));
    }
  }

  async renumberCategories() {
    try {
      const categories = await Category.findAll({
        order: [['category_id', 'ASC']]
      });
      console.log("Категории для переупорядочивания:", categories); 
      for (let i = 0; i < categories.length; i++) {
        await categories[i].update({ category_id: i + 1 });
      }
      return { message: 'ID категорий успешно переупорядочены.' }; 
    } catch (e) {
      console.error(`Ошибка при переупорядочивании ID категорий: ${e.message}`);
      throw new Error('Ошибка при переупорядочивании ID категорий.');
    }
  }
  
  async deleteCategory(req, res, next) {
    try {
      const { category_id } = req.params;
      if (!category_id) {
        return next(ApiError.badRequest('ID категории не указан'));
      }
      const category = await Category.findByPk(category_id);
      if (!category) {
        return next(ApiError.notFound('Категория не найдена'));
      }
      if (category.imageUrl) {
        const imagePath = path.join(__dirname, '..', 'uploads', category.imageUrl.split('/').pop());
        try {
          fs.unlinkSync(imagePath);
        } catch (err) {
          console.error('Ошибка при удалении изображения:', err);
        }
      }
      await category.destroy();
  
      await this.renumberCategories(req, res, next); 
  
      return res.json({ message: 'Категория успешно удалена и ID переупорядочены.' });
    } catch (e) {
      console.error(`Ошибка при удалении категории: ${e.message}`);
      return next(ApiError.internal('Ошибка при удалении категории'));
    }
  }
}

module.exports = new CategoryController();