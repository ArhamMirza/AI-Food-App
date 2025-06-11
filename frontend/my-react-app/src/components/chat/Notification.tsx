import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface NotificationProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg border transition-all duration-300 transform translate-x-0
      ${type === 'success' ? 'bg-green-600/20 border-green-600/50 text-green-400' : 'bg-red-600/20 border-red-600/50 text-red-400'}`}>
      <div className="flex items-center gap-2">
        <span>{message}</span>
        <button onClick={onClose} className="p-1 hover:opacity-80">
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default Notification;