import { Audio } from 'expo-av'
import * as FileSystem from 'expo-file-system'

let recording: Audio.Recording | null = null
let sound: Audio.Sound | null = null

// Initialize audio
export const initAudio = async () => {
  try {
    await Audio.requestPermissionsAsync()
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
    })
  } catch (error) {
    console.error('Failed to initialize audio:', error)
  }
}

// Start recording
export const startRecording = async (): Promise<string | null> => {
  try {
    if (recording) {
      await stopRecording()
    }

    const newRecording = new Audio.Recording()
    await newRecording.prepareToRecordAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    )
    await newRecording.startAsync()
    recording = newRecording
    return 'recording'
  } catch (error) {
    console.error('Failed to start recording:', error)
    return null
  }
}

// Stop recording and get file
export const stopRecording = async (): Promise<string | null> => {
  try {
    if (!recording) return null

    await recording.stopAndUnloadAsync()
    const uri = recording.getURI()
    recording = null
    return uri
  } catch (error) {
    console.error('Failed to stop recording:', error)
    return null
  }
}

// Play audio
export const playAudio = async (uri: string) => {
  try {
    if (sound) {
      await sound.unloadAsync()
    }

    const { sound: newSound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: true }
    )
    sound = newSound
  } catch (error) {
    console.error('Failed to play audio:', error)
  }
}

// Stop playback
export const stopAudio = async () => {
  try {
    if (sound) {
      await sound.stopAsync()
      await sound.unloadAsync()
      sound = null
    }
  } catch (error) {
    console.error('Failed to stop audio:', error)
  }
}

// Clean up
export const cleanupAudio = async () => {
  try {
    if (recording) {
      await recording.stopAndUnloadAsync()
      recording = null
    }
    if (sound) {
      await sound.unloadAsync()
      sound = null
    }
  } catch (error) {
    console.error('Failed to cleanup audio:', error)
  }
}
