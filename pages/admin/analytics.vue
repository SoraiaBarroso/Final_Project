<script setup>
definePageMeta({
layout: "default",
middleware: ["admin"], // check if user has admin role (auth is checked globally)
});

import BarCharSingle from '~/components/admin/BarCharSingle.vue';

// Hardcoded analytics data
const analyticsData = {
  attendanceRate: 87.5,
  workshopRate: 78.2,
  mentoringRate: 15.4,
  standupRate: 6.4
};


</script>

<template>
    <div class="py-6 flex flex-col h-full gap-6 px-8">
        <h1 class="text-black/80 text-lg font-semibold">Attendance Percentage</h1>

        <div
            class="grid grid-cols-1 grid-rows-2 gap-4 sm:gap-6 md:grid-cols-2 md:grid-rows-2 lg:grid-cols-2 lg:grid-rows-2 lg:gap-4 xl:grid-cols-4 xl:grid-rows-1 xl:gap-px"
        >
            <UCard
                variant="subtle"
                :ui="{
                root: 'border-none py-1 h-30 xl:h-34 xl:!py-2 hover:ring-accented rounded-lg xl:rounded-none xl:rounded-l-lg hover:bg-elevated cursor-pointer',
                body: 'border-none px-4 xl:!px-6 !py-0',
                header: 'border-none xl:px-2 px-4 !py-3 xl:px-6',
                footer: 'border-none xl:px-2 px-4 !py-1 xl:px-6',
                }"
            >
                <template #header>
                <div
                    class="bg-info/10 border-info flex h-8 w-8 items-center justify-center rounded-full border"
                >
                    <UIcon name="i-lucide-users" class="text-info text-currentColor size-4" />
                </div>
                </template>

                <p class="text-muted text-xs font-semibold uppercase">Average Attendance</p>

                <template #footer>
                <p class="m-0 flex items-center text-2xl font-bold text-black">
                    {{ analyticsData.attendanceRate }}%
                </p>
                </template>
            </UCard>
      <UCard
        variant="subtle"
        :ui="{
          root: 'border-none py-1 h-30 xl:h-34 xl:!py-2 hover:ring-accented rounded-lg xl:rounded-none hover:bg-elevated cursor-pointer',
          body: 'border-none px-4 xl:!px-6 !py-0',
          header: 'border-none xl:px-2 px-4 !py-3 xl:px-6',
          footer: 'border-none xl:px-2 px-4 !py-1 xl:px-6 flex items-center justify-start gap-2',
        }"
      >
        <template #header>
          <div
            class="bg-success/10 border-success flex h-8 w-8 items-center justify-center rounded-full border"
          >
            <UIcon name="i-lucide-check-circle" class="text-success text-currentColor size-4" />
          </div>
        </template>

        <p class="text-muted text-xs font-semibold uppercase">Workshop</p>

        <template #footer>
          <p class="m-0 flex items-center text-2xl font-bold text-black">
            {{ analyticsData.workshopRate }}%
          </p>
        </template>
      </UCard>
      <UCard
        variant="subtle"
        :ui="{
          root: 'border-none py-1 h-30 xl:h-34 xl:!py-2 hover:ring-accented rounded-lg xl:rounded-none hover:bg-elevated cursor-pointer',
          body: 'border-none px-4 xl:!px-6 !py-0',
          header: 'border-none xl:px-2 px-4 !py-3 xl:px-6',
          footer: 'border-none xl:px-2 px-4 !py-1 xl:px-6 flex items-center justify-start gap-2',
        }"
      >
        <template #header>
          <div
            class="bg-error/10 border-error flex h-8 w-8 items-center justify-center rounded-full border"
          >
            <UIcon name="i-lucide-triangle-alert" class="text-error text-currentColor size-4" />
          </div>
        </template>

        <p class="text-muted text-xs font-semibold uppercase">Mentoring</p>

        <template #footer>
          <p class="m-0 flex items-center text-2xl font-bold text-black">
            {{ analyticsData.mentoringRate }}%
          </p>
        </template>
      </UCard>
      <UCard
        variant="subtle"
        :ui="{
          root: 'border-none py-1 h-30 xl:h-34 xl:!py-2 hover:ring-accented rounded-lg xl:rounded-none xl:rounded-r-lg hover:bg-elevated cursor-pointer',
          body: 'border-none px-4 xl:!px-6 !py-0',
          header: 'border-none xl:px-2 px-4 !py-3 xl:px-6',
          footer: 'border-none xl:px-2 px-4 !py-1 xl:px-6 flex items-center justify-start gap-2',
        }"
      >
        <template #header>
          <div
            class="bg-info/10 border-info flex h-8 w-8 items-center justify-center rounded-full border"
          >
            <UIcon name="i-lucide-party-popper" class="text-info text-currentColor size-4" />
          </div>
        </template>

        <p class="text-muted text-xs font-semibold uppercase">Stand-Up</p>

        <template #footer>
          <p class="m-0 flex items-center text-2xl font-bold text-black">
            {{ analyticsData.standupRate }}%
          </p>
        </template>
      </UCard>
        </div>

       <UCard
        class="flex flex-col items-center h-full"
        :ui="{
          header: 'w-full border-b border-border px-4 xl:px-6 flex items-center gap-2',
          body: 'w-full flex justify-center items-center',
        }"
       >
        <template #header>
            <h1 class="text-black/80 text-lg font-semibold">Attendance Overview</h1>

            <UTooltip arrow text="Shows the total number of scheduled meetings versus the number of meetings students actually attended, for each meeting type." :delay-duration="0">
                <UIcon name="i-lucide-info" class="text-muted text-currentColor size- cursor-pointer" />
            </UTooltip>
        </template>

            <BarCharSingle />
       </UCard>
    </div>
</template>