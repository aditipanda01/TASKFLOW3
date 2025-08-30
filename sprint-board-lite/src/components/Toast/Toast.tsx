'use client';

const Toast = ({ message, onUndo, onDismiss }) => {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-gray-800 text-white py-2 px-4 rounded-md shadow-lg flex items-center">
      <p className="mr-4">{message}</p>
      <button
        onClick={onUndo}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded focus:outline-none focus:shadow-outline"
      >
        Undo
      </button>
      <button onClick={onDismiss} className="ml-2 text-gray-400 hover:text-white">
        &times;
      </button>
    </div>
  );
};

export default Toast;
