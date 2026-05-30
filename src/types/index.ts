// ============================================
// TaskGrader — TypeScript Type Definitions
// ============================================

// ━━━━ Enums ━━━━

export type UserRole = 'asprak' | 'praktikan';
export type AttendanceStatus = 'hadir' | 'izin' | 'sakit' | 'alpa';
export type SubmissionStatus = 'draft' | 'ai_reviewed' | 'final' | 'disputed';
export type AIConfidence = 'high' | 'medium' | 'low';
export type IndeksHuruf = 'A' | 'AB' | 'B' | 'BC' | 'C' | 'D' | 'E';
export type DisputeStatus = 'baru' | 'diproses' | 'diterima' | 'ditolak';
export type NotifType = 'nilai_dipublish' | 'keberatan_direspons' | 'deadline' | 'sistem' | 'pesan_baru';
export type MessageSender = 'asprak' | 'praktikan' | 'ai_system';

// ━━━━ Database Models ━━━━

export interface User {
  id: string;
  username: string;
  full_name: string;
  nim: string | null;
  role: UserRole;
  password_changed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Module {
  id: number;
  number: number;
  title: string;
  total_experiments: number;
  created_at: string;
}

export interface Attendance {
  id: string;
  user_id: string;
  module_id: number;
  status: AttendanceStatus;
  point: number;
  updated_by: string | null;
  updated_at: string;
}

export interface Submission {
  id: string;
  user_id: string;
  module_id: number;
  laporan_pdf_path: string | null;
  source_zip_path: string | null;
  java_files_paths: string[];
  modul_acuan_path: string | null;
  submission_delay_days: number;
  ketepatan_poin: number;
  submitted_at: string;
  updated_at: string;
}

export interface Grade {
  id: string;
  user_id: string;
  module_id: number;
  // Komponen 1: Kehadiran & Praktikum (max 30)
  kehadiran_poin: number;
  percobaan_dikerjakan: number;
  percobaan_poin: number;
  komponen1_total: number;
  // Komponen 2: Tugas Akhir (max 30)
  fungsionalitas_poin: number;
  sintaks_poin: number;
  kualitas_poin: number;
  komponen2_total: number;
  // Komponen 3: Buku Laporan (max 40)
  kelengkapan_poin: number;
  kerapihan_poin: number;
  ketepatan_poin: number;
  komponen3_total: number;
  // Final
  nilai_final: number;
  indeks: IndeksHuruf | null;
  // AI
  ai_confidence: AIConfidence | null;
  ai_feedback: AIFeedback | null;
  ai_raw_response: string | null;
  // Status
  status: SubmissionStatus;
  published_at: string | null;
  override_by: string | null;
  override_reason: string | null;
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface AIFeedback {
  penalti: PenaltiItem[];
  kekuatan: string[];
  catatan_overall: string;
}

export interface PenaltiItem {
  komponen: string;
  poin_dikurangi: number;
  penjelasan: string;
  lokasi: string;
}

export interface GradeHistory {
  id: string;
  grade_id: string;
  actor_id: string | null;
  actor_type: string;
  action: string;
  field_changed: string | null;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
}

export interface Dispute {
  id: string;
  user_id: string;
  module_id: number;
  grade_id: string;
  komponen_dipersoalkan: string[];
  alasan: string;
  bukti_paths: string[];
  nilai_diminta: number | null;
  status: DisputeStatus;
  asprak_response: string | null;
  nilai_sebelum: number | null;
  nilai_sesudah: number | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  dispute_id: string | null;
  sender_id: string | null;
  sender_type: MessageSender;
  recipient_id: string | null;
  content: string;
  attachment_paths: string[] | null;
  is_read: boolean;
  praktikan_id: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotifType;
  title: string;
  body: string;
  is_read: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface Setting {
  id: string;
  nama_mata_praktikum: string;
  semester: string;
  program_studi: string;
  bobot_kehadiran: number;
  bobot_tugas_akhir: number;
  bobot_laporan: number;
  updated_at: string;
}

// ━━━━ Extended/Joined Types ━━━━

export interface GradeWithUser extends Grade {
  user: Pick<User, 'id' | 'username' | 'full_name' | 'nim'>;
}

export interface GradeWithModule extends Grade {
  module: Pick<Module, 'number' | 'title'>;
}

export interface AttendanceWithUser extends Attendance {
  user: Pick<User, 'id' | 'username' | 'full_name' | 'nim'>;
}

export interface DisputeWithUser extends Dispute {
  user: Pick<User, 'id' | 'username' | 'full_name' | 'nim'>;
  module: Pick<Module, 'number' | 'title'>;
}

export interface MessageWithSender extends Message {
  sender: Pick<User, 'id' | 'full_name' | 'role'> | null;
}

// ━━━━ API Request/Response Types ━━━━

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface GradeOverrideRequest {
  grade_id: string;
  field: string;
  value: number;
  reason: string;
}

export interface GradePublishRequest {
  grade_ids: string[];
}

export interface AttendanceUpdateRequest {
  user_id: string;
  module_id: number;
  status: AttendanceStatus;
}

export interface DisputeRespondRequest {
  dispute_id: string;
  action: 'terima' | 'tolak';
  asprak_response: string;
  nilai_baru?: number;
}

export interface CreateUserRequest {
  full_name: string;
  nim: string;
  role?: UserRole;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
