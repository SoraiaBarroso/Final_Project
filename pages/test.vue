<script setup lang="ts">
import { ref } from 'vue'
import { useSortable } from '@vueuse/integrations/useSortable'

interface KanbanCard {
    id: number
    description: string
    deadline?: string
    title?: string
    priority?: "Low" | "Medium" | "High"
}

interface Column {
    id: number
    title: string
    color?: string
    description?: string
    cards: KanbanCard[]
}

const columns = ref<Column[]>([
  {
    id: 1,
    title: 'To Do',
    color: 'success',
    description: 'This item hasn\'t been started yet.',
    cards: [
      { id: 1, priority: "Low", deadline: '2023-09-30', description: 'Design homepage layout and implement responsive design', title: 'Task #1 - Design homepage layout' },
      { id: 2, priority: "Medium", deadline: '2023-10-05', description: 'Create user authentication flow and implement JWT', title: 'Task #2 - Create user authentication flow' },
      { id: 3, priority: "High", deadline: '2023-10-10', description: 'Setup database schema and implement migrations', title: 'Task #3 - Setup database schema' },
      { id: 8, priority: "Low", deadline: '2023-10-15', description: 'Implement responsive navigation', title: 'Task #4 - Implement responsive navigation' },
    ]
  },
  {
    id: 2,
    title: 'In Progress',
    description: 'This item is currently being worked on.',
    color: 'info',
    cards: [
      { id: 4, priority: "Medium", deadline: '2023-10-12', description: 'Build search functionality', title: 'Task #5 - Build search functionality' },
      { id: 5, priority: "Low", deadline: '2023-10-20', description: 'Optimize image loading', title: 'Task #6 - Optimize image loading' },
      { id: 13, priority: "High", deadline: '2023-10-25', description: 'Implement user profile page', title: 'Task #7 - Implement user profile page' },
    ]
  },
  {
    id: 3,
    title: 'Done',
    color: 'warning',
    description: 'This item has been completed.',
    cards: [
      { id: 6, priority: "Low", deadline: '2023-10-30', description: 'Initial project setup', title: 'Task #8 - Initial project setup' },
      { id: 7, priority: "Medium", deadline: '2023-11-05', description: 'Install dependencies', title: 'Task #9 - Install dependencies' },
    ]
  }
])

// Create refs for each column's card container
const columnRefs = ref<HTMLElement[]>([])

// Initialize sortable for each column
const initializeSortable = (el: HTMLElement, index: number) => {
  if (!el) return

  columnRefs.value[index] = el

  useSortable(el, columns.value[index].cards, {
    animation: 200,
    group: 'kanban',
    ghostClass: 'sortable-ghost',
    dragClass: 'sortable-drag',
    handle: '.kanban-card',
    onEnd: (evt) => {
      console.log('Drag ended:', evt)
    }
  })
}
</script>

<template>
  <div class="flex w-full h-full items-center justify-center gap-6 p-4">
    <UCard
      v-for="(column, columnIndex) in columns"
      :key="column.id"
      class="kanban-column w-72 rounded-lg"
      :ui="{
        body: '!py-2 !px-1',
        header: 'flex flex-col gap-2 !px-4 border-none',
        footer: 'flex items-center gap-2 !px-4 !py-2 hover:bg-elevated/50 cursor-pointer transition duration-200'
      }"
    >
      <template #header>

        <div class="flex justify-between items-center w-full">
            <div class="flex gap-3">
                <h1 class="text-highlighted font-medium">{{ column.title }}</h1>
                <UBadge :color="column.color" variant="subtle" :class="`text-${column.color}`">
                {{ column.cards.length }}
                </UBadge>
            </div>

             <div class="p-1 rounded-sm hover:bg-elevated/50 cursor-pointer transition duration-200">
                <UIcon name="i-lucide:ellipsis-vertical" class="text-muted"/>
            </div>
        </div>

        <p class="text-muted text-sm">{{ column.description }}</p>

      </template>

      <div
        :ref="(el) => initializeSortable(el as HTMLElement, columnIndex)"
        class="kanban-cards-container flex flex-col gap-3"
      >
        <UCard
          v-for="card in column.cards"
          :key="card.id"
          class="kanban-card flex-shrink-0 cursor-move"
          :ui="{
            root: 'mx-2 first:mt-2',
            body: '!px-3 !py-0 border-none',
            footer: 'border-none !px-3 !pb-2 mt-auto flex gap-2',
            header: '!px-3 !py-3 !pb-2 flex items-start justify-between gap-2 border-none',
          }"
        >
          <template #header>
            <h2 class="font-medium text-highlighted text-sm">{{ card.title }}</h2>
            <div class="p-1 rounded-sm hover:bg-elevated/50 transition duration-200 cursor-pointer">
                <UIcon name="i-lucide:ellipsis-vertical" class="text-muted cursor-move"/>
            </div>
          </template>

          <p class="text-muted text-xs">{{ card.description }}</p>

          <template #footer>
            <UBadge icon="i-lucide:flag" :class="card.priority === 'High' ? text-red-500 : card.priority === 'Medium' ? text-yellow-500 : text-info-500" :color="card.priority === 'High' ? 'error' : card.priority === 'Medium' ? 'warning' : 'info'" variant="subtle" size="sm">{{ card.priority }}</UBadge>
            <UBadge icon="i-lucide-calendar" class="text-muted" color="neutral" variant="outline" size="sm">{{ card.deadline }}</UBadge>
        </template>
        </UCard>
      </div>

      <template #footer>
        <UIcon name="i-lucide-plus" class="text-muted"/>
        <p class="text-muted text-sm">Add Item</p>
      </template>
    </UCard>
  </div>
</template>

<style scoped>
/* Fixed height container with scrolling */
.kanban-cards-container {
  height: 600px;
  max-height: 600px;
  overflow-y: auto;
  overflow-x: hidden;
  transition: background-color 0.2s ease;
  padding-right: 4px;
}

/* Custom scrollbar */
.kanban-cards-container::-webkit-scrollbar {
  width: 6px;
}

.kanban-cards-container::-webkit-scrollbar-track {
  background: transparent;
}

.kanban-cards-container::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.3);
  border-radius: 3px;
}

.kanban-cards-container::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.5);
}

/* SortableJS ghost element (the placeholder where the item will be dropped) */
/* :deep(.sortable-ghost) {
  opacity: 0.4;
  background: #f6f5f5;
  border: 2px dashed #e7e5e5;
} */

/* The element being dragged */
:deep(.sortable-drag) {
  opacity: 0.9;
  transform: rotate(3deg);
  /* box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3); */
}

/* Smooth transitions */
.kanban-card {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 8rem; /* h-32 = 8rem = 128px */
  display: flex;
  flex-direction: column;
}

/* Push footer to bottom */
.kanban-card :deep(.card-body) {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.kanban-card :deep(footer) {
  margin-top: auto;
}

/* Hover state for drop zone */
:deep(.kanban-cards-container:has(.sortable-ghost)) {
  background-color: color-mix(in oklab, oklch(97% 0.001 106.424) 50%, transparent);
  border-radius: 0.5rem;
}
</style>