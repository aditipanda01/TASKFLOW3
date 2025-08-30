import { motion } from 'framer-motion';

const Card = ({ task }) => {
  return (
    <motion.div
      className="bg-white p-4 rounded-lg shadow-md mb-4"
      draggable
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <h3 className="font-bold">{task.title}</h3>
      <p>{task.description}</p>
    </motion.div>
  );
};

export default Card;
