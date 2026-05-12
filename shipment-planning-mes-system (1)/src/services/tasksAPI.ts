import { apiClient } from './apiClient';
import type { Task } from '../types';

export interface UpdateTaskRequest {
  assigned_person_id?: string;
  assigned_person_ids?: string[];
  duration_minutes?: number;
}

function normalizeTask(task: any): Task {
  const assignedPersonIds =
    task.assigned_person_ids ??
    task.assignedPersonIds ??
    (task.assigned_person_id ? [task.assigned_person_id] : undefined) ??
    (task.assignedPersonId ? [task.assignedPersonId] : undefined) ?? [];

  const assignedPersonId =
    task.assigned_person_id ??
    task.assignedPersonId ??
    assignedPersonIds?.[0] ?? null;

  return {
    ...task,
    assigned_person_ids: assignedPersonIds,
    assigned_person_id: assignedPersonId,
    duration_minutes: task.duration_minutes ?? task.durationMinutes,
    planned_start: task.planned_start ?? task.plannedStart,
    planned_end: task.planned_end ?? task.plannedEnd,
    actual_start: task.actual_start ?? task.actualStart,
    actual_end: task.actual_end ?? task.actualEnd,
    shipment_id: task.shipment_id ?? task.shipmentId,
    shipment_no: task.shipment_no ?? task.shipmentNo,
  } as Task;
}

export const tasksAPI = {
  getByShipment: async (shipmentId: string): Promise<Task[]> => {
    const response = await apiClient.get<Task[]>(`/shipment-plans/${shipmentId}/tasks`);
    return response.data.map(normalizeTask);
  },

  updateTask: async (shipmentId: string, taskId: string, data: UpdateTaskRequest): Promise<Task> => {
    const response = await apiClient.patch<Task>(`/shipment-plans/${shipmentId}/tasks/${taskId}`, data);
    return normalizeTask(response.data);
  },
};
