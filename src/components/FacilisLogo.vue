<script setup lang="ts">
defineProps<{
    size?: string | number;
    color?: string;
}>();
</script>

<template>
    <svg
        :width="size || 24"
        :height="size || 24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        class="facilis-logo"
    >
        <path
            d="M4 17C7 17 9 7 12 7C15 7 17 17 20 17"
            :stroke="color || 'currentColor'"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="logo-path"
        />
        <!-- Optional: A small "dot" to represent the start of a simplified idea -->
        <circle 
            cx="4" 
            cy="17" 
            r="1.2" 
            :fill="color || 'currentColor'" 
            class="logo-dot"
        />
    </svg>
</template>

<style scoped>
.facilis-logo {
    display: inline-block;
    vertical-align: middle;
}

.logo-path {
    transition: all 0.3s ease;
}

.facilis-logo:hover .logo-path {
    stroke-width: 3;
    opacity: 0.8;
}
</style>
