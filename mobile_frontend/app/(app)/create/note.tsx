import { useEffect, useMemo, useState } from 'react';
import { useThemedStyles } from '@/lib/useThemedStyles';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { typography, radius } from '@/lib/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { backendApi } from '@/lib/backendApi';
import { sanitizeInput } from '@/lib/validation';
import { COUNTRY_DIAL_OPTIONS } from '@/lib/countryDialOptions';

type Step = 1 | 2 | 3;
type AssignMode = 'existing' | 'new';

type ExistingRecipient = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  relationship: string | null;
};

const LANGUAGE_OPTIONS = [
  'English',
  'Hindi',
  'Telugu',
  'Tamil',
  'Kannada',
  'Malayalam',
  'Marathi',
  'Gujarati',
  'Bengali',
  'Punjabi',
  'Urdu',
  'Other',
] as const;

const LANGUAGE_TO_LOCALE: Record<string, { lang: string; writingDirection: 'ltr' | 'rtl' }> = {
  English: { lang: 'en', writingDirection: 'ltr' },
  Hindi: { lang: 'hi', writingDirection: 'ltr' },
  Telugu: { lang: 'te', writingDirection: 'ltr' },
  Tamil: { lang: 'ta', writingDirection: 'ltr' },
  Kannada: { lang: 'kn', writingDirection: 'ltr' },
  Malayalam: { lang: 'ml', writingDirection: 'ltr' },
  Marathi: { lang: 'mr', writingDirection: 'ltr' },
  Gujarati: { lang: 'gu', writingDirection: 'ltr' },
  Bengali: { lang: 'bn', writingDirection: 'ltr' },
  Punjabi: { lang: 'pa', writingDirection: 'ltr' },
  Urdu: { lang: 'ur', writingDirection: 'rtl' },
  Other: { lang: 'und', writingDirection: 'ltr' },
};

