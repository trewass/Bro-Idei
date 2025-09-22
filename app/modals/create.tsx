import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { EntryType, IdeaAnalysis } from '@/types/entry';
import { useEntriesStore } from '@/store/useEntries';
import { analyzeIdea } from '@/lib/llm';
import { startRecording, stopRecording } from '@/lib/audio';
import { transcribeAudioFile } from '@/lib/assembly';
import { palette } from '@/lib/colors';

const entryTypeOptions: { label: string; value: EntryType }[] = [
  { label: 'Идея', value: 'idea' },
  { label: 'Заметка', value: 'note' },
  { label: 'Наблюдение', value: 'observation' }
];

const creationModes = [
  { label: 'Запись голосом', value: 'voice' },
  { label: 'Текстом', value: 'text' }
] as const;

type CreationMode = (typeof creationModes)[number]['value'];

export default function CreateModal() {
  const params = useLocalSearchParams<{ type?: EntryType }>();
  const router = useRouter();
  const createEntry = useEntriesStore((state) => state.createEntry);

  const [entryType, setEntryType] = useState<EntryType>(
    (params.type as EntryType) ?? 'idea'
  );
  const [mode, setMode] = useState<CreationMode>('voice');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [transcript, setTranscript] = useState('');
  const [analysis, setAnalysis] = useState<IdeaAnalysis | null>(null);
  const [score, setScore] = useState<number | undefined>();
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);

  const selectType = (value: EntryType) => {
    setEntryType(value);
  };

  const selectMode = (value: CreationMode) => {
    setMode(value);
  };

  const toggleRecording = async () => {
    try {
      setError(null);
      if (!recording) {
        await startRecording();
        setRecording(true);
      } else {
        setLoading(true);
        const uri = await stopRecording();
        setRecording(false);
        setAudioUri(uri);
        const text = await transcribeAudioFile(uri);
        setTranscript(text);
        if (!title) {
          setTitle(text.split('\n')[0].slice(0, 80));
        }
        await runAnalysis(text);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Не удалось выполнить действие');
      setRecording(false);
    } finally {
      setLoading(false);
    }
  };

  const runAnalysis = async (inputText?: string) => {
    const sourceText = (inputText ?? transcript ?? description).trim();
    if (!sourceText) {
      setError('Нет текста для анализа');
      return;
    }

    setLoading(true);
    try {
      const analysisResult = await analyzeIdea(sourceText);
      setAnalysis(analysisResult);
      setScore(analysisResult.score);
      if (!description) {
        setDescription(analysisResult.summary ?? '');
      }
      if (!transcript && mode === 'text') {
        setTranscript(sourceText);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Не удалось выполнить анализ');
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    try {
      if (!title.trim()) {
        setError('Введите заголовок');
        return;
      }
      setLoading(true);
      await createEntry({
        type: entryType,
        title: title.trim(),
        description: description.trim() || analysis?.summary,
        transcript: transcript || undefined,
        analysis: analysis ?? undefined,
        score,
        audioPath: audioUri ?? undefined
      });
      router.back();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Не удалось сохранить запись');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Новая запись</Text>
        <View style={styles.section}>
          <Text style={styles.label}>Тип</Text>
          <View style={styles.segmented}>
            {entryTypeOptions.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => selectType(option.value)}
                style={[styles.segmentButton, entryType === option.value && styles.segmentButtonActive]}
              >
                <Text
                  style={[styles.segmentText, entryType === option.value && styles.segmentTextActive]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Способ</Text>
          <View style={styles.segmented}>
            {creationModes.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => selectMode(option.value)}
                style={[styles.segmentButton, mode === option.value && styles.segmentButtonActive]}
              >
                <Text style={[styles.segmentText, mode === option.value && styles.segmentTextActive]}>
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Заголовок</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Название"
            placeholderTextColor="#727684"
            style={styles.input}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Краткое описание</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Саммари или важные мысли"
            placeholderTextColor="#727684"
            style={[styles.input, styles.textarea]}
            multiline
          />
        </View>

        {mode === 'voice' ? (
          <View style={styles.section}>
            <Pressable style={styles.recordButton} onPress={toggleRecording} disabled={loading}>
              <Text style={styles.recordButtonText}>
                {recording ? 'Остановить диктовку' : 'Начать диктовку'}
              </Text>
            </Pressable>
            {loading ? <ActivityIndicator color={palette.textLight} style={styles.loader} /> : null}
            {transcript ? (
              <View style={styles.transcriptBox}>
                <Text style={styles.transcriptLabel}>Транскрипт</Text>
                <Text style={styles.transcriptText}>{transcript}</Text>
              </View>
            ) : null}
            {transcript ? (
              <Pressable style={styles.analyzeButton} onPress={() => runAnalysis(transcript)} disabled={loading}>
                <Text style={styles.analyzeButtonText}>Пересчитать анализ</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {mode === 'text' ? (
          <Pressable style={styles.analyzeButton} onPress={() => runAnalysis()} disabled={loading}>
            <Text style={styles.analyzeButtonText}>Получить анализ</Text>
          </Pressable>
        ) : null}

        {analysis ? (
          <View style={styles.section}>
            <Text style={styles.label}>Анализ</Text>
            <View style={styles.analysisBox}>
              <Text style={styles.analysisSummary}>{analysis.summary}</Text>
              <Text style={styles.analysisScore}>Оценка: {analysis.score}/10</Text>
              <Text style={styles.analysisVerdict}>Вердикт: {analysis.verdict}</Text>
              <Text style={styles.analysisReasoning}>{analysis.reasoning}</Text>
              <Text style={styles.analysisSuggestionsTitle}>Что улучшить:</Text>
              {analysis.suggestions?.map((suggestion) => (
                <Text key={suggestion} style={styles.analysisSuggestion}>
                  • {suggestion}
                </Text>
              ))}
            </View>
          </View>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable style={styles.submitButton} onPress={submit} disabled={loading}>
          <Text style={styles.submitButtonText}>Сохранить</Text>
        </Pressable>

        <Pressable style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>Отмена</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.backgroundDark
  },
  content: {
    padding: 24,
    gap: 16
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: palette.textLight
  },
  section: {
    gap: 12
  },
  label: {
    color: '#8E93A4',
    fontSize: 14,
    letterSpacing: 0.4
  },
  segmented: {
    flexDirection: 'row',
    gap: 8
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#2A2D36',
    alignItems: 'center'
  },
  segmentButtonActive: {
    backgroundColor: '#232631',
    borderColor: '#3A3F4F'
  },
  segmentText: {
    color: '#717684'
  },
  segmentTextActive: {
    color: palette.textLight,
    fontWeight: '600'
  },
  input: {
    backgroundColor: '#161922',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: palette.textLight,
    borderWidth: 1,
    borderColor: '#1F2230'
  },
  textarea: {
    height: 100,
    textAlignVertical: 'top'
  },
  recordButton: {
    backgroundColor: '#2E323F',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center'
  },
  recordButtonText: {
    color: palette.textLight,
    fontWeight: '600'
  },
  analyzeButton: {
    backgroundColor: '#2F3A49',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 12
  },
  analyzeButtonText: {
    color: palette.textLight,
    fontWeight: '600'
  },
  loader: {
    marginTop: 12
  },
  transcriptBox: {
    marginTop: 12,
    backgroundColor: '#1C1F2A',
    padding: 12,
    borderRadius: 12
  },
  transcriptLabel: {
    color: '#727684',
    marginBottom: 6
  },
  transcriptText: {
    color: palette.textLight,
    lineHeight: 18
  },
  analysisBox: {
    backgroundColor: '#1B1E28',
    padding: 16,
    borderRadius: 16,
    gap: 8
  },
  analysisSummary: {
    color: palette.textLight,
    fontWeight: '600'
  },
  analysisScore: {
    color: '#9EA2B2'
  },
  analysisVerdict: {
    color: '#9EA2B2'
  },
  analysisReasoning: {
    color: '#BFC2CE',
    lineHeight: 20
  },
  analysisSuggestionsTitle: {
    color: '#8E93A4',
    marginTop: 8
  },
  analysisSuggestion: {
    color: '#D4D6DD'
  },
  error: {
    color: '#E46464',
    fontSize: 14
  },
  submitButton: {
    backgroundColor: '#2F7A6F',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center'
  },
  submitButtonText: {
    color: palette.textLight,
    fontWeight: '600'
  },
  cancelButton: {
    paddingVertical: 14,
    alignItems: 'center'
  },
  cancelButtonText: {
    color: '#7B7F90'
  }
});
