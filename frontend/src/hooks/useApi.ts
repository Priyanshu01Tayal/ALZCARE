import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/lib/stores/auth';
import { useToastStore } from '@/lib/stores/toast';
import { Patient, Doctor, MRIRecord, GameAssignment, GameResult, Appointment, TimelineEvent } from '@/lib/types';

// Auth Hooks
export function useLoginMutation() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const addToast = useToastStore((state) => state.addToast);
  return useMutation({
    mutationFn: async (credentials: any) => {
      const res = await apiClient.post('/api/auth/login', credentials);
      return res.data;
    },
    onSuccess: (data) => {
      setAuth(data, data.token);
      addToast('Welcome to AlzCare', `${data.role} authenticated successfully.`, 'success');
    },
  });
}

export function useRegisterDoctorMutation() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const addToast = useToastStore((state) => state.addToast);
  return useMutation({
    mutationFn: async (doctorData: any) => {
      const res = await apiClient.post('/api/auth/register/doctor', doctorData);
      return res.data;
    },
    onSuccess: (data) => {
      setAuth(data, data.token);
      addToast('Account Registered', 'Doctor signed up successfully.', 'success');
    },
  });
}

// Patients Hooks
export function usePatientsQuery() {
  return useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const res = await apiClient.get<Patient[]>('/api/patients');
      return res.data;
    },
  });
}

export function usePatientQuery(id: string) {
  return useQuery({
    queryKey: ['patient', id],
    queryFn: async () => {
      const res = await apiClient.get<any>(`/api/patients/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useAddPatientMutation() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);
  return useMutation({
    mutationFn: async (patientData: any) => {
      const res = await apiClient.post('/api/patients', patientData);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      addToast('Patient Registered', 'Patient profile successfully created.', 'success');
    },
  });
}

// MRI Hooks
export function useUploadMriMutation() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await apiClient.post('/api/mri/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient'] });
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      addToast('Upload Complete', 'MRI Brain Scan successfully uploaded.', 'success');
    },
  });
}

export function useAnalyzeMriMutation() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);
  return useMutation({
    mutationFn: async (data: { patientId: string }) => {
      const res = await apiClient.post('/api/mri/analyze', data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['patient'] });
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      if (data.status === 'error') {
        addToast('Analysis Failed', data.message || 'Error executing AI model analysis.', 'error');
      } else {
        addToast('Analysis Succeeded', `AI model completed with result: ${data.prediction}`, 'success');
      }
    },
  });
}

// Prescriptions Hooks
export function useCreatePrescriptionMutation() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);
  return useMutation({
    mutationFn: async (rxData: any) => {
      const res = await apiClient.post('/api/prescriptions', rxData);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['patient', variables.patientId] });
      queryClient.invalidateQueries({ queryKey: ['timeline', variables.patientId] });
      addToast('Prescription Logged', 'Clinical prescription authorized successfully.', 'success');
    },
  });
}

// Games Hooks
export function useGamesQuery(patientId?: string) {
  return useQuery({
    queryKey: ['games', patientId],
    queryFn: async () => {
      const res = await apiClient.get<GameAssignment[]>(`/api/games/patient/${patientId}`);
      return res.data;
    },
    enabled: !!patientId,
  });
}

export function useAssignGameMutation() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post('/api/games/assign', data);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['patient', variables.patientId] });
      queryClient.invalidateQueries({ queryKey: ['timeline', variables.patientId] });
      addToast('Game Dispatched', 'Cognitive support exercise task assigned successfully.', 'success');
    },
  });
}

export function useSubmitGameResultMutation() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post('/api/games/result', data);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['games', variables.patientId] });
      queryClient.invalidateQueries({ queryKey: ['gameResults', variables.patientId] });
      queryClient.invalidateQueries({ queryKey: ['timeline', variables.patientId] });
      addToast('Result Recorded', 'Cognitive matching score logged to dashboard.', 'success');
    },
  });
}

export function useGameResultsQuery(patientId?: string) {
  return useQuery({
    queryKey: ['gameResults', patientId],
    queryFn: async () => {
      const res = await apiClient.get<GameResult[]>(`/api/games/results/${patientId}`);
      return res.data;
    },
    enabled: !!patientId,
  });
}

// Appointments Hooks
export function useAppointmentsQuery() {
  return useQuery({
    queryKey: ['appointments'],
    queryFn: async () => {
      const res = await apiClient.get<Appointment[]>('/api/appointments');
      return res.data;
    },
  });
}

export function useBookAppointmentMutation() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post('/api/appointments', data);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['patient', variables.patientId] });
      queryClient.invalidateQueries({ queryKey: ['timeline', variables.patientId] });
      addToast('Booking Confirmed', 'Appointment slot booked successfully.', 'success');
    },
  });
}

export function useUpdateAppointmentStatusMutation() {
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiClient.put(`/api/appointments/${id}/status`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['patient'] });
      addToast('Status Updated', 'Appointment status successfully updated.', 'success');
    },
  });
}

// Timeline Hooks
export function usePatientTimelineQuery(patientId?: string) {
  return useQuery({
    queryKey: ['timeline', patientId],
    queryFn: async () => {
      const res = await apiClient.get<TimelineEvent[]>(`/api/timeline/${patientId}`);
      return res.data;
    },
    enabled: !!patientId,
  });
}
