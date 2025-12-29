<template>
  <div class="mt-6 w-full lg:max-w-xl mx-auto !gap-0">

    <div class="flex justify-between">
      <div>
        <h1 class="text-highlighted font-medium text-left w-full">Assign Projects to Cohort Season</h1>
        <p class="text-muted text-[15px] text-pretty mt-1">Assign projects start and end date by program cohort season.</p>
      </div>
    </div>

    <UCard
      variant="subtle"
      class="mt-4 flex justify-center"
      :ui="{
        body: '!py-4 w-full !px-8'
      }"
    >
      <div class="space-y-6">
        <UFormField label="Program(s)" name="program" required>
          <USelect
            multiple
            v-model="selectedProgram"
            :items="programOptions"
            placeholder="Select one or more programs"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Cohort(s)" name="cohort" required>
          <USelect
            multiple
            v-model="selectedCohort"
            :items="cohortOptions"
            placeholder="Select one or more cohorts"
            :disabled="!selectedProgram || selectedProgram.length === 0 || cohortOptions.length === 0"
            class="w-full"
          />
          <template #hint v-if="selectedProgram && selectedProgram.length > 0 && cohortOptions.length === 0">
            <span class="text-sm text-gray-500">No cohorts available for selected program(s)</span>
          </template>
        </UFormField>

        <UFormField label="Program Cohort Season(s)" name="pcs" required>
          <USelect
            multiple
            v-model="selectedPCS"
            :items="pcsOptions"
            placeholder="Select one or more cohort seasons"
            :disabled="!selectedCohort || selectedCohort.length === 0 || pcsOptions.length === 0"
            class="w-full"
          />
          <template #hint v-if="selectedCohort && selectedCohort.length > 0 && pcsOptions.length === 0">
            <span class="text-sm text-gray-500">No cohort seasons available for selected cohort(s)</span>
          </template>
        </UFormField>

        <UFormField label="Project(s)" name="project" required>
          <USelect
            multiple
            v-model="selectedProject"
            :items="projectOptions"
            placeholder="Select one or more projects"
            class="w-full"
          />
        </UFormField>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UFormField label="Start Date" name="startDate">
            <UInput
              v-model="startDate"
              type="date"
              class="w-full"
            />
          </UFormField>

          <UFormField label="End Date" name="endDate">
            <UInput
              v-model="endDate"
              type="date"
              class="w-full"
            />
          </UFormField>
        </div>

        <div class="flex gap-3">
          <UButton
            color="primary"
            variant="soft"
            :loading="loading"
            :disabled="loading"
            @click="addPCSProject"
          >
            Add Assignment
          </UButton>

          <UButton
            color="neutral"
            variant="outline"
            @click="clearForm"
            :disabled="loading"
          >
            Reset
          </UButton>
        </div>

        <div v-if="message" :class="messageClass">{{ message }}</div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { CACHE_KEYS } from '~/composables/useCacheInvalidation';

const supabase = useSupabaseClient();
const nuxtApp = useNuxtApp();

const loading = ref(false);
const message = ref('');
const messageClass = ref('text-sm text-green-600');

const cohorts = ref<any[]>([]);
const programs = ref<any[]>([]);
const pcsList = ref<any[]>([]);
const projects = ref<any[]>([]);

// allow selecting multiple cohorts
const selectedCohort = ref<string[]>([]);
// allow selecting multiple programs
const selectedProgram = ref<string[]>([]);
// allow selecting multiple PCS entries (one per program/cohort pair)
const selectedPCS = ref<string[]>([]);
// allow multiple selected projects
const selectedProject = ref<string[]>([]);
const startDate = ref<string | undefined>(undefined);
const endDate = ref<string | undefined>(undefined);

const cohortOptions = ref<Array<{ label: string; value: string }>>([] as any);
const programOptions = ref<Array<{ label: string; value: string }>>([] as any);
const pcsOptions = ref<Array<{ label: string; value: string }>>([] as any);
const projectOptions = ref<Array<{ label: string; value: string }>>([] as any);

const loadLookupData = async () => {
  // Load programs first (user selects program before cohort)
  const { data: programData, error: programError } = await supabase.from('programs').select('id, name');
  if (programError) console.error('Error loading programs', programError);
  programs.value = programData || [];
  programOptions.value = programs.value.map(p => ({ label: p.name, value: p.id }));

  // Load projects without filter initially (will be reloaded when a program/season is selected)
  const { data: projectData, error: projectError } = await supabase.from('projects').select('id, name, program_id, season_id');
  if (projectError) console.error('Error loading projects', projectError);
  projects.value = projectData || [];
  projectOptions.value = projects.value.map((p: any) => {
    const pname = programs.value.find((pr: any) => String(pr.id) === String(p.program_id))?.name;
    return { label: pname ? `${p.name} (${pname})` : p.name, value: p.id };
  });
};

