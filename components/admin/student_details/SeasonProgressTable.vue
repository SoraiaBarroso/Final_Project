<script setup lang="ts">
import { resolveComponent, computed, h } from 'vue'
import type { TableColumn } from '@nuxt/ui'

const props = defineProps({
  seasonProgress: {
    type: Array as PropType<any[]>,
    required: true,
    default: () => []
  }
})

interface SeasonProgress {
  id: string
  name: string
  avatar?: {
    src?: string
    alt?: string
  }
  start_date: string
  end_date: string
  order_in_program: number
  progress_percentage: number
  is_completed: boolean
  status: 'On Going' | 'Completed' | 'Not Started'
}


const UAvatar = resolveComponent('UAvatar')
const UBadge = resolveComponent('UBadge')

onMounted(() => {
  console.log('SeasonProgressTable received data:', props.seasonProgress)
})

// Normalize incoming prop data into the shape used by the table
const data = computed<SeasonProgress[]>(() =>
  (props.seasonProgress || []).map((item: any) => {
    // incoming shapes vary; prefer nested objects when available
    const season = item.seasons || {}
    const pcs = item.program_cohort_seasons || {}

    const name = season.name ?? item.name ?? ''
    const id = item.season_id ?? season.id ?? item.id ?? ''
    const order_in_program = season.order_in_program ?? item.order_in_program ?? 0
    const start_date = pcs.start_date ?? item.start_date ?? ''
    const end_date = pcs.end_date ?? item.end_date ?? ''
    const progress_percentage = Number(item.progress_percentage ?? 0)
    const is_completed = Boolean(item.is_completed)

    const status: SeasonProgress['status'] = is_completed
      ? 'Completed'
      : progress_percentage > 0
      ? 'On Going'
      : 'Not Started'

    // avatar is optional — keep undefined if not provided
    const avatar = item.avatar ?? undefined

    return {
      id,
      name,
      avatar,
      start_date,
      end_date,
      order_in_program,
      progress_percentage,
      is_completed,
      status
    }
  })
)

const columns: TableColumn<SeasonProgress>[] = [
  {
    accessorKey: 'order_in_program',
    header: 'Order',
    cell: ({ row }) => row.original.order_in_program
  },
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => {
      const avatarProps = row.original.avatar || {}

      const content = [
        h('div', undefined, [
          h('p', { class: 'font-medium text-highlighted' }, row.original.name),
          h('p', { class: '' }, `Start date: ${row.original.start_date}`)
        ])
      ]

      // If avatar is provided and has a src, render it before the text
      if (avatarProps && avatarProps.src) {
        content.unshift(h(UAvatar, { ...avatarProps, size: 'lg' }))
      }

      return h('div', { class: 'flex items-center gap-3' }, content)
    }
  },
  {
    accessorKey: 'start_date',
    header: 'Start Date',
    cell: ({ row }) => {
      const date = row.original.start_date
      return date ? new Date(date).toLocaleDateString() : '-'
    }
  },
  {
    accessorKey: 'end_date',
    header: 'End Date',
    cell: ({ row }) => {
      const date = row.original.end_date
      return date ? new Date(date).toLocaleDateString() : '-'
    }
  },
  {
     accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const color = {
        'On Going': 'info' as const,
        'Completed': 'success' as const,
        'Not Started': 'neutral' as const
      }[row.getValue('status') as string]

      return h(UBadge, { class: 'capitalize', variant: 'subtle', color }, () =>
        row.getValue('status')
      )
    }
  },
  {
    accessorKey: 'progress_percentage',
    header: 'Progress',
    cell: ({ row }) => `${row.original.progress_percentage}%`
  },
]
</script>

<template>
  <UTable :data="data" :columns="columns" />
</template>
