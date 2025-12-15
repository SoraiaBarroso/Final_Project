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
    const count = 200;
    const defaults = {
        origin: { y: 0.7 }
    };

    function fire(particleRatio, opts) {
        useConfetti({
            ...defaults,
            ...opts,
            particleCount: Math.floor(count * particleRatio)
        });
    }

    fire(0.25, {
        spread: 26,
        startVelocity: 55,
    });
    fire(0.2, {
        spread: 60,
    });
    fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8
    });
    fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2
    });
    fire(0.1, {
        spread: 120,
        startVelocity: 45,
    });
};
</script>

<template>
    <div class="flex flex-col gap-1">
        <h2 class="font-semibold text-highlighted 2xl:text-xl">Progress</h2>
        
        <div class="flex justify-between items-center">
            <p v-if="props.status == 'On Track'" class="text-muted xl:mt-2 2xl:mt-2 text-sm 2xl:text-base">Congratulations! You're currently on track</p>
            <p v-else-if="props.status == 'At Risk'" class="text-muted text-sm xl:mt-2 2xl:mt-2 2xl:text-base">You're currently at risk, please check your tasks</p>
            <p v-else class="text-muted text-sm xl:mt-2 2xl:mt-2 2xl:text-base">You're currently off track, please reach out for help</p>

            <UButton v-if="props.status == 'On Track'" variant="subtle" icon="i-streamline:entertainment-party-popper-hobby-entertainment-party-popper-confetti-event" class="rounded-full p-2" @click="launchConfetti"/>
        </div>

        <UCard
        class="mt-2.5" 
        :ui="{
            header: 'border-none !pb-0'
        }"
        >
            <template #header>
                <h3 class="font-semibold text-highlighted 2xl:text-lg">Seasons Progress</h3>
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