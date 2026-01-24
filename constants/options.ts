export const PROGRAM_OPTIONS = [
  { label: 'Software Engineering', value: 'Software Engineering' },
  { label: 'Data Science', value: 'Data Science' },
  { label: 'AI/ML', value: 'AI/ML' },
] as const

export const STATUS_OPTIONS = ['Active', 'Inactive', 'Frozen', 'Graduated'] as const

export const STUDENT_STATUS = {
  ON_TRACK: 'on_track',
  AT_RISK: 'at_risk',
  MONITOR: 'monitor',
  AHEAD: 'ahead',
} as const

export type StudentStatusType = (typeof STUDENT_STATUS)[keyof typeof STUDENT_STATUS]
export type StatusOptionType = (typeof STATUS_OPTIONS)[number]