export default function CreateNoteWillScreen() {
  const { colors } = useAppTheme();
  const styles = useThemedStyles((colors) =>
    StyleSheet.create({
      container: { flex: 1, backgroundColor: colors.background },
      content: { padding: 24, paddingBottom: 48 },
      backWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
      back: { color: colors.mutedForeground, fontWeight: '500', fontSize: 15 },
      progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20 },
      stepDot: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.border,
      },
      stepDotActive: { backgroundColor: colors.gold, borderColor: colors.gold },
      stepDotDone: { backgroundColor: colors.sage + '99', borderColor: colors.sage },
      stepDotText: { fontSize: 14, fontWeight: '600', color: colors.foreground },
      title: { ...typography.headingSection, color: colors.foreground, textAlign: 'center', marginBottom: 8 },
      subtitle: { fontSize: 15, color: colors.mutedForeground, textAlign: 'center', lineHeight: 22, marginBottom: 18 },
      card: { backgroundColor: colors.card, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 16 },
      label: { fontSize: 13, fontWeight: '600', color: colors.foreground, marginBottom: 8 },
      selectBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.input,
        padding: 14,
        marginBottom: 16,
        backgroundColor: colors.background,
      },
      selectBtnText: { fontSize: 16, color: colors.foreground, flex: 1 },
      textarea: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.input,
        padding: 12,
        fontSize: 16,
        color: colors.foreground,
        backgroundColor: colors.background,
        minHeight: 200,
        textAlignVertical: 'top',
      },
      charCount: { fontSize: 12, color: colors.mutedForeground, marginTop: 6 },
      translateBox: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.card,
        padding: 12,
        marginTop: 12,
        backgroundColor: colors.secondary,
      },
      translateLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        marginBottom: 6,
      },
      translateLabel: { fontSize: 12, fontWeight: '700', color: colors.foreground },
      translateHint: { fontSize: 12, color: colors.mutedForeground, marginTop: 6 },
      translateText: { fontSize: 14, color: colors.foreground, lineHeight: 20 },
      translateError: { fontSize: 12, color: colors.destructive, marginTop: 6 },
      modeRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
      modeCard: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, padding: 14, backgroundColor: colors.background },
      modeCardActive: { borderColor: colors.gold, backgroundColor: colors.gold + '18' },
      modeTitle: { fontSize: 15, fontWeight: '600', color: colors.foreground, marginTop: 8 },
      input: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.input,
        padding: 12,
        fontSize: 16,
        color: colors.foreground,
        backgroundColor: colors.background,
        marginBottom: 12,
      },
      previewBlock: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, padding: 12, marginBottom: 12, backgroundColor: colors.background },
      previewLabel: { fontSize: 11, fontWeight: '600', color: colors.mutedForeground, marginBottom: 4, textTransform: 'uppercase' },
      previewBody: { fontSize: 14, color: colors.foreground, lineHeight: 20 },
      footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
      outlineBtn: {
        borderWidth: 1,
        borderColor: colors.border,
        paddingVertical: 14,
        paddingHorizontal: 18,
        borderRadius: radius.button,
      },
      outlineBtnText: { fontSize: 16, fontWeight: '600', color: colors.foreground },
      primaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: colors.gold,
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: radius.button,
      },
      primaryBtnDisabled: { opacity: 0.6 },
      primaryBtnText: { fontSize: 16, fontWeight: '600', color: colors.goldForeground },
      secureRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16 },
      secureText: { fontSize: 13, color: colors.mutedForeground },
      modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
      modalSheet: {
        backgroundColor: colors.card,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        maxHeight: '70%',
        paddingBottom: 24,
      },
      modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
      modalTitle: { fontSize: 18, fontWeight: '600', color: colors.foreground },
      modalItem: { paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
      modalItemText: { fontSize: 16, color: colors.foreground },
    })
  );

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [step, setStep] = useState<Step>(1);
  const [isSaving, setIsSaving] = useState(false);
  const [existingRecipients, setExistingRecipients] = useState<ExistingRecipient[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(true);

  const [language, setLanguage] = useState<string>('English');
  const [sourceNoteText, setSourceNoteText] = useState('');
  const [translatedNoteText, setTranslatedNoteText] = useState<string>('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);

  const [assignMode, setAssignMode] = useState<AssignMode>('existing');
  const [existingRecipientId, setExistingRecipientId] = useState('');

  const [newRecipientName, setNewRecipientName] = useState('');
  const [newRecipientEmail, setNewRecipientEmail] = useState('');
  const [newRecipientCountry, setNewRecipientCountry] = useState('IN');
  const [newRecipientPhone, setNewRecipientPhone] = useState('');
  const [newRecipientRelationship, setNewRecipientRelationship] = useState('beneficiary');

  const [langModal, setLangModal] = useState(false);
  const [countryModal, setCountryModal] = useState(false);

  const languageAttrs = useMemo(() => LANGUAGE_TO_LOCALE[language] ?? LANGUAGE_TO_LOCALE.Other, [language]);
  const targetLangCode = languageAttrs.lang;
  const displayedNoteText = language === 'English' ? sourceNoteText : (translatedNoteText || '');
  const countryLabel = useMemo(() => {
    const c = COUNTRY_DIAL_OPTIONS.find((x) => x.code === newRecipientCountry);
    return c ? `${c.name} (${c.dialCode})` : newRecipientCountry;
  }, [newRecipientCountry]);

  // Auto-translate for selected language (non-English) with debounce.
  useEffect(() => {
    if (language === 'English' || targetLangCode === 'und') {
      setTranslatedNoteText('');
      setTranslateError(null);
      setIsTranslating(false);
      return;
    }
    const clean = sourceNoteText.trim();
    if (clean.length < 5) {
      setTranslatedNoteText('');
      setTranslateError(null);
      setIsTranslating(false);
      return;
    }

    setIsTranslating(true);
    setTranslateError(null);
    const t = setTimeout(() => {
      void (async () => {
        try {
          const translated = await backendApi.translateNote(clean, targetLangCode, 'en');
          setTranslatedNoteText(translated);
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : 'Translation failed';
          setTranslatedNoteText('');
          setTranslateError(msg);
        } finally {
          setIsTranslating(false);
        }
      })();
    }, 600);
    return () => clearTimeout(t);
  }, [language, targetLangCode, sourceNoteText]);

  useEffect(() => {
    const fetchRecipients = async () => {
      if (!user?.email) {
        setLoadingRecipients(false);
        return;
      }
      try {
        const res = await backendApi.getRecipientsByEmail(user.email);
        const rows = res.data ?? [];
        setExistingRecipients(
          rows.map((r) => ({
            id: String(r.id),
            full_name: r.full_name,
            email: r.email,
            phone: r.phone,
            relationship: r.relationship,
          })),
        );
      } catch {
        setExistingRecipients([]);
      } finally {
        setLoadingRecipients(false);
      }
    };
    void fetchRecipients();
  }, [user?.email]);

  const validateStep = (target: Step): boolean => {
    if (target === 2) {
      if (!language.trim()) {
        Alert.alert('Language', 'Please select a language.');
        return false;
      }
      const minChars = 10;
      if (displayedNoteText.trim().length < minChars) {
        Alert.alert('Note too short', `Please write at least ${minChars} characters in your note.`);
        return false;
      }
      if (language !== 'English' && targetLangCode !== 'und' && !translatedNoteText.trim() && isTranslating) {
        Alert.alert('Translating', 'Please wait a moment for translation to finish.');
        return false;
      }
    }
    if (target === 3) {
      if (assignMode === 'existing') {
        if (!existingRecipientId) {
          Alert.alert('Recipient', 'Please choose an existing recipient.');
          return false;
        }
      } else {
        if (!newRecipientName.trim()) {
          Alert.alert('Recipient', 'Please enter recipient name.');
          return false;
        }
        if (!newRecipientPhone.trim()) {
          Alert.alert('Recipient', 'Please enter recipient mobile number.');
          return false;
        }
      }
    }
    return true;
  };

  const handleNext = () => {
    const next = Math.min(3, step + 1) as Step;
    if (!validateStep(next)) return;
    setStep(next);
  };

  const handleBack = () => setStep((s) => Math.max(1, s - 1) as Step);

  const selectedExistingRecipient =
    existingRecipients.find((r) => r.id === existingRecipientId) ?? null;

  const getFinalRecipientPreview = () => {
    if (assignMode === 'existing' && selectedExistingRecipient) {
      return {
        name: selectedExistingRecipient.full_name,
        email: selectedExistingRecipient.email || 'N/A',
        phone: selectedExistingRecipient.phone || 'N/A',
        relationship: selectedExistingRecipient.relationship || 'beneficiary',
        source: 'existing' as const,
      };
    }
    const dialCode = COUNTRY_DIAL_OPTIONS.find((c) => c.code === newRecipientCountry)?.dialCode ?? '';
    return {
      name: newRecipientName || 'N/A',
      email: newRecipientEmail || 'N/A',
      phone: `${dialCode}${newRecipientPhone}`.trim() || 'N/A',
      relationship: newRecipientRelationship || 'beneficiary',
      source: 'new' as const,
    };
  };

  const finalRecipient = getFinalRecipientPreview();
  const canContinue = useMemo(() => {
    if (step === 1) return displayedNoteText.trim().length >= 10 && !(language !== 'English' && isTranslating);
    if (step === 2) return validateStep(3);
    return true;
  }, [step, displayedNoteText, language, isTranslating, assignMode, existingRecipientId, newRecipientName, newRecipientPhone, newRecipientCountry, newRecipientEmail, newRecipientRelationship]);

  const handleFinalSave = async () => {
    if (!user?.email || !user?.id) {
      Alert.alert('Sign in required', 'Please sign in to continue.');
      return;
    }
    if (!validateStep(3)) return;

    setIsSaving(true);
    try {
      let recipientId: string | null = null;

      if (assignMode === 'existing') {
        recipientId = existingRecipientId;
      } else {
        const dial = COUNTRY_DIAL_OPTIONS.find((c) => c.code === newRecipientCountry)?.dialCode ?? '';
        const phone = `${dial}${newRecipientPhone}`.replace(/\s+/g, '');
        const addRes = await backendApi.addRecipient({
          user_email: user.email,
          full_name: sanitizeInput(newRecipientName).trim(),
          email: sanitizeInput(newRecipientEmail).trim() || undefined,
          phone: phone || undefined,
          relationship: sanitizeInput(newRecipientRelationship).trim() || 'beneficiary',
        });
        if (!addRes.success || !addRes.data?.id) {
          throw new Error(addRes.message || 'Failed to add recipient');
        }
        recipientId = String(addRes.data.id);
      }

      const now = new Date();
      const title = `Write a Note - ${language} - ${now.toLocaleDateString()}`;
      const finalText = language === 'English' ? sourceNoteText : (translatedNoteText || sourceNoteText);
      const cleanNote = sanitizeInput(finalText).trim();
      const metadataLines = [
        `Type: Note-based will`,
        `Language: ${sanitizeInput(language)}`,
        language !== 'English' ? `Translated: ${translatedNoteText ? 'yes' : 'no'}` : null,
        `Recipient: ${sanitizeInput(finalRecipient.name)}`,
        `Recipient source: ${finalRecipient.source}`,
        recipientId ? `Recipient ID: ${recipientId}` : null,
      ].filter(Boolean);

      const result = await backendApi.saveWill({
        user_email: user.email,
        title,
        transcript: cleanNote,
        content: cleanNote,
        notes: metadataLines.join(' | '),
        type: 'text',
      });

      if (!result.success) {
        throw new Error(result.message || 'Failed to save note will');
      }

      router.replace('/(app)/(tabs)/dashboard');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to save note will';
      Alert.alert('Error', msg);
    } finally {
      setIsSaving(false);
    }
  };

  const stepSubtitle =
    step === 1
      ? 'Select language and write your will as a note.'
      : step === 2
        ? 'Assign this note will to a recipient (existing or new).'
        : 'Review details and save your will.';

  return (
    <View style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => (step === 1 ? router.back() : handleBack())} style={styles.backWrap}>
          <Ionicons name="arrow-back" size={20} color={colors.mutedForeground} />
          <Text style={styles.back}>{step === 1 ? 'Back to Method Selection' : 'Back'}</Text>
        </Pressable>

        <View style={styles.progressRow}>
          {([1, 2, 3] as const).map((s, i) => (
            <View key={s} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={[
                  styles.stepDot,
                  s === step && styles.stepDotActive,
                  s < step && styles.stepDotDone,
                ]}
              >
                {s < step ? (
                  <Ionicons name="checkmark" size={18} color={colors.primaryForeground} />
                ) : (
                  <Text style={styles.stepDotText}>{s}</Text>
                )}
              </View>
              {i < 2 ? <View style={{ width: 16, height: 2, backgroundColor: colors.border, marginHorizontal: 4 }} /> : null}
            </View>
          ))}
        </View>

        <Text style={styles.title}>Write a Note</Text>
        <Text style={styles.subtitle}>{stepSubtitle}</Text>

        <View style={styles.card}>
          {step === 1 && (
            <>
              <Text style={styles.label}>Language</Text>
              <Pressable style={styles.selectBtn} onPress={() => setLangModal(true)}>
                <Text style={styles.selectBtnText}>{language}</Text>
                <Ionicons name="chevron-down" size={20} color={colors.mutedForeground} />
              </Pressable>
              <Text style={styles.label}>Write your note</Text>
              <TextInput
                style={[styles.textarea, { textAlign: languageAttrs.writingDirection === 'rtl' ? 'right' : 'left' }]}
                value={displayedNoteText}
                onChangeText={(t) => {
                  if (language === 'English') setSourceNoteText(t);
                  else setTranslatedNoteText(t);
                }}
                placeholder={`Write your will note in ${language}...`}
                placeholderTextColor={colors.mutedForeground}
                multiline
              />
              <Text style={styles.charCount}>{displayedNoteText.trim().length} characters</Text>

              {language !== 'English' && targetLangCode !== 'und' ? (
                <View style={styles.translateBox}>
                  <View style={styles.translateLabelRow}>
                    <Text style={styles.translateLabel}>Translation ({language})</Text>
                    {isTranslating ? <ActivityIndicator size="small" color={colors.gold} /> : null}
                  </View>
                  <Text style={styles.translateHint}>
                    {sourceNoteText.trim().length < 5
                        ? 'Type at least 5 characters to translate.'
                        : 'Translation happens automatically from your English text.'}
                  </Text>
                  {translateError ? <Text style={styles.translateError}>{translateError}</Text> : null}
                </View>
              ) : null}
            </>
          )}

          {step === 2 && (
            <>
              <View style={styles.modeRow}>
                <Pressable
                  style={[styles.modeCard, assignMode === 'existing' && styles.modeCardActive]}
                  onPress={() => setAssignMode('existing')}
                >
                  <Ionicons name="people" size={22} color={colors.gold} />
                  <Text style={styles.modeTitle}>Existing Recipient</Text>
                </Pressable>
                <Pressable
                  style={[styles.modeCard, assignMode === 'new' && styles.modeCardActive]}
                  onPress={() => setAssignMode('new')}
                >
                  <Ionicons name="person-add" size={22} color={colors.gold} />
                  <Text style={styles.modeTitle}>New Recipient</Text>
                </Pressable>
              </View>

              {assignMode === 'existing' ? (
                <>
                  {loadingRecipients ? (
                    <ActivityIndicator color={colors.gold} />
                  ) : existingRecipients.length === 0 ? (
                    <Text style={{ color: colors.mutedForeground }}>No recipients found. Choose &quot;New Recipient&quot;.</Text>
                  ) : (
                    <>
                      <Text style={styles.label}>Select recipient</Text>
                      {existingRecipients.map((r) => (
                        <Pressable
                          key={r.id}
                          style={[
                            styles.selectBtn,
                            existingRecipientId === r.id && { borderColor: colors.gold, backgroundColor: colors.gold + '12' },
                          ]}
                          onPress={() => setExistingRecipientId(r.id)}
                        >
                          <Text style={styles.selectBtnText}>
                            {r.full_name}
                            {r.email ? ` · ${r.email}` : ''}
                          </Text>
                          <Ionicons
                            name={existingRecipientId === r.id ? 'radio-button-on' : 'radio-button-off'}
                            size={22}
                            color={existingRecipientId === r.id ? colors.gold : colors.mutedForeground}
                          />
                        </Pressable>
                      ))}
                    </>
                  )}
                </>
              ) : (
                <>
                  <Text style={styles.label}>Recipient name</Text>
                  <TextInput
                    style={styles.input}
                    value={newRecipientName}
                    onChangeText={setNewRecipientName}
                    placeholder="Full name"
                    placeholderTextColor={colors.mutedForeground}
                  />
                  <Text style={styles.label}>Email (optional)</Text>
                  <TextInput
                    style={styles.input}
                    value={newRecipientEmail}
                    onChangeText={setNewRecipientEmail}
                    placeholder="email@example.com"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <Text style={styles.label}>Relationship</Text>
                  <TextInput
                    style={styles.input}
                    value={newRecipientRelationship}
                    onChangeText={setNewRecipientRelationship}
                    placeholder="beneficiary"
                    placeholderTextColor={colors.mutedForeground}
                  />
                  <Text style={styles.label}>Country</Text>
                  <Pressable style={styles.selectBtn} onPress={() => setCountryModal(true)}>
                    <Text style={styles.selectBtnText}>{countryLabel}</Text>
                    <Ionicons name="chevron-down" size={20} color={colors.mutedForeground} />
                  </Pressable>
                  <Text style={styles.label}>Mobile</Text>
                  <TextInput
                    style={styles.input}
                    value={newRecipientPhone}
                    onChangeText={setNewRecipientPhone}
                    placeholder="9876543210"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="phone-pad"
                  />
                </>
              )}
            </>
          )}

          {step === 3 && (
            <>
              <View style={styles.previewBlock}>
                <Text style={styles.previewLabel}>Language</Text>
                <Text style={styles.previewBody}>{language}</Text>
              </View>
              <View style={styles.previewBlock}>
                <Text style={styles.previewLabel}>Recipient</Text>
                <Text style={styles.previewBody}>{finalRecipient.name}</Text>
                <Text style={[styles.previewBody, { color: colors.mutedForeground }]}>{finalRecipient.email}</Text>
                <Text style={[styles.previewBody, { color: colors.mutedForeground }]}>{finalRecipient.phone}</Text>
              </View>
              <View style={styles.previewBlock}>
                <Text style={styles.previewLabel}>Note preview</Text>
                <Text style={styles.previewBody}>
                  {language === 'English' ? sourceNoteText : (translatedNoteText || sourceNoteText)}
                </Text>
              </View>
            </>
          )}

          <View style={styles.footerRow}>
            <Pressable
              style={styles.outlineBtn}
              onPress={() => (step === 1 ? router.back() : handleBack())}
              disabled={isSaving}
            >
              <Text style={styles.outlineBtnText}>{step === 1 ? 'Cancel' : 'Back'}</Text>
            </Pressable>
            {step < 3 ? (
              <Pressable
                style={[styles.primaryBtn, (!canContinue || isSaving) && styles.primaryBtnDisabled]}
                onPress={handleNext}
                disabled={!canContinue || isSaving}
              >
                <Text style={styles.primaryBtnText}>Continue</Text>
                <Ionicons name="arrow-forward" size={18} color={colors.goldForeground} />
              </Pressable>
            ) : (
              <Pressable
                style={[styles.primaryBtn, isSaving && styles.primaryBtnDisabled]}
                onPress={handleFinalSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color={colors.goldForeground} />
                ) : (
                  <Ionicons name="save-outline" size={18} color={colors.goldForeground} />
                )}
                <Text style={styles.primaryBtnText}>Save Will</Text>
              </Pressable>
            )}
          </View>
        </View>

        <View style={styles.secureRow}>
          <Ionicons name="shield-checkmark-outline" size={16} color={colors.mutedForeground} />
          <Text style={styles.secureText}>Your data is encrypted and secure</Text>
        </View>
      </ScrollView>

      <Modal visible={langModal} transparent animationType="slide" onRequestClose={() => setLangModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setLangModal(false)}>
          <Pressable style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Language</Text>
              <Pressable onPress={() => setLangModal(false)}>
                <Ionicons name="close" size={24} color={colors.foreground} />
              </Pressable>
            </View>
            <FlatList
              data={[...LANGUAGE_OPTIONS]}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.modalItem}
                  onPress={() => {
                    setLanguage(item);
                    setLangModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                </Pressable>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={countryModal} transparent animationType="slide" onRequestClose={() => setCountryModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setCountryModal(false)}>
          <Pressable style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Country</Text>
              <Pressable onPress={() => setCountryModal(false)}>
                <Ionicons name="close" size={24} color={colors.foreground} />
              </Pressable>
            </View>
            <FlatList
              data={COUNTRY_DIAL_OPTIONS}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.modalItem}
                  onPress={() => {
                    setNewRecipientCountry(item.code);
                    setCountryModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>
                    {item.name} ({item.dialCode})
                  </Text>
                </Pressable>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
