import axios from 'axios';

// Replace 192.168.x.x with YOUR machine's IP from Step 17
const BASE_URL = 'http://192.168.1.8:8000';

const api = axios.create({ baseURL: BASE_URL, timeout: 45000 });

export const applyScenario = (userId: string, scenario: string) =>
  api.post('/api/plan/apply-scenario', { user_id: userId, scenario });

export const setupGoal = (data: any) =>
  api.post('/api/goal/setup', data);

export const getPlan = (userId: string) =>
  api.get(`/api/plan/${userId}`);

export const reportMissedTasks = (userId: string, taskIds: string[]) =>
  api.post('/api/plan/missed-tasks', {
    user_id: userId,
    missed_task_ids: taskIds,
    date: new Date().toISOString().split('T')[0]
  });

export const simulate = (userId: string, scenario: string) =>
  api.post('/api/plan/simulate', { user_id: userId, scenario });

export const checkin = (userId: string, status: string, completedIds: string[]) =>
  api.post('/api/progress/checkin', {
    user_id: userId,
    status,
    completed_task_ids: completedIds
  });