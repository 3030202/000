import { useState, useEffect } from 'react';

export interface SystemClockData {
  timeUtc: string;
  timeLocal: string;
}

export const useSystemClock = (): SystemClockData => {
  const [timeUtc, setTimeUtc] = useState<string>('');
  const [timeLocal, setTimeLocal] = useState<string>('');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTimeUtc(now.toISOString().substring(11, 19) + 'Z');
      setTimeLocal(now.toLocaleTimeString());
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  return { timeUtc, timeLocal };
};
