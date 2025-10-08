import { useState, useEffect } from 'react';

/**
 * Custom hook to load Twilight Imperium game data
 * @returns {Object} { data, loading, error }
 */
export const useGameData = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/data/ti_data.json');

        if (!response.ok) {
          throw new Error(`Failed to load data: ${response.statusText}`);
        }

        const jsonData = await response.json();
        setData(jsonData);
        setError(null);
      } catch (err) {
        console.error('Error loading game data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
};
