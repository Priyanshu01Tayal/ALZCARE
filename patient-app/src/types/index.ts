export interface Doctor {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  specialization?: string;
  isActive?: boolean;
}

export interface Patient {
  _id: string;
  name: string;
  email: string;
  age: number;
  gender: string;
  patientId: string;
  phone?: string;
  address?: string;
  stage?: string;
  emergencyContact?: {
    name?: string;
    phone?: string;
    relation?: string;
  };
  medicalHistory?: string;
  doctorId: string | Doctor;
  createdAt?: string;
}

export interface GameCatalogItem {
  id: string;
  gameName: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  icon?: string;
  description: string;
  instructions: string;
  scoringRules: string;
}

export interface PatientGameItem extends GameCatalogItem {
  isAssigned: boolean;
  assignmentId?: string | null;
  assignmentStatus?: 'Assigned' | 'Completed' | 'None';
  assignedDifficulty?: 'Easy' | 'Medium' | 'Hard';
  dueDate?: string | null;
  frequency?: string;
  attempts: number;
  lastScore: number;
  bestScore: number;
  averageScore: number;
  lastPlayed?: string | null;
}

export interface GameAssignment {
  _id: string;
  patientId: string;
  doctorId: string;
  gameName: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  status: 'Assigned' | 'Completed';
  dueDate?: string;
  frequency?: string;
  repetitions?: number;
  startDate?: string;
  notes?: string;
  assignedAt?: string;
  completedAt?: string;
  createdAt?: string;
}

export interface GameResult {
  _id: string;
  assignmentId?: string;
  patientId: string;
  gameName: string;
  difficulty?: string;
  score: number;
  accuracy: number;
  timeTaken: number;
  moves?: number;
  completionDate?: string;
  createdAt?: string;
}

export interface Appointment {
  _id: string;
  patientId: string | Patient;
  doctorId: string | Doctor;
  date: string;
  timeSlot: string;
  status: 'Scheduled' | 'Confirmed' | 'Completed' | 'Cancelled' | 'Pending';
  reason?: string;
  createdAt?: string;
}

export interface NotificationItem {
  _id: string;
  userId?: string;
  userType?: 'Doctor' | 'Patient';
  title?: string;
  message: string;
  isRead?: boolean;
  read?: boolean;
  createdAt: string;
}

export interface GameProgressSummary {
  patient: {
    _id: string;
    name: string;
    patientId: string;
  };
  summary: {
    totalAssignments: number;
    completedAssignments: number;
    totalPlayed: number;
    bestScore: number;
    averageScore: number;
    averageAccuracy: number;
    averageTime: number;
    completionRate: number;
  };
  gameWise: Array<{
    gameName: string;
    category: string;
    difficulty: string;
    isAssigned: boolean;
    completedCount: number;
    attempts: number;
    bestScore: number;
    averageScore: number;
    averageAccuracy: number;
    lastScore: number;
    lastPlayed: string | null;
  }>;
  recentResults: GameResult[];
  assignments: GameAssignment[];
}

// Navigation Param Lists
export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Main: undefined;
  GamePlay: {
    gameName: string;
    difficulty?: 'Easy' | 'Medium' | 'Hard';
    assignmentId?: string;
  };
  DoctorInfo: undefined;
  Notifications: undefined;
};

export type TabParamList = {
  DashboardTab: undefined;
  GamesTab: undefined;
  ProgressTab: undefined;
  AppointmentsTab: undefined;
  ProfileTab: undefined;
};

