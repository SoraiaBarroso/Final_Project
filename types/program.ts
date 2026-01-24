export interface Program {
  id: string
  name: string
  description?: string
  created_at?: string
}

export interface Cohort {
  id: string
  name: string
  meeting_id?: string
  is_active: boolean
  programs?: Program[]
  created_at?: string
}

export interface Season {
  id: string
  name: string
  season_number?: number
  program_id?: string
  created_at?: string
}

export interface Project {
  id: string
  name: string
  program_id?: string
  season_id?: string
  order?: number
  created_at?: string
}

export interface ProgramCohortSeason {
  id: string
  program_id: string
  cohort_id: string
  season_id: string
  start_date: string
  end_date: string
  seasons?: Season
}

export interface DropdownOption {
  label: string
  value: string
}
