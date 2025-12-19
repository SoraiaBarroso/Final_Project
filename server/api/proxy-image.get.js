export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const imageUrl = query.url

  if (!imageUrl) {
    throw createError({
      statusCode: 400,
      message: 'Image URL is required'
    })
  }

  try {
    // Fetch the image from the external URL
    const response = await fetch(imageUrl)

    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        message: 'Failed to fetch image'
      })
    }

    // Get the image as array buffer
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Convert to base64
    const base64 = buffer.toString('base64')

    // Get content type
    const contentType = response.headers.get('content-type') || 'image/jpeg'

    return {
      base64: `data:${contentType};base64,${base64}`
    }
  } catch (error) {
    console.error('Error proxying image:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to proxy image'
    })
  }
})
