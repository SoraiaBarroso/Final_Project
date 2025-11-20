export function useStudents() {
  const supabase = useSupabaseClient()
  const students = ref<any[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Fetch all students from the database
   */
  async function fetchStudents() {
    loading.value = true
    error.value = null
    try {
      const { data, error: fetchError } = await supabase
        .from('students')
        .select('*')
        .order('name', { ascending: true })

      if (fetchError) throw fetchError

      students.value = data || []
      return data
    } catch (err: any) {
      error.value = err?.message || 'Failed to fetch students'
      console.error('Error fetching students:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Import students from CSV data
   */
  async function importStudents(studentsData: any[]) {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch('/api/students/import', {
        method: 'POST',
        body: { students: studentsData }
      })
      return response
    } catch (err: any) {
      error.value = err?.message || 'Failed to import students'
      console.error('Error importing students:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Parse CSV file content
   */
  function parseCSV(text: string) {
    const lines = text.split('\n').filter(line => line.trim())
    const headers = lines[0].split(',').map(h => h.trim())

    const parsedStudents = []
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      parsedStudents.push({
        name: values[0] || '',
        qwasarId: values[1] || null,
        email: values[2] || '',
        programme: values[3] || '',
        cohort: values[4] || ''
      })
    }

    return parsedStudents
  }

  /**
   * Get a single student by ID
   */
  function getStudentById(id: string) {
    return students.value.find(s => s.id === id)
  }

  /**
   * Get students by cohort
   */
  function getStudentsByCohort(cohortName: string) {
    return students.value.filter(s => s.cohort === cohortName)
  }

  return {
    students,
    loading,
    error,
    fetchStudents,
    importStudents,
    parseCSV,
    getStudentById,
    getStudentsByCohort
  }
}
