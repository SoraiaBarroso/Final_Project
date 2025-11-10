<script setup>
const props = defineProps({
    status: {
        type: String,
        required: true
    },
    progress: {
        type: Number,
        required: true
    },
    completedSeasons: {
        type: Number,
        required: true
    },
    totalSeasons: {
        type: Number,
        required: true
    },
    seasons: {
        type: Array,
        default: () => []
    }
});

console.log('Seasons prop:', props.seasons);

const value = computed(() => props.progress || 0);

const launchConfetti = () => {
    useConfetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
};
</script>

<template>
    <div class="flex flex-col gap-2">
        <h2 class="font-semibold text-black/80 2xl:text-xl">Progress</h2>
        
        <p v-if="props.status == 'On Track'" class="text-muted text-base xl:mt-2 2xl:mt-2 2xl:text-lg">Congratulations! You're currently <span class="text-green-500 font-semibold cursor-pointer" @click="launchConfetti">on track</span></p>
        <p v-else-if="props.status == 'At Risk'" class="text-muted text-base xl:mt-2 2xl:mt-2 2xl:text-lg">You're currently <span class="text-yellow-500">at risk</span>, please check your tasks</p>
        <p v-else class="text-muted text-base xl:mt-2 2xl:mt-2 2xl:text-lg">You're currently <span class="text-red-500 text-semi">off track</span>, please reach out for help</p>
    
        <UCard
            class="mt-4 w-full"
            :ui="{
            body: '2xl:!px-6 2xl:!py-4 xl:!px-6 w-full flex flex-col items-end gap-4',
            }"
        >    
            <!-- <div class="w-full flex justify-between items-center">
                <p class="text-muted">Overall Progress:</p>
            </div>
            <UProgress size="lg" v-model="value" status/> -->
            <!-- <p class="text-muted">{{ completedSeasons }} out of {{ totalSeasons }} seasons completed</p> -->

            <div class="flex flex-col gap-4 text-left w-full">
                <div
                    v-for="season in props.seasons"
                    :key="season.season_id"
                    class="flex justify-between items-end gap-4"
                >
                    <p class="w-fit text-nowrap text-muted">{{ season.season_name }}</p>
                    <UProgress size="lg" class="mb-1" v-model="season.progress_percentage" status/>
                </div>
            </div>
        </UCard>
    </div>
</template>