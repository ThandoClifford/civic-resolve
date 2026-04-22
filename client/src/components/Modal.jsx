import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl'
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className={`relative bg-white rounded-xl shadow-2xl w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <h2 className="text-xl font-bold text-slate-800">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export const LoadingSpinner = ({ size = 'md', text = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center py-8 gap-3">
    <div className={`spinner w-${size} h-${size}`}></div>
    {text && <p className="text-slate-500 text-sm">{text}</p>}
  </div>
);

export const ErrorMessage = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-8 gap-3">
    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
      <span className="text-2xl">⚠️</span>
    </div>
    <p className="text-red-600 font-medium">Something went wrong</p>
    <p className="text-slate-500 text-sm">{message}</p>
    {onRetry && (
      <button onClick={onRetry} className="btn btn-secondary mt-2">
        Try Again
      </button>
    )}
  </div>
);

export const EmptyState = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="text-6xl mb-4">{icon || '📭'}</div>
    <h3 className="text-lg font-semibold text-slate-800 mb-2">{title}</h3>
    {description && <p className="text-slate-500 mb-4 max-w-sm">{description}</p>}
    {action && <div>{action}</div>}
  </div>
);

export const SuccessMessage = ({ message, onClose }) => (
  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-3">
    <span className="text-xl">✅</span>
    <span className="flex-1">{message}</span>
    {onClose && (
      <button onClick={onClose} className="text-green-600 hover:text-green-800">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    )}
  </div>
);

export const ConfirmDialog = ({ isOpen, title, message, confirmText, onConfirm, onCancel, loading }) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
        <p className="text-slate-600 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button 
            onClick={onCancel} 
            className="btn btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;