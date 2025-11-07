<script setup>
const props = defineProps({
    first_name: {
        type: String ,
        required: true
    }
});
</script>


<template>
    <div class="flex flex-col gap-4">
        <h1 class="font-semibold text-black/80 xl:text-4xl 2xl:text-2xl">Hello, 
            <span class="text-primary-500 font-semibold xl:text-4xl 2xl:text-2xl">
                {{ props.first_name }}! 
            </span>
        </h1>

        <div>
            <p class="text-muted text-base xl:mt-2 2xl:mt-1 2xl:text-lg">Nice to have you back, what an exciting day!</p>
            <p class="text-muted mt-2 text-base 2xl:text-lg">Get ready and check your projects today</p>
        </div>
    </div>
</template>