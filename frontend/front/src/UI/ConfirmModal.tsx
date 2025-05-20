import React from 'react';

export const ConfirmModal = ({
  show,
  title,
  message,
  onConfirm,
  onCancel,
}: {
  show: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) => {
  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#fff',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        maxWidth: '400px',
        width: '90%',
        textAlign: 'center'
      }}>
        <h5 style={{ marginBottom: '10px', color: '#333' }}>{title}</h5>
        <p style={{ marginBottom: '20px', color: '#555' }}>{message}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              marginRight: '10px',
              backgroundColor: '#ccc',
              border: 'none',
              padding: '10px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Отмена
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              backgroundColor: '#8E44AD',
              color: 'white',
              border: 'none',
              padding: '10px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'background-color 0.3s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#7f3d8a'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#8E44AD'}
          >
            Подтвердить
          </button>
        </div>
      </div>
    </div>
  );
};