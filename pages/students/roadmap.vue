<script setup> 
  definePageMeta({
    layout: "custom",
    middleware: ["auth", "student-only"],
  });
</script>

<template>hi</template>