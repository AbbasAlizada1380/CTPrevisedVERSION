import React from "react";
import { FaExclamationTriangle, FaCheck, FaTimes } from "react-icons/fa";
import AnimatedModal from "./AnimatedModal";

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "تایید",
  cancelText = "انصراف",
  type = "warning", // 'warning', 'danger', 'info', 'success'
}) => {
  const getTypeStyles = () => {
    switch (type) {
      case "danger":
        return {
          icon: <FaExclamationTriangle className="text-red-600 text-4xl" />,
          confirmButton: "bg-red-600 hover:bg-red-700",
          iconBg: "bg-red-100",
        };
      case "success":
        return {
          icon: <FaCheck className="text-green-600 text-4xl" />,
          confirmButton: "bg-green-600 hover:bg-green-700",
          iconBg: "bg-green-100",
        };
      case "info":
        return {
          icon: <FaExclamationTriangle className="text-blue-600 text-4xl" />,
          confirmButton: "bg-blue-600 hover:bg-blue-700",
          iconBg: "bg-blue-100",
        };
      default:
        return {
          icon: <FaExclamationTriangle className="text-yellow-600 text-4xl" />,
          confirmButton: "bg-yellow-600 hover:bg-yellow-700",
          iconBg: "bg-yellow-100",
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <AnimatedModal isOpen={isOpen} onClose={onClose}>
      <div className="bg-white rounded-lg p-6 max-w-md mx-auto" dir="rtl">
        <div className="text-center">
          <div
            className={`${styles.iconBg} w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4`}
          >
            {styles.icon}
          </div>

          <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-500 mb-6">{message}</p>

          <div className="flex gap-3">
            <button
              onClick={onConfirm}
              className={`flex-1 ${styles.confirmButton} text-white py-2 px-4 rounded-md transition`}
            >
              {confirmText}
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md transition"
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </AnimatedModal>
  );
};

export default ConfirmationModal;
