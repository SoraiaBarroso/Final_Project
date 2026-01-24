import type { Program, Cohort } from './program'

export type StudentStatus = 'Active' | 'Inactive' | 'Frozen' | 'Graduated'
export type StudentProgressStatus = 'on_track' | 'at_risk' | 'monitor' | 'ahead'

export interface Student {
  id: string
  name: string
  qwasar_id?: string | null
  email: string
  programme: string
  cohort: string
  status: StudentStatus
  student_status: StudentProgressStatus
  current_season: number
  expected_season: number
  points: number
  program_id?: string
  cohort_id?: string
  created_at?: string
  updated_at?: string
}

export interface ProjectCompletion {
  id: string
  student_id: string
  project_id: string
  project_name?: string
  completed_at?: string
  status: 'completed' | 'in_progress' | 'not_started'
  grade?: number | null
  season_id?: string
}

export interface SeasonProgress {
  id: string
  student_id: string
  season_id: string
  season_name?: string
  season_number?: number
  status: 'completed' | 'in_progress' | 'not_started'
  started_at?: string
  completed_at?: string
  progress_percentage?: number
}

export interface StudentDetails extends Student {
  program?: Program
  cohort_details?: Cohort
  projects?: ProjectCompletion[]
  seasons?: SeasonProgress[]
}

export interface StudentImport {
  name: string
  qwasarId?: string | null
  email: string
  programme: string
  cohort: string
}
