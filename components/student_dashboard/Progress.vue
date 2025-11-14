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
    <div class="flex flex-col gap-1">
        <h2 class="font-semibold text-black/80 2xl:text-xl">Progress</h2>
        
        <p v-if="props.status == 'On Track'" class="text-muted text-base xl:mt-2 2xl:mt-2 2xl:text-lg">Congratulations! You're currently <span class="text-green-500 font-semibold cursor-pointer" @click="launchConfetti">on track</span></p>
        <p v-else-if="props.status == 'At Risk'" class="text-muted text-base xl:mt-2 2xl:mt-2 2xl:text-lg">You're currently <span class="text-yellow-500">at risk</span>, please check your tasks</p>
        <p v-else class="text-muted text-base xl:mt-2 2xl:mt-2 2xl:text-lg">You're currently <span class="text-red-500 text-semi">off track</span>, please reach out for help</p>

        <UCard
        class="mt-2.5" 
        >
            <template #header>
                <h3 class="font-semibold text-black/80 2xl:text-lg">Seasons Progress</h3>
            </template>
            <UProgress
                v-model="value"
                size="lg"
                :ui="{
                    height: 'h-4',
                    bg: 'bg-gray-200 dark:bg-gray-700',
                    bar: 'bg-blue-600',
                    rounded: 'rounded-lg',
                }"
            />
            <p class="text-sm text-muted mt-2 2xl:text-base text-right w-full">{{ props.completedSeasons }} out of {{ props.totalSeasons }} seasons completed</p>
        </UCard>
    </div>
</template>