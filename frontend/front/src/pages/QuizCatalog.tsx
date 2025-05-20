import React, { useState, useEffect } from "react";
import {
  Col,
  Container,
  Row,
  Button,
  Form,
  Modal,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import {
  getAllCategories,
  createCategory,
  deleteCategory,
  updateCategory,
  Category,
} from "../http/categoryAPI";
import { QUIZZES_ROUTE } from "../utils/consts";
import quizStore from "../store/QuizStore";
import { ClipLoader } from "react-spinners";
import { FiPlus, FiEdit, FiTrash2 } from "react-icons/fi";
import { ErrorMessage } from '../UI/ErrorMessage';
import { SuccessMessage } from '../UI/SuccessMessage';

export default observer(function QuizCatalog() {
  const navigate = useNavigate();
  const isAuth = Boolean(localStorage.getItem("token"));
  const isAdmin = localStorage.getItem("role") === "ADMIN";

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Состояния для модальных окон
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [newCategoryImage, setNewCategoryImage] = useState<File | null>(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editCategoryId, setEditCategoryId] = useState<number | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editCategoryDescription, setEditCategoryDescription] = useState("");
  const [editCategoryImage, setEditCategoryImage] = useState<File | null>(null);

  // Состояния для уведомлений
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getAllCategories();
        const categories = response.categories.map((category: any) => ({
          category_id: category.category_id,
          name: category.name,
          description: category.description,
          imageUrl: category.imageUrl,
        }));
        setCategories(categories);
      } catch (error) {
        console.error("Ошибка при загрузке категорий:", error);
        setErrorMessage("Не удалось загрузить категории");
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <ClipLoader color="#bf85cc" size={50} />
      </div>
    );
  }

  const handleCategoryClick = (categoryId: number) => {
    quizStore.setSelectedCategoryId(categoryId);
    navigate(QUIZZES_ROUTE);
  };

  const handleOpenEditModal = (category: Category) => {
    if (!category || !category.category_id) {
      console.error("Некорректная категория:", category);
      return;
    }
    setEditCategoryId(category.category_id);
    setEditCategoryName(category.name);
    setEditCategoryDescription(category.description || "");
    setEditCategoryImage(null);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditCategoryId(null);
    setEditCategoryName("");
    setEditCategoryDescription("");
    setEditCategoryImage(null);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setNewCategoryName("");
    setNewCategoryDescription("");
    setNewCategoryImage(null);
  };

  const handleCreateCategory = async () => {
    try {
      if (!newCategoryName.trim()) {
        throw new Error("Название категории не может быть пустым");
      }

      const formData = new FormData();
      formData.append("name", newCategoryName);
      formData.append("description", newCategoryDescription || "");
      if (newCategoryImage) {
        formData.append("image", newCategoryImage);
      }

      const createdCategory = await createCategory(formData);

      setCategories([
        ...categories,
        {
          category_id: createdCategory.id,
          name: createdCategory.name,
          description: createdCategory.description,
          imageUrl: createdCategory.imageUrl,
        },
      ]);

      setSuccessMessage("Категория успешно создана!");
      setTimeout(() => {
        handleCloseCreateModal();
      }, 1500);

    } catch (error: any) {
      console.error("Ошибка при создании категории:", error);
      setErrorMessage(
        error.message ||
        "Не удалось создать категорию. Проверьте данные и попробуйте снова."
      );
    }
  };

  const handleEditCategory = async () => {
    try {
      if (!editCategoryName.trim()) {
        throw new Error("Название категории не может быть пустым");
      }

      if (editCategoryId === null) {
        throw new Error("ID категории не определён");
      }

      const updatedCategory = await updateCategory(
        editCategoryId,
        editCategoryName.trim(),
        editCategoryDescription.trim(),
        editCategoryImage
      );

      setCategories((prev) =>
        prev.map((cat) =>
          cat.category_id === editCategoryId
            ? {
                ...cat,
                name: editCategoryName,
                description: editCategoryDescription,
                imageUrl: updatedCategory.imageUrl || cat.imageUrl,
              }
            : cat
        )
      );

      setSuccessMessage("Категория успешно обновлена!");
      setTimeout(() => {
        handleCloseEditModal();
      }, 1500);

    } catch (error: any) {
      console.error("Ошибка при редактировании категории:", error);
      setErrorMessage(
        error.message ||
        "Не удалось обновить категорию. Попробуйте ещё раз."
      );
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    try {
      await deleteCategory(categoryId);
      const response = await getAllCategories();
      setCategories(response.categories);
      setSuccessMessage("Категория успешно удалена!");
    } catch (error: any) {
      console.error("Ошибка при удалении категории:", error);
      setErrorMessage(
        error.message ||
        "Не удалось удалить категорию. Попробуйте ещё раз."
      );
    }
  };

  return (
    <Container className="mt-5" style={{ paddingBottom: "60px" }}>
      
      {/* Сообщения */}
      {errorMessage && (
        <ErrorMessage message={errorMessage} onClose={() => setErrorMessage(null)} />
      )}
      {successMessage && (
        <SuccessMessage message={successMessage} onClose={() => setSuccessMessage(null)} />
      )}

      <h1 className="text-center mb-4 text-black fw-bold">Категории викторин</h1>

      {isAdmin && (
        <div className="d-flex justify-content-end mb-3">
          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
            style={{
              border: "none",
              transition: "background-color 0.3s ease",
              fontSize: "1rem",
              padding: "0.5rem 1rem",
            }}
          >
            <FiPlus /> Создать категорию
          </Button>
        </div>
      )}

      <Row xs={1} md={2} lg={3} className="g-4">
        {categories.map((category) => (
          <Col key={category.category_id}>
            <div
              className="card h-100 position-relative"
              style={{
                backgroundImage: `url(http://localhost:5000${category.imageUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                borderRadius: "10px",
                overflow: "hidden",
                cursor: "pointer",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
              }}
              onMouseEnter={(e) => {
                const actions = e.currentTarget.querySelector(".category-actions");
                if (actions instanceof HTMLElement) {
                  actions.classList.remove("d-none");
                }
              }}
              onMouseLeave={(e) => {
                const actions = e.currentTarget.querySelector(".category-actions");
                if (actions instanceof HTMLElement) {
                  actions.classList.add("d-none");
                }
              }}
            >
              {isAdmin && (
                <div
                  className="category-actions position-absolute top-0 end-0 m-2 d-none"
                  style={{
                    flexDirection: "column",
                    gap: "5px",
                    zIndex: 1,
                  }}
                >
                  <Button
                    variant="warning"
                    size="sm"
                    onClick={() => handleOpenEditModal(category)}
                    style={{
                      padding: "0.5rem 0.75rem",
                      fontSize: "0.9rem",
                      border: "none",
                      marginRight: "3px",
                      backgroundColor: "#F1C40F",
                      transition: "background-color 0.3s ease",
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.backgroundColor = "#F39C12")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.backgroundColor = "#F1C40F")
                    }
                  >
                    <FiEdit />
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteCategory(category.category_id)}
                    style={{
                      padding: "0.5rem 0.75rem",
                      fontSize: "0.9rem",
                      border: "none",
                      backgroundColor: "#E74C3C",
                      transition: "background-color 0.3s ease",
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.backgroundColor = "#C0392B")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.backgroundColor = "#E74C3C")
                    }
                  >
                    <FiTrash2 />
                  </Button>
                </div>
              )}
              <div
                className="card-body d-flex flex-column justify-content-end"
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.6)",
                  color: "white",
                  padding: "1rem",
                  minHeight: "200px",
                }}
                onClick={() => handleCategoryClick(category.category_id)}
              >
                <h5 className="card-title">{category.name}</h5>
                <p className="card-text">{category.description}</p>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      {/* Модальное окно создания */}
      <Modal show={showCreateModal} onHide={handleCloseCreateModal}>
        <Modal.Header closeButton>
          <Modal.Title>Создать новую категорию</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Название категории</Form.Label>
              <Form.Control
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Описание категории</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={newCategoryDescription}
                onChange={(e) => setNewCategoryDescription(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Изображение</Form.Label>
              <Form.Control
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = (e.target as HTMLInputElement).files?.[0] || null;
                  setNewCategoryImage(file);
                }}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseCreateModal}>
            Закрыть
          </Button>
          <Button variant="primary" onClick={handleCreateCategory}>
            Создать
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Модальное окно редактирования */}
      <Modal show={showEditModal} onHide={handleCloseEditModal}>
        <Modal.Header closeButton>
          <Modal.Title>Редактировать категорию</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Название категории</Form.Label>
              <Form.Control
                type="text"
                value={editCategoryName}
                onChange={(e) => setEditCategoryName(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Описание категории</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={editCategoryDescription}
                onChange={(e) => setEditCategoryDescription(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Новое изображение (необязательно)</Form.Label>
              <Form.Control
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = (e.target as HTMLInputElement).files?.[0] || null;
                  setEditCategoryImage(file);
                }}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseEditModal}>
            Закрыть
          </Button>
          <Button variant="primary" onClick={handleEditCategory}>
            Сохранить
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
});