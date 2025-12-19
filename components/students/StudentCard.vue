<script setup>
const props = defineProps({
  student: {
    type: Object,
    required: true
  }
})

const isDownloading = ref(false)
const toast = useToast()

// Calculate expiration date (4 years from now)
const expirationDate = computed(() => {
  const date = new Date()
  date.setFullYear(date.getFullYear() + 4)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${month}/${year}`
})

// Generate student ID number
const studentIdNumber = computed(() => {
  return props.student.id ? String(props.student.id).padStart(5, '0') : '00000'
})

// Load image as base64 to avoid CORS issues (returns Image element)
const loadImage = (url) =>
  new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = url
  })

// Convert Image element to data URL
const imageToDataURL = (img) => {
  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0)
  return canvas.toDataURL('image/jpeg', 0.95)
}

// Retrieve an external image via backend proxy to avoid CORS
const fetchImageViaProxy = async (url) => {
  try {
    const res = await fetch(`/api/proxy-image?url=${encodeURIComponent(url)}`)
    if (!res.ok) return null
    const json = await res.json()
    return json.base64 || null
  } catch (e) {
    return null
  }
}

// Shrink font size until text fits within max width
const fitText = (doc, text, maxWidth, startSize = 18, minSize = 12) => {
  let size = startSize
  doc.setFontSize(size)
  while (doc.getTextWidth(text) > maxWidth && size > minSize) {
    size -= 0.5
    doc.setFontSize(size)
  }
  return size
}

// Load local image
const loadLocalImage = (path) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = path
  })
}

const downloadCard = async () => {
  isDownloading.value = true

  try {
    if (import.meta.server) {
      throw new Error('PDF generation is client-only')
    }

    const { jsPDF } = await import('jspdf')
    // PDF setup (ID-1 size)
    const cardW = 85.6
    const cardH = 54
    const padding = 5
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [cardW, cardH] })

    // Background
    doc.setFillColor(255, 255, 255)
    doc.rect(0, 0, cardW, cardH, 'F')

    // Right-side photo panel
    const photoW = 32
    const photoH = cardH
    const photoX = cardW - photoW
    const photoY = 0

    // Draw subtle divider line
    doc.setDrawColor(235, 235, 235)
    doc.setLineWidth(0.4)
    doc.line(photoX, 6, photoX, cardH - 6)

    // Try draw logo
    let drewLogo = false
    try {
      const logoImg = await loadLocalImage('/Final-AIT-Logo.png')
      const logoRatio = logoImg.width / logoImg.height
      const logoH = 12
      const logoW = logoH * logoRatio
      const logoData = imageToDataURL(logoImg)
      doc.addImage(logoData, 'PNG', padding, padding, logoW, logoH)
      drewLogo = true
    } catch (e) {}

    if (!drewLogo) {
      doc.setTextColor(26, 26, 26)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.text('Amsterdam Tech', padding, padding + 6)
    }

    // Text section
    const name = `${props.student.first_name || ''} ${props.student.last_name || ''}`.trim()
    const programName = props.student.programs?.name || props.student.program_name || 'Student'
    const program = `BSC ${programName}`

    // Name
    doc.setTextColor(26, 26, 26)
    doc.setFont('helvetica', 'bold')
    const textMaxW = cardW - photoW - padding * 2
    fitText(doc, name || 'Student Name', textMaxW, 18, 12)
    doc.text(name || 'Student Name', padding, 30)

    // Program
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(102, 102, 102)
    doc.setFontSize(10)
    const programLines = doc.splitTextToSize(program, textMaxW)
    doc.text(programLines, padding, 36)

    // Footer labels
    doc.setFontSize(8)
    doc.setTextColor(153, 153, 153)
    doc.text('Expires', padding, cardH - 10)
    doc.text('ID Number', padding + 32, cardH - 10)

    // Footer values
    doc.setTextColor(26, 26, 26)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text(expirationDate.value, padding, cardH - 4)
    doc.text(studentIdNumber.value, padding + 32, cardH - 4)

    // Photo: try to load and crop to cover the right panel
    let photoPlaced = false
    if (props.student.profile_image_url) {
      let dataUrl = await fetchImageViaProxy(props.student.profile_image_url)
      if (!dataUrl) {
        const imgEl = await loadImage(props.student.profile_image_url)
        if (imgEl) dataUrl = imageToDataURL(imgEl)
      }
      if (dataUrl) {
        const imgEl = await loadImage(dataUrl)
        if (imgEl) {
          const canvas = document.createElement('canvas')
          canvas.width = 680
          canvas.height = Math.round(canvas.width * (photoH / photoW))
          const ctx = canvas.getContext('2d')
          const imgRatio = imgEl.width / imgEl.height
          const boxRatio = canvas.width / canvas.height
          let drawW, drawH, drawX, drawY
          if (imgRatio > boxRatio) {
            drawH = canvas.height
            drawW = imgEl.width * (canvas.height / imgEl.height)
            drawX = -(drawW - canvas.width) / 2
            drawY = 0
          } else {
            drawW = canvas.width
            drawH = imgEl.height * (canvas.width / imgEl.width)
            drawX = 0
            drawY = -(drawH - canvas.height) / 2
          }
          ctx.drawImage(imgEl, drawX, drawY, drawW, drawH)
          const cropped = canvas.toDataURL('image/jpeg', 0.92)
          doc.addImage(cropped, 'JPEG', photoX, photoY, photoW, photoH)
          photoPlaced = true
        }
      }
    }

    // Placeholder if no photo
    if (!photoPlaced) {
      doc.setFillColor(229, 229, 229)
      doc.rect(photoX, photoY, photoW, photoH, 'F')
      const initials = `${props.student.first_name?.[0] || ''}${props.student.last_name?.[0] || ''}`
      doc.setTextColor(153, 153, 153)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(28)
      const textWidth = doc.getTextWidth(initials)
      doc.text(initials || ' ', photoX + photoW / 2 - textWidth / 2, photoY + photoH / 2 + 9)
    }

    // Save PDF
    const fileName = `student-card-${props.student.first_name || 'student'}-${props.student.last_name || ''}.pdf`
    doc.save(fileName)

    toast.add({
      title: 'Success',
      description: 'Student card PDF downloaded successfully',
      color: 'green'
    })
  } catch (error) {
    console.error('Error generating student card:', error)
    toast.add({
      title: 'Error',
      description: 'Failed to generate student card PDF',
      color: 'red'
    })
  } finally {
    isDownloading.value = false
  }
}

defineExpose({ downloadCard })
</script>

<template>
  <div>
    <!-- Download Button -->
    <UButton
      color="neutral"
      variant="outline"
      icon="i-lucide-download"
      :loading="isDownloading"
      @click="downloadCard"
      class="w-full justify-center"
    >
      Download Student Card
    </UButton>
  </div>
</template>
