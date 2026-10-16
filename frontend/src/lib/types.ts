export interface Doctor {
  id?: string;
  _id?: string;
  fullName: string;
  name?: string;
  email: string;
  specialization: string;
  status: 'active' | 'deactive';
  createdAt: string;
}

export interface Patient {
  id?: string;
  _id?: string;
  fullName: string;
  name?: string;
  email: string;
  age: number;
  gender: string;
  doctorId?: string;
  medicalHistory: string;
}

export interface MRIRecord {
  id?: string;
  _id?: string;
  patientId: string;
  fileName?: string;
  filename?: string;
  filePath?: string;
  filepath?: string;
  mriId?: string;
  status: 'Pending' | 'Completed' | 'Error';
  prediction?: 'NonDemented' | 'VeryMildDemented' | 'MildDemented' | 'ModerateDemented';
  confidence?: number;
  result?: string;
  createdAt: string;
}

export interface GameAssignment {
  id?: string;
  _id?: string;
  patientId: string;
  gameName: string;
  name?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  status: 'Assigned' | 'Completed';
  dueDate?: string;
  assignedAt?: string;
  completedAt?: string;
  createdAt?: string;
}

export interface GameResult {
  id?: string;
  _id?: string;
  gameId?: string;
  patientId?: string;
  gameName: string;
  score: number;
  accuracy: number;
  timeTakenSeconds?: number;
  timeTaken?: number;
  completedAt?: string;
  completionDate?: string;
}

export interface Appointment {
  id?: string;
  _id?: string;
  patientId: string | Patient | any;
  doctorId: string;
  date: string;
  timeSlot: string;
  reason: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  createdAt: string;
}

export interface TimelineEvent {
  id?: string;
  _id?: string;
  patientId: string;
  title: string;
  description: string;
  date: string;
  createdAt?: string;
}
