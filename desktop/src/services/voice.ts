import fetch from 'node-fetch'

export const synthesizeVoice = async (
  text: string,
  backendUrl: string,
  voice: string = 'Alice'
): Promise<Blob | null> => {
  try {
    const response = await fetch(`${backendUrl}/speak`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        voice,
      }),
    })

    if (!response.ok) {
      throw new Error(`Voice synthesis failed: ${response.statusText}`)
    }

    return await response.blob()
  } catch (error) {
    console.error('Voice synthesis error:', error)
    return null
  }
}

export const playAudioBlob = async (audioBlob: Blob): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const url = URL.createObjectURL(audioBlob)
      const audio = new Audio(url)

      audio.onended = () => {
        URL.revokeObjectURL(url)
        resolve()
      }

      audio.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Audio playback failed'))
      }

      audio.play().catch(reject)
    } catch (error) {
      reject(error)
    }
  })
}

export const stopAudio = (): void => {
  const audioElements = document.querySelectorAll('audio')
  audioElements.forEach((audio) => {
    audio.pause()
    audio.currentTime = 0
  })
}
