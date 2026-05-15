import { Toaster, toast } from 'react-hot-toast';

const toastStyles = {
  success: {
    style: {
      background: '#059669',
      color: '#fff',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#059669',
    },
  },
  error: {
    style: {
      background: '#DC2626',
      color: '#fff',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#DC2626',
    },
  },
  warning: {
    style: {
      background: '#D97706',
      color: '#fff',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#D97706',
    },
  },
};

const showToast = {
  success: (message) => toast.success(message, toastStyles.success),
  error: (message) => toast.error(message, toastStyles.error),
  warning: (message) => toast.warning(message, toastStyles.warning),
};

const ToastProvider = () => {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      containerClassName="mt-16"
      toastOptions={{
        duration: 4000,
        style: {
          fontSize: '14px',
          padding: '12px 16px',
        },
      }}
    />
  );
};

export { ToastProvider, showToast, toastStyles };
export default ToastProvider;