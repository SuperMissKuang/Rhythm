import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import {
  useFonts,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
} from '@expo-google-fonts/montserrat';
import { useAppTheme } from '@/utils/theme';
import { MessageSquare, Check } from 'lucide-react-native';
import { useNotificationStore } from '@/utils/stores/useNotificationStore';
import Toast from 'react-native-toast-message';

export default function MessageTemplatesScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();

  const settings = useNotificationStore((state) => state.settings);
  const saveSettings = useNotificationStore((state) => state.saveSettings);
  const getMessageTemplate = useNotificationStore((state) => state.getMessageTemplate);

  const [userName, setUserName] = useState('');
  const [selectedTone, setSelectedTone] = useState('casual');
  const [isSaving, setIsSaving] = useState(false);

  const [fontsLoaded] = useFonts({
    Montserrat_500Medium,
    Montserrat_600SemiBold,
  });

  useEffect(() => {
    if (settings) {
      setUserName(settings.userName || '');
      setSelectedTone(settings.messageTone || 'casual');
    }
  }, [settings]);

  if (!fontsLoaded) {
    return null;
  }

  const tones = [
    {
      id: 'casual',
      label: 'Casual',
      description: 'Friendly and relaxed',
      color: '#F472B6',
      bgColor: '#FCE7F3',
    },
    {
      id: 'proper',
      label: 'Proper',
      description: 'Professional and polite',
      color: '#8B5CF6',
      bgColor: '#EDE9FE',
    },
    {
      id: 'playful',
      label: 'Playful',
      description: 'Fun and lighthearted',
      color: '#F59E0B',
      bgColor: '#FEF3C7',
    },
  ];

  const handleSave = async () => {
    if (!userName.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Name Required',
        text2: 'Please enter your name for the messages',
      });
      return;
    }

    setIsSaving(true);
    const result = await saveSettings({
      ...settings,
      userName: userName.trim(),
      messageTone: selectedTone,
    });

    setIsSaving(false);

    if (result.success) {
      Toast.show({
        type: 'success',
        text1: 'Saved!',
        text2: 'Your message templates have been updated',
      });
    } else {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to save settings. Please try again.',
      });
    }
  };

  const previewName = userName.trim() || 'Your Name';
  const lutealMessage = getMessageTemplate(selectedTone, 'luteal', previewName);
  const periodMessage = getMessageTemplate(selectedTone, 'period', previewName);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Message Templates',
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.primary,
          headerTitleStyle: {
            fontFamily: 'Montserrat_600SemiBold',
          },
        }}
      />
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: insets.bottom + 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* User Name Input */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 16,
              fontFamily: 'Montserrat_600SemiBold',
              color: colors.primary,
              marginBottom: 8,
            }}
          >
            Your Name *
          </Text>
          <Text
            style={{
              fontSize: 13,
              fontFamily: 'Montserrat_500Medium',
              color: colors.secondary,
              marginBottom: 12,
              lineHeight: 18,
            }}
          >
            This name will appear in messages sent to your contacts
          </Text>
          <TextInput
            value={userName}
            onChangeText={setUserName}
            placeholder="e.g., Sarah"
            placeholderTextColor={colors.placeholder}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 16,
              fontSize: 16,
              fontFamily: 'Montserrat_500Medium',
              color: colors.primary,
              borderWidth: 1,
              borderColor: colors.borderLight,
            }}
          />
        </View>

        {/* Message Tone Selector */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 16,
              fontFamily: 'Montserrat_600SemiBold',
              color: colors.primary,
              marginBottom: 8,
            }}
          >
            Message Tone
          </Text>
          <Text
            style={{
              fontSize: 13,
              fontFamily: 'Montserrat_500Medium',
              color: colors.secondary,
              marginBottom: 12,
              lineHeight: 18,
            }}
          >
            Choose the style of your notification messages
          </Text>

          <View style={{ gap: 12 }}>
            {tones.map((tone) => (
              <TouchableOpacity
                key={tone.id}
                onPress={() => setSelectedTone(tone.id)}
                activeOpacity={0.7}
                style={{
                  backgroundColor:
                    selectedTone === tone.id ? tone.bgColor : colors.surface,
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 2,
                  borderColor:
                    selectedTone === tone.id ? tone.color : colors.borderLight,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                {/* Icon */}
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: tone.bgColor,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}
                >
                  {selectedTone === tone.id ? (
                    <Check size={20} color={tone.color} />
                  ) : (
                    <MessageSquare size={20} color={tone.color} />
                  )}
                </View>

                {/* Content */}
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontFamily: 'Montserrat_600SemiBold',
                      color: colors.primary,
                      marginBottom: 2,
                    }}
                  >
                    {tone.label}
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: 'Montserrat_500Medium',
                      color: colors.secondary,
                    }}
                  >
                    {tone.description}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Message Preview */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 16,
              fontFamily: 'Montserrat_600SemiBold',
              color: colors.primary,
              marginBottom: 8,
            }}
          >
            Preview
          </Text>
          <Text
            style={{
              fontSize: 13,
              fontFamily: 'Montserrat_500Medium',
              color: colors.secondary,
              marginBottom: 12,
              lineHeight: 18,
            }}
          >
            How your messages will look
          </Text>

          {/* Luteal Phase Preview */}
          <View
            style={{
              backgroundColor: '#FEF3C7',
              borderRadius: 16,
              padding: 16,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: '#FDE68A',
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontFamily: 'Montserrat_600SemiBold',
                color: '#92400E',
                marginBottom: 8,
              }}
            >
              LUTEAL PHASE
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Montserrat_500Medium',
                color: colors.primary,
                lineHeight: 20,
              }}
            >
              {lutealMessage}
            </Text>
          </View>

          {/* Period Preview */}
          <View
            style={{
              backgroundColor: '#FCE7F3',
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: '#FBCFE8',
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontFamily: 'Montserrat_600SemiBold',
                color: '#9F1239',
                marginBottom: 8,
              }}
            >
              PERIOD
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontFamily: 'Montserrat_500Medium',
                color: colors.primary,
                lineHeight: 20,
              }}
            >
              {periodMessage}
            </Text>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={!userName.trim() || isSaving}
          activeOpacity={0.7}
          style={{
            backgroundColor:
              !userName.trim() || isSaving ? colors.borderLight : '#8B5CF6',
            borderRadius: 16,
            padding: 16,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontFamily: 'Montserrat_600SemiBold',
              color:
                !userName.trim() || isSaving ? colors.secondary : '#FFFFFF',
            }}
          >
            {isSaving ? 'Saving...' : 'Save Templates'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
