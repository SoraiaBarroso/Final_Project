export function useCohorts() {
    const cohorts = ref<any[]>([])
    const loading = ref(false)
    const error = ref<string | null>(null)

    async function fetchCohorts(filters?: { program_id?: string }) {
        loading.value = true
        error.value = null
        try {
            const response = await $fetch('/api/cohorts')
            let fetchedCohorts = response?.data || []
            console.log('Fetched cohorts:', fetchedCohorts)

            // Apply filters if provided
            if (filters?.program_id) {
                fetchedCohorts = fetchedCohorts.filter((cohort: any) => {
                    // Check if any program in the programs array matches the filter
                    return cohort.programs?.some((program: any) => program.id === filters.program_id)
                })
                console.log('Filtered cohorts by program_id:', filters.program_id, fetchedCohorts)
            }

            cohorts.value = fetchedCohorts
        } catch (err: any) {
            error.value = err?.message || 'Failed to fetch cohorts'
            console.error('Error fetching cohorts:', err)
        } finally {
            loading.value = false
        }
    }

    async function createCohort(cohortData: {
        name: string;
        meeting_id?: string;
        is_active?: boolean;
        programs: Array<{ program_id: string; start_date: string; end_date: string }>
    }) {
        loading.value = true
        error.value = null
        console.log('Creating cohort with data:', cohortData)
        try {
            const response = await $fetch('/api/cohorts/create', {
                method: 'POST',
                body: cohortData
            })
            // Refresh the cohorts list after creation
            await fetchCohorts()
            return response
        } catch (err: any) {
            error.value = err?.data?.statusMessage || err?.message || 'Failed to create cohort'
            console.error('Error creating cohort:', err)
            throw err
        } finally {
            loading.value = false
        }
    }

    async function toggleCohortStatus(cohortName: string, isActive: boolean) {
        loading.value = true
        error.value = null
        try {
            const response = await $fetch('/api/cohorts/update-status', {
                method: 'POST',
                body: {
                    cohort_name: cohortName,
                    is_active: isActive
                }
            })
            // Refresh the cohorts list after update
            await fetchCohorts()
            return response
        } catch (err: any) {
            error.value = err?.data?.statusMessage || err?.message || 'Failed to update cohort status'
            console.error('Error updating cohort status:', err)
            throw err
        } finally {
            loading.value = false
        }
    }

    return {
        cohorts,
        loading,
        error,
        fetchCohorts,
        createCohort,
        toggleCohortStatus
    }
}
