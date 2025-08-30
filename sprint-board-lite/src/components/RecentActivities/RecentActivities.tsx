'use client';

import { useState, useEffect } from 'react';

const RecentActivities = () => {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch('http://localhost:3001/activities');
        const data = await response.json();
        setActivities(data.slice(0, 5)); // Show the 5 most recent activities
      } catch (error) {
        console.error('Error fetching activities:', error);
      }
    };

    fetchActivities();

    // Set up polling to refresh activities every 5 seconds
    const interval = setInterval(fetchActivities, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gray-100 p-4 rounded-lg mt-4">
      <h2 className="text-lg font-bold mb-4">Recent Activities</h2>
      <ul>
        {activities.map((activity, index) => (
          <li key={index} className="mb-2 text-sm text-gray-700">
            {activity.description}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RecentActivities;
