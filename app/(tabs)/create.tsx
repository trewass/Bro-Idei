import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, View, KeyboardAvoidingView, Platform } from 'react-native';
import { 
  Surface, 
  Text, 
  TextInput,
  Button,
  Chip,
  useTheme,
  HelperText,
  IconButton,
  Divider,
  Snackbar,
} from 'react-native-paper';
import { router } from 'expo-router';
import { useCardsStore } from '@store/cardsStore';
import { AudioRecorder } from '@components/AudioRecorder';
import { TranscriptView } from '@components/TranscriptView';
import audioService from '@services/audioService';

export default function CreateScreen() {
  const theme = useTheme();
  const { createCard, createDraftCard, updateDraftCard, getDraftCard, clearDraftCard, isLoading } = useCardsStore();
  
  // Форма
  const [title, setTitle] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [titleError, setTitleError] = useState(false);
  
  // Аудио и транскрипт
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);
  
  // Уведомления
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Загрузка черновика при монтировании
  useEffect(() => {
    const draft = getDraftCard();
    if (draft) {
      setTitle(draft.title || '');
      setTags(draft.tags || []);
      setAudioUri(draft.audioUri || null);
      setAudioDuration(draft.audioDuration || 0);
      setTranscript(draft.transcript || '');
    }
  }, []);

  // Сохранение черновика при изменениях
  useEffect(() => {
    if (title || tags.length > 0 || audioUri || transcript) {
      updateDraftCard({
        title,
        tags,
        audioUri,
        audioDuration,
        transcript,
      });
    }
  }, [title, tags, audioUri, audioDuration, transcript]);

  const handleRecordingComplete = (uri: string, duration: number) => {
    setAudioUri(uri);
    setAudioDuration(duration);
    setTranscript(''); // Очищаем старый транскрипт при новой записи
  };

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTranscribe = async () => {
    if (!audioUri) return;
    
    setIsTranscribing(true);
    setTranscriptionError(null);
    
    // Симуляция транскрибирования (заглушка)
    setTimeout(() => {
      setTranscript('Это пример транскрипта вашей аудиозаписи. В реальном приложении здесь будет распознанный текст из вашего аудио.');
      setIsTranscribing(false);
      setSnackbarMessage('Транскрибирование завершено');
      setSnackbarVisible(true);
    }, 3000);
  };

  const handleAnalyzeAI = () => {
    setSnackbarMessage('Анализ ИИ будет доступен в следующей версии');
    setSnackbarVisible(true);
  };

  const handleSave = async () => {
    // Валидация
    if (!title.trim()) {
      setTitleError(true);
      setSnackbarMessage('Пожалуйста, введите название');
      setSnackbarVisible(true);
      return;
    }

    try {
      // Сохраняем аудио файл если есть
      let savedAudioUri = audioUri;
      if (audioUri) {
        const filename = `audio_${Date.now()}.m4a`;
        savedAudioUri = await audioService.saveRecording(audioUri, filename);
      }

      // Создаем карточку
      const newCard = await createCard({
        shortDescription: title.trim(),
        fullDescription: transcript || '',
        severity0_10: 5, // Значение по умолчанию
        category: 'other',
        tags,
        audioUri: savedAudioUri || undefined,
        isArchived: false,
      });

      // Очищаем черновик
      clearDraftCard();
      
      // Переходим на карточку
      router.push(`/card/${newCard.id}`);
    } catch (error) {
      console.error('Error creating card:', error);
      setSnackbarMessage('Ошибка при создании карточки');
      setSnackbarVisible(true);
    }
  };

  const handleClear = () => {
    setTitle('');
    setTags([]);
    setTagInput('');
    setAudioUri(null);
    setAudioDuration(0);
    setTranscript('');
    setTitleError(false);
    clearDraftCard();
    
    setSnackbarMessage('Форма очищена');
    setSnackbarVisible(true);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <ScrollView 
        style={[styles.scrollView, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Основная форма */}
        <Surface style={styles.surface} elevation={1}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Основная информация
          </Text>
          
          <TextInput
            label="Название *"
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              setTitleError(false);
            }}
            mode="outlined"
            error={titleError}
            style={styles.input}
          />
          <HelperText type="error" visible={titleError}>
            Название обязательно для заполнения
          </HelperText>

          <View style={styles.tagsContainer}>
            <TextInput
              label="Теги (опционально)"
              value={tagInput}
              onChangeText={setTagInput}
              mode="outlined"
              right={
                <TextInput.Icon 
                  icon="plus" 
                  onPress={handleAddTag}
                  disabled={!tagInput.trim()}
                />
              }
              onSubmitEditing={handleAddTag}
              style={styles.tagInput}
            />
            
            <View style={styles.tagsList}>
              {tags.map((tag, index) => (
                <Chip
                  key={index}
                  mode="flat"
                  onClose={() => handleRemoveTag(tag)}
                  style={styles.tag}
                >
                  {tag}
                </Chip>
              ))}
            </View>
          </View>
        </Surface>

        {/* Блок записи аудио */}
        <Surface style={styles.surface} elevation={1}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Запись аудио
          </Text>
          <Text variant="bodyMedium" style={[styles.helperText, { color: theme.colors.onSurfaceVariant }]}>
            Расскажите о своем страхе голосом - это поможет лучше проанализировать ситуацию
          </Text>
          
          <AudioRecorder
            onRecordingComplete={handleRecordingComplete}
            initialUri={audioUri || undefined}
            initialDuration={audioDuration}
          />

          {audioUri && !transcript && (
            <Button
              mode="contained-tonal"
              icon="microphone-message"
              onPress={handleTranscribe}
              loading={isTranscribing}
              disabled={isTranscribing}
              style={styles.transcribeButton}
            >
              Отправить на транскрибирование
            </Button>
          )}
        </Surface>

        {/* Блок транскрипта */}
        {(transcript || isTranscribing || transcriptionError) && (
          <TranscriptView
            transcript={transcript}
            isLoading={isTranscribing}
            onTranscriptChange={setTranscript}
            onAnalyzePress={handleAnalyzeAI}
            error={transcriptionError}
          />
        )}

        {/* Кнопки действий */}
        <View style={styles.actions}>
          <Button
            mode="outlined"
            onPress={handleClear}
            style={styles.actionButton}
          >
            Очистить
          </Button>
          <Button
            mode="contained"
            onPress={handleSave}
            loading={isLoading}
            disabled={isLoading || !title.trim()}
            style={styles.actionButton}
            icon="content-save"
          >
            Сохранить карточку
          </Button>
        </View>
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  surface: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: '600',
  },
  input: {
    marginBottom: 4,
  },
  helperText: {
    marginBottom: 16,
    lineHeight: 20,
  },
  tagsContainer: {
    marginTop: 12,
  },
  tagInput: {
    marginBottom: 8,
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    marginBottom: 4,
  },
  transcribeButton: {
    marginTop: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
  },
});