// When a program is selected, fetch cohorts that are associated with that program
watch(selectedProgram, async (programId) => {
  cohortOptions.value = [];
  selectedCohort.value = [];
  pcsOptions.value = [];
  selectedPCS.value = [];
  const programIds = programId || [];
  if (!programIds || programIds.length === 0) return;

  // Query program_cohort_seasons to find cohorts linked to this program and join cohorts
  // Include start_date and order by it so cohorts appear sorted by earliest season start
  // query for all selected programs
  const { data, error } = await supabase.from('program_cohort_seasons')
     .select('id, cohort_id, start_date, end_date, cohorts(id, name), seasons(id, name), programs(id, name)')
    .in('program_id', programIds)
    .order('start_date', { ascending: true, nullsFirst: false });

  if (error) {
    console.error('Error loading cohorts for program', error);
    message.value = 'Error loading cohorts for selected program';
    messageClass.value = 'text-sm text-red-600';
    return;
  }

  // Map and dedupe cohorts
  // Build cohort -> programs map so labels can show which programs include the cohort
  const rows = (data || []) as any[];
  const cohortMap = new Map<string, { name: string; programs: Set<string> }>();
  for (const r of rows) {
    const cid = r.cohorts?.id ?? r.cohort_id;
    const cname = r.cohorts?.name ?? cid;
    const pname = r.programs?.name ?? String(r.program_id ?? '');
    if (!cohortMap.has(cid)) cohortMap.set(cid, { name: cname, programs: new Set() });
    cohortMap.get(cid)!.programs.add(pname);
  }

  const unique: Array<{ label: string; value: string }> = [];
  for (const [cid, info] of cohortMap) {
    const programsList = Array.from(info.programs).join(', ');
    unique.push({ label: `${info.name} (${programsList})`, value: cid });
  }

  cohortOptions.value = unique;

  // Also prepare PCS options with clear labels including program/cohort/season
  pcsList.value = rows || [];
  pcsOptions.value = pcsList.value.map((r: any) => ({
    label: `${r.programs?.name ?? r.program_id} — ${r.cohorts?.name ?? r.cohort_id} — ${r.seasons?.name ?? ''} — ${r.start_date} → ${r.end_date}`,
    value: r.id,
  }));

  // Also filter projects by any of the selected programs
  if (programIds && programIds.length > 0) {
    const filtered = (projects.value || []).filter((p: any) => !p.program_id || programIds.includes(String(p.program_id)));
    projectOptions.value = filtered.map((p: any) => {
      const pname = programs.value.find((pr: any) => String(pr.id) === String(p.program_id))?.name;
      return { label: pname ? `${p.name} (${pname})` : p.name, value: p.id };
    });
  } else {
    projectOptions.value = projects.value.map((p: any) => {
      const pname = programs.value.find((pr: any) => String(pr.id) === String(p.program_id))?.name;
      return { label: pname ? `${p.name} (${pname})` : p.name, value: p.id };
    });
  }
});

watch([selectedCohort, selectedProgram], async ([cohortIds, programIds]) => {
  pcsOptions.value = [];
  selectedPCS.value = [];
  const cids = cohortIds || [];
  const ids = programIds || [];
  if (!cids || cids.length === 0 || !ids || ids.length === 0) return;

  // Fetch program_cohort_seasons for selected cohorts and any of the selected programs
  const { data, error } = await supabase.from('program_cohort_seasons')
    .select('id, season_id, start_date, end_date, seasons (id, name), program_id, cohort_id')
    .in('cohort_id', cids)
    .in('program_id', ids)
    .order('start_date', { ascending: true });

  if (error) {
    console.error('Error loading program_cohort_seasons', error);
    message.value = 'Error loading cohort seasons';
    messageClass.value = 'text-sm text-red-600';
    return;
  }

  pcsList.value = data || [];
  pcsOptions.value = pcsList.value.map((r: any) => ({
    label: `${r.seasons?.name ?? r.id} — ${r.start_date} → ${r.end_date} (${r.program_id})`,
    value: r.id,
  }));

  // If a program_cohort_season (pcs) is selected later, we will filter projects by season; but
  // here we can also proactively filter projects to the program's projects.
  if (ids && ids.length > 0) {
    const filtered = (projects.value || []).filter((p: any) => !p.program_id || ids.includes(String(p.program_id)));
    projectOptions.value = filtered.map((p: any) => {
      const pname = programs.value.find((pr: any) => String(pr.id) === String(p.program_id))?.name;
      return { label: pname ? `${p.name} (${pname})` : p.name, value: p.id };
    });
  }
});

