import { motion } from 'framer-motion';

const Card = ({ task }) => {
  const priorityClasses = {
    High: 'bg-red-200',
    Medium: 'bg-yellow-200',
    Low: 'bg-green-200',
  };

  return (
    <motion.div
      className={`bg-white p-4 rounded-lg shadow-md mb-4 ${priorityClasses[task.priority]}`}
      draggable
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <h3 className="font-bold">{task.title}</h3>
      <p>{task.description}</p>
      <div className="text-sm font-semibold mt-2">Priority: {task.priority}</div>
    </motion.div>
  );
};

export default Card;
