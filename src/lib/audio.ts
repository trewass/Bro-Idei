import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

type RecordingSession = {
  recording: Audio.Recording;
};

let activeSession: RecordingSession | null = null;

export const requestRecordingPermissions = async () => {
  const permission = await Audio.requestPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Microphone permission not granted');
  }
};

export const startRecording = async () => {
  await requestRecordingPermissions();
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
    staysActiveInBackground: false
  });

  const { recording } = await Audio.Recording.createAsync(
    Audio.RecordingOptionsPresets.HIGH_QUALITY
  );

  activeSession = { recording };
  return recording;
};

export const stopRecording = async () => {
  if (!activeSession?.recording) {
    throw new Error('No active recording');
  }

  const { recording } = activeSession;
  await recording.stopAndUnloadAsync();
  const uri = recording.getURI();
  activeSession = null;
  if (!uri) {
    throw new Error('Failed to retrieve audio URI');
  }
  return uri;
};

export const deleteRecordingFile = async (uri: string) => {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists) {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    }
  } catch (error) {
    console.warn('Failed to delete recording file', error);
  }
};