// When a specific program_cohort_season is chosen, try to further filter projects by season_id if present
// When one or more PCS entries are selected, filter projects by any of their season_ids (if present)
watch(selectedPCS, async (pcsIds) => {
  const ids = pcsIds || [];
  if (!ids || ids.length === 0) return;
  const selected = pcsList.value.filter((p: any) => ids.includes(String(p.id)));
  const seasonIds = selected.map((s: any) => s.season_id || (s.seasons && s.seasons.id)).filter(Boolean);
  if (seasonIds.length === 0) return;
  const filtered = (projects.value || []).filter((p: any) => !p.season_id || seasonIds.includes(String(p.season_id)));
    projectOptions.value = filtered.map((p: any) => {
      const pname = programs.value.find((pr: any) => String(pr.id) === String(p.program_id))?.name;
      return { label: pname ? `${p.name} (${pname})` : p.name, value: p.id };
    });
});

const addPCSProject = async () => {
  if (!(Array.isArray(selectedPCS.value) && selectedPCS.value.length > 0) || !(Array.isArray(selectedProject.value) && selectedProject.value.length > 0)) {
    message.value = 'Please choose at least one cohort season and at least one project';
    messageClass.value = 'text-sm text-red-600';
    return;
  }

  loading.value = true;
  message.value = '';

  // Build payloads by matching each selected project to PCS entries that belong to the same program
  const payloads: any[] = [];
  const skippedProjects: string[] = [];

  // Build a map from program_id -> selected PCS ids
  const pcsByProgram = new Map<string, string[]>();
  for (const pcsId of selectedPCS.value) {
    const pcsRow = pcsList.value.find((r: any) => String(r.id) === String(pcsId));
    if (!pcsRow) continue;
    const pid = String(pcsRow.program_id ?? pcsRow.programs?.id ?? '');
    if (!pcsByProgram.has(pid)) pcsByProgram.set(pid, []);
    pcsByProgram.get(pid)!.push(String(pcsId));
  }

  for (const projId of selectedProject.value) {
    const proj = projects.value.find((p: any) => String(p.id) === String(projId));
    const projProgramId = proj ? String(proj.program_id ?? '') : '';

    const matchingPCS = pcsByProgram.get(projProgramId) || [];
    if (matchingPCS.length === 0) {
      // no selected PCS entry matches this project's program
      skippedProjects.push(proj ? proj.name : String(projId));
      continue;
    }

    // create payload for each matching PCS for this project
    for (const pcsId of matchingPCS) {
      const p: any = {
        program_cohort_season_id: pcsId,
        project_id: projId,
      };
      if (startDate.value) p.start_date = startDate.value;
      if (endDate.value) p.end_date = endDate.value;
      payloads.push(p);
    }
  }

  try {
    // Supabase client type inference can be strict in TS; cast to any for insertion payload
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).from('program_cohort_season_projects').insert(payloads);
    if (error) {
      console.error('Insert error', error);
      message.value = `Insert failed: ${error.message ?? JSON.stringify(error)}`;
      messageClass.value = 'text-sm text-red-600';
    } else {
      const created = data?.length ?? payloads.length;
      let msg = `${created} assignments created successfully`;
      if (skippedProjects.length > 0) {
        msg += ` — skipped ${skippedProjects.length} project(s) with no matching selected PCS: ${skippedProjects.join(', ')}`;
      }
      message.value = msg;
      messageClass.value = 'text-sm text-green-600';

      // Invalidate student-related caches since project assignments affect student data
      delete nuxtApp.payload.data[CACHE_KEYS.STUDENTS];
      await refreshNuxtData(CACHE_KEYS.STUDENTS).catch(() => {});

      // Clear projects/dates but keep program/cohort/pcs selection
      selectedProject.value = [];
      startDate.value = undefined;
      endDate.value = undefined;
    }
  } catch (e) {
    console.error(e);
    message.value = 'Unexpected error during insert';
    messageClass.value = 'text-sm text-red-600';
  } finally {
    loading.value = false;
  }
};

const clearForm = () => {
  selectedCohort.value = [];
  selectedProgram.value = [];
  selectedPCS.value = [];
  selectedProject.value = [];
  startDate.value = undefined;
  endDate.value = undefined;
  message.value = '';
};

loadLookupData();
</script>
