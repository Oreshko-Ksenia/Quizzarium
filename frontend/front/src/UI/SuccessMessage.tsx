import React, { useEffect } from 'react';

interface SuccessMessageProps {
  message: string;
  onClose: () => void;
}

export const SuccessMessage = ({ message, onClose }: SuccessMessageProps) => {
  const [timeLeft, setTimeLeft] = React.useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 700);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) {
      onClose();
    }
  }, [timeLeft, onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        backgroundColor: '#d4edda',
        color: '#155724',
        border: '1px solid #c3e6cb',
        borderRadius: '4px',
        padding: '15px 20px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        maxWidth: '300px',
        animation: 'slideInRight 0.3s ease-out',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
      }}
    >
      {message}
      
      <div
        style={{
          marginLeft: '10px',
          fontSize: '0.9em',
          color: '#15572488',
        }}
      >
      </div>
    </div>
  );
};