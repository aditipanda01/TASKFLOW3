'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Card from '../Card/Card';

// Mock data
const initialTasks = {
  todo: [
    { id: 1, title: 'Task 1', description: 'This is a task' },
    { id: 2, title: 'Task 2', description: 'This is another task' },
  ],
  inProgress: [{ id: 3, title: 'Task 3', description: 'This is a task in progress' }],
  done: [{ id: 4, title: 'Task 4', description: 'This is a completed task' }],
};

const Board = () => {
  const [tasks, setTasks] = useState(initialTasks);
  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      router.push('/');
    }
  }, [router]);

  return (
    <div className="grid grid-cols-3 gap-4 p-4">
      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="text-lg font-bold mb-4">To Do</h2>
        <div>
          {tasks.todo.map((task) => (
            <Card key={task.id} task={task} />
          ))}
        </div>
      </div>
      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="text-lg font-bold mb-4">In Progress</h2>
        <div>
          {tasks.inProgress.map((task) => (
            <Card key={task.id} task={task} />
          ))}
        </div>
      </div>
      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="text-lg font-bold mb-4">Done</h2>
        <div>
          {tasks.done.map((task) => (
            <Card key={task.id} task={task} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Board;
