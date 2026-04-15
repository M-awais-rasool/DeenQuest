import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';

// --- Theme Constants ---
const COLORS = {
  surface: '#131313',
  surfaceDim: '#131313',
  surfaceBright: '#393939',
  surfaceContainer: '#1F1F1F',
  surfaceContainerLow: '#1B1B1B',
  surfaceContainerHigh: '#2A2A2A',
  surfaceContainerHighest: '#353535',
  primary: '#88D982',
  primaryContainer: '#2E7D32',
  onPrimary: '#003909',
  onPrimaryFixed: '#002204',
  secondaryContainer: '#FFDB3C',
  onSecondaryFixed: '#221B00',
  onSurface: '#E2E2E2',
  onSurfaceVariant: '#BFCABA',
  outline: '#8A9485',
  outlineVariant: '#40493D',
  error: '#FFB4AB',
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// --- Helper Components ---

const Icon = ({ name, size = 24, color = COLORS.onSurface, style = {}, fill = false }) => {
  return (
    <Text
      style={[
        {
          fontFamily: 'Material Symbols Outlined',
          fontSize: size,
          color: color,
          textAlign: 'center',
          fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
        },
        style,
      ]}
    >
      {name}
    </Text>
  );
};

const Badge = ({ label, color = COLORS.secondaryContainer, textColor = COLORS.onSecondaryFixed }) => (
  <View style={[styles.badge, { backgroundColor: color + '20', borderColor: color + '40' }]}>
    <Text style={[styles.badgeText, { color: color }]}>{label.toUpperCase()}</Text>
  </View>
);

const RewardBadge = ({ xp }) => (
  <View style={styles.rewardBadge}>
    <Icon name="stars" size={14} color={COLORS.secondaryContainer} fill />
    <Text style={styles.rewardBadgeText}>{xp} XP REWARD</Text>
  </View>
);

// --- Screens ---

const JourneyScreen = () => {
  const [step, setStep] = useState(1); // 1: Follow Sunnah, 2: Reflect

  if (step === 1) {
    return (
      <ScrollView contentContainerStyle={styles.screenContent}>
        <View style={styles.headerRow}>
          <Badge label="Character" color={COLORS.primary} />
          <RewardBadge xp={20} />
        </View>
        <Text style={styles.title}>Follow a Sunnah Today</Text>
        <Text style={styles.description}>
          Revive a tradition of the Prophet (ﷺ) and earn spiritual rewards through small, consistent actions.
        </Text>

        <TouchableOpacity style={styles.featuredCard}>
          <View style={styles.cardIconContainer}>
            <Icon name="mood" size={32} color={COLORS.primary} fill />
          </View>
          <Text style={styles.cardTitle}>Smile often</Text>
          <Text style={styles.cardDescription}>
            "Your smiling in the face of your brother is charity." A simple act that warms hearts and spreads peace.
          </Text>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: '33%' }]} />
          </View>
        </TouchableOpacity>

        <View style={styles.grid}>
          <TouchableOpacity style={styles.smallCard}>
            <View style={[styles.cardIconContainerSmall, { backgroundColor: COLORS.secondaryContainer + '10' }]}>
              <Icon name="restaurant" size={24} color={COLORS.secondaryContainer} />
            </View>
            <Text style={styles.smallCardTitle}>Eat with right hand</Text>
            <Text style={styles.smallCardDescription}>Embrace mindfulness and discipline during every meal.</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.smallCard}>
            <View style={[styles.cardIconContainerSmall, { backgroundColor: COLORS.primary + '10' }]}>
              <Icon name="auto_awesome" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.smallCardTitle}>Say Bismillah</Text>
            <Text style={styles.smallCardDescription}>Start every action with the name of Allah for barakah.</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.quoteCard}>
          <Icon name="format_quote" size={48} color={COLORS.onSurfaceVariant} style={styles.quoteIcon} />
          <Text style={styles.quoteText}>
            "The most beloved of deeds to Allah are those that are most consistent, even if they are small."
          </Text>
          <Text style={styles.quoteAuthor}>— SAHIH AL-BUKHARI</Text>
        </View>

        <Image
          source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCCSjbke-cdnUBYaZ8zEH76dzpf39qfTLWpZhECDyps91KPiAa4s9ABnQ0t6-UAgMa2GXrp8B8AO94JhppbSCfYwy7bMG2YYceDDbrxnykSxqM_HQnMHxmlUNqGHR1-Vultq1MKr_4u5gLIjpx1nYETcJra40DqB8PUGW89tcILNuiu6zZR7PwyMsBZCm_TfV0JaBCkxdE8ci739qBJy5fdZxBlQoFIOy59SIEX3fmVwXdGjcK8huf6jj3H28bmufqAxpiR11-eBqA' }}
          style={styles.moodImage}
        />

        <TouchableOpacity style={styles.primaryButton} onPress={() => setStep(2)}>
          <Icon name="check_circle" size={24} color={COLORS.onPrimary} fill />
          <Text style={styles.primaryButtonText}>Completed</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.screenContent}>
      <View style={styles.centerHeader}>
        <View style={styles.badgeContainer}>
          <Badge label="Daily Reflection" />
        </View>
        <Text style={styles.largeTitle}>Reflect on Your Day</Text>
        <Text style={styles.subtitle}>Did you help someone today?</Text>
      </View>

      <TouchableOpacity style={styles.reflectionCardPrimary}>
        <View style={styles.reflectionCardHeader}>
          <View>
            <Text style={styles.reflectionCardTitlePrimary}>Yes, Alhamdulillah</Text>
            <Text style={styles.reflectionCardDesc}>I found an opportunity to be of service.</Text>
          </View>
          <View style={styles.reflectionIconContainer}>
            <Icon name="volunteer_activism" size={32} color={COLORS.primary} fill />
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.grid}>
        <TouchableOpacity style={styles.reflectionCardSmall}>
          <View style={styles.smallIconCircle}>
            <Icon name="close" size={20} color={COLORS.onSurfaceVariant} />
          </View>
          <Text style={styles.smallCardTitle}>Not Today</Text>
          <Text style={styles.smallCardDescription}>The day passed without a specific moment.</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.reflectionCardSmall}>
          <View style={[styles.smallIconCircle, { backgroundColor: COLORS.secondaryContainer + '20' }]}>
            <Icon name="wb_sunny" size={20} color={COLORS.secondaryContainer} fill />
          </View>
          <Text style={[styles.smallCardTitle, { color: COLORS.secondaryContainer }]}>Will Try Tomorrow</Text>
          <Text style={styles.smallCardDescription}>Intending to be more mindful of others.</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.meterCard}>
        <View style={styles.meterHeader}>
          <View style={styles.meterTitleRow}>
            <Icon name="auto_awesome" size={20} color={COLORS.secondaryContainer} fill />
            <Text style={styles.meterTitle}>Barakah Meter</Text>
          </View>
          <Text style={styles.meterReward}>+10 XP Reward</Text>
        </View>
        <View style={styles.meterTrack}>
          <View style={[styles.meterFill, { width: '65%' }]} />
        </View>
        <View style={styles.meterFooter}>
          <Text style={styles.meterFooterText}>DAILY PROGRESS</Text>
          <Text style={[styles.meterFooterText, { color: COLORS.primary }]}>65% TO LEVEL UP</Text>
        </View>
      </View>

      <View style={styles.tipRow}>
        <Icon name="lightbulb" size={20} color={COLORS.primary} />
        <Text style={styles.tipText}>
          "The best of people are those who are most beneficial to people." — Prophet Muhammad (ﷺ)
        </Text>
      </View>
    </ScrollView>
  );
};

const QuranScreen = () => {
  const [step, setStep] = useState(1); // 1: Read, 2: Listen

  if (step === 1) {
    return (
      <ScrollView contentContainerStyle={styles.screenContent}>
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>CURRENT PROGRESS</Text>
            <Text style={styles.progressValue}>1/3</Text>
          </View>
          <View style={styles.meterTrack}>
            <View style={[styles.meterFill, { width: '33%' }]} />
          </View>
        </View>

        <View style={styles.infoCard}>
          <Icon name="menu_book" size={32} color={COLORS.primary} />
          <View style={styles.infoCardText}>
            <Text style={styles.infoCardTitle}>Surah Al-Ikhlas</Text>
            <Text style={styles.infoCardSub}>Chapter 112 • The Sincerity</Text>
          </View>
        </View>

        <View style={styles.ayahCard}>
          <View style={styles.ayahNumber}>
            <Text style={styles.ayahNumberText}>1</Text>
          </View>
          <Text style={styles.arabicText}>قُلْ هُوَ اللَّهُ أَحَدٌ</Text>
          <View style={styles.divider} />
          <Text style={styles.translationText}>Say, "He is Allah, [who is] One.</Text>
        </View>

        <View style={styles.ayahCard}>
          <View style={styles.ayahNumber}>
            <Text style={styles.ayahNumberText}>2</Text>
          </View>
          <Text style={styles.arabicText}>اللَّهُ الصَّمَدُ</Text>
          <View style={styles.divider} />
          <Text style={styles.translationText}>Allah, the Eternal Refuge.</Text>
        </View>

        <View style={[styles.ayahCard, { opacity: 0.6 }]}>
          <View style={styles.ayahNumber}>
            <Text style={styles.ayahNumberText}>3</Text>
          </View>
          <Text style={styles.arabicText}>لَمْ يَلِدْ وَلَمْ يُولَدْ</Text>
          <View style={styles.divider} />
          <Text style={styles.translationText}>He neither begets nor is born.</Text>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={() => setStep(2)}>
          <Icon name="check_circle" size={24} color={COLORS.onPrimary} fill />
          <Text style={styles.primaryButtonText}>Mark as Read</Text>
        </TouchableOpacity>
        <Text style={styles.footerHint}>COMPLETE READING TO CLAIM YOUR REWARD</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.screenContent}>
      <View style={styles.centerHeader}>
        <View style={styles.rewardBadgeContainer}>
          <RewardBadge xp={15} />
        </View>
        <Text style={styles.title}>Listen to Quran (5 min)</Text>
        <Text style={styles.subtitle}>Daily Spiritual Nourishment</Text>
      </View>

      <View style={styles.playerCard}>
        <View style={styles.albumArtContainer}>
          <View style={styles.progressRing}>
            {/* Simplified progress ring for web */}
            <View style={styles.albumArtWrapper}>
              <Image
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD3MeMtCVCFzmRCxaPCziJCTNgqGmUlKZdNPPgI_7RPoy6HuFTX_0gdh-SL3NfQItab4UvehTNpGIsHvWkZZagOo0CR_Gyn4ZIae8Umxq63OaXwW3tjk7ODHW3pKWGwPrQo2COhnX1ujudQndoCSd50O8SttTo6TyTDgCIrEj878wpnzDimT416XHgrQiIQc7Xiror6k5wRX9f6kkLSGSww17PTAUJ6qIFCBK-8ln_ElgpBUC1suUeYjOSSfkC6MNnG0JDp7gUdhGM' }}
                style={styles.albumArt}
              />
              <View style={styles.albumArtOverlay}>
                <Text style={styles.albumArtText}>القرآن</Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.playerTitle}>Surah Ar-Rahman</Text>
        <Text style={styles.playerArtist}>Mishary Rashid Alafasy</Text>

        <View style={styles.waveform}>
          {[0.2, 0.4, 0.6, 0.8, 1, 0.8, 0.6, 0.4, 0.2].map((h, i) => (
            <View key={i} style={[styles.waveBar, { height: h * 40, opacity: h }]} />
          ))}
        </View>

        <View style={styles.controls}>
          <TouchableOpacity>
            <Icon name="replay_10" size={32} color={COLORS.onSurfaceVariant} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.playButton}>
            <Icon name="play_arrow" size={48} color={COLORS.onPrimary} fill />
          </TouchableOpacity>
          <TouchableOpacity>
            <Icon name="forward_10" size={32} color={COLORS.onSurfaceVariant} />
          </TouchableOpacity>
        </View>

        <View style={styles.timeRow}>
          <Text style={styles.timeText}>1:42</Text>
          <Text style={[styles.timeText, { color: COLORS.primary }]}>5:00 GOAL</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <View style={styles.statIconCircle}>
            <Icon name="schedule" size={20} color={COLORS.primary} />
          </View>
          <View>
            <Text style={styles.statLabel}>REMAINING</Text>
            <Text style={styles.statValue}>3:18</Text>
          </View>
        </View>
        <View style={styles.statItem}>
          <View style={[styles.statIconCircle, { backgroundColor: COLORS.secondaryContainer + '20' }]}>
            <Icon name="local_fire_department" size={20} color={COLORS.secondaryContainer} />
          </View>
          <View>
            <Text style={styles.statLabel}>STREAK</Text>
            <Text style={styles.statValue}>12 Days</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const DhikrScreen = () => {
  const [count, setCount] = useState(12);
  const target = 33;

  return (
    <ScrollView contentContainerStyle={styles.screenContent}>
      <View style={styles.centerHeader}>
        <View style={styles.badgeContainer}>
          <Badge label="Dhikr" color={COLORS.primary} />
        </View>
        <Text style={styles.title}>Say Astaghfirullah 33 Times</Text>
        <Text style={styles.subtitle}>"I seek forgiveness from Allah"</Text>
      </View>

      <View style={styles.counterContainer}>
        <View style={styles.counterDisplay}>
          <Text style={styles.counterMain}>{count}</Text>
          <Text style={styles.counterTarget}>/ {target}</Text>
        </View>
        <View style={styles.meterTrackSmall}>
          <View style={[styles.meterFill, { width: `${(count / target) * 100}%` }]} />
        </View>

        <TouchableOpacity 
          style={styles.tapButton} 
          onPress={() => setCount(prev => Math.min(prev + 1, target))}
          activeOpacity={0.7}
        >
          <View style={styles.tapButtonInner}>
            <Icon name="touch_app" size={64} color={COLORS.surface} fill />
            <Text style={styles.tapButtonText}>TAP TO COUNT</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.virtueCard}>
        <View style={styles.virtueIconContainer}>
          <Icon name="auto_awesome" size={24} color={COLORS.primary} />
        </View>
        <View style={styles.virtueTextContainer}>
          <Text style={styles.virtueTitle}>The Virtue of Istighfar</Text>
          <Text style={styles.virtueDesc}>
            Continuous seeking of forgiveness opens the doors of mercy and increases your spiritual clarity.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const JournalScreen = () => {
  return (
    <ScrollView contentContainerStyle={styles.screenContent}>
      <View style={styles.headerRow}>
        <Badge label="Learning" />
        <RewardBadge xp={15} />
      </View>
      <Text style={styles.title}>Learn 1 Hadith</Text>

      <View style={styles.hadithCard}>
        <View style={styles.hadithIconBox}>
          <Icon name="auto_stories" size={32} color={COLORS.primary} fill />
        </View>
        <Text style={styles.arabicTextHadith}>إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ</Text>
        <Text style={styles.translationTextHadith}>"Actions are judged by intentions."</Text>
        <View style={styles.sourceRow}>
          <Text style={styles.sourceLabel}>Source:</Text>
          <Text style={styles.sourceValue}>Sahih al-Bukhari 1</Text>
        </View>
      </View>

      <View style={styles.reflectionCard}>
        <View style={styles.reflectionHeader}>
          <Icon name="lightbulb" size={24} color={COLORS.secondaryContainer} fill />
          <Text style={styles.reflectionTitle}>Wisdom & Reflection</Text>
        </View>
        <Text style={styles.reflectionBody}>
          Before any good deed, pause for a heartbeat. Ask yourself: "Am I doing this for the sake of the Divine or for the eyes of the world?" This Hadith teaches us that the spiritual weight of our journey is carried by our inner focus, not just the outer motion.
        </Text>
      </View>

      <View style={styles.locationCard}>
        <Image
          source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCHWmPONsXZPT14uh4ZREc1OMamoNN9tk_fm4oluxJr0aPvLlaDTDVr9IekvxGTc05nz3je6fdUVnQbLeys-TErSzR-64t8M8kjn3zZ_VooGBSO4oscRGqV48emIrNvJ-w9POTFs68EW1q7q4Oh0BlCdC9WuQPl9lTAUJWKTIxkih1VDq5dcUy5VYuavnAZN81w33MtHTBbGJnW87e1JfNSD_-jrnaqI71uK-p1KQT3LMCdHval4FjQhDSieR90WUbi7ZU6qV62xho' }}
          style={styles.locationImage}
        />
        <View style={styles.locationOverlay}>
          <Icon name="location_on" size={20} color={COLORS.primary} />
          <Text style={styles.locationText}>Al-Madinah Al-Munawwarah</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>I Understand</Text>
        <Icon name="check_circle" size={24} color={COLORS.onPrimary} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.shareButton}>
        <Icon name="share" size={20} color={COLORS.onSurfaceVariant} />
        <Text style={styles.shareButtonText}>Share Wisdom</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const QuizScreen = () => {
  return (
    <ScrollView contentContainerStyle={styles.screenContent}>
      <View style={styles.centerHeader}>
        <Text style={styles.badgeLabel}>LEARNING</Text>
        <Text style={styles.title}>Quick Islamic Quiz</Text>
        <View style={styles.quizProgress}>
          {[1, 0, 0, 0, 0].map((active, i) => (
            <View key={i} style={[styles.quizDot, active && styles.quizDotActive]} />
          ))}
        </View>
      </View>

      <View style={styles.questionCard}>
        <View style={styles.questionBadge}>
          <Text style={styles.questionBadgeText}>QUESTION 01</Text>
        </View>
        <Text style={styles.questionText}>What is the first pillar of Islam?</Text>
      </View>

      <View style={styles.optionsContainer}>
        <TouchableOpacity style={styles.optionButton}>
          <View style={styles.optionLetter}>
            <Text style={styles.optionLetterText}>A</Text>
          </View>
          <Text style={styles.optionText}>Salah</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionButtonActive}>
          <View style={styles.optionRow}>
            <View style={styles.optionLetterActive}>
              <Text style={styles.optionLetterTextActive}>B</Text>
            </View>
            <Text style={styles.optionTextActive}>Shahada</Text>
          </View>
          <Icon name="check" size={20} color={COLORS.surface} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionButton}>
          <View style={styles.optionLetter}>
            <Text style={styles.optionLetterText}>C</Text>
          </View>
          <Text style={styles.optionText}>Zakat</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.potentialReward}>
        <Icon name="stars" size={32} color={COLORS.primary} fill />
        <View>
          <Text style={styles.potentialRewardLabel}>POTENTIAL REWARD</Text>
          <Text style={styles.potentialRewardValue}>+15 XP</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>Next Question</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// --- Main App ---

export function TaskScreen() {
  const [activeTab, setActiveTab] = useState('journey');

  const renderScreen = () => {
    switch (activeTab) {
      case 'journey': return <JourneyScreen />;
      case 'quran': return <QuranScreen />;
      case 'dhikr': return <DhikrScreen />;
      case 'journal': return <JournalScreen />;
      case 'quiz': return <QuizScreen />;
      default: return <JourneyScreen />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Top Header */}
      <View style={styles.topNav}>
        <View style={styles.topNavLeft}>
          <View style={styles.profileCircle}>
            <Image
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAOS5H2LtjbotqFU8ZCu-cKuwz7mXCA1bQU2_WvbluKIOL_9gv_gqVSOzvsLqgI0AYWdpZLeeE-n7rwrZrx8pDW7qCzZ1UOYbOPOzaqgERAOFMWfn6qUZ6z0D98RvCLv419NHzVVJKFUVz_dHFxMr1p2fffNlJKEvh4EH1559dsFSVsfRfjHxHgJvnYWX39C1YcVkH5laNy0wKh37IPys7i3js_j_oV9d6SqAVn8N77PgOJfrbieuR7kakMXs2LRn0VdNgXDUBSwjE' }}
              style={styles.profileImage}
            />
          </View>
          <Text style={styles.appName}>Al-Musafir</Text>
        </View>
        <TouchableOpacity style={styles.settingsButton}>
          <Icon name="settings" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.main}>
        {renderScreen()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
    width: '100%',
    height: '100%',
  },
  topNav: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.surface + '99',
    // @ts-ignore
    backdropFilter: 'blur(20px)',
    zIndex: 100,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primary + '10',
  },
  topNavLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  profileCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  appName: {
    fontFamily: 'Lexend',
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  settingsButton: {
    padding: SPACING.sm,
  },
  main: {
    flex: 1,
  },
  screenContent: {
    padding: SPACING.lg,
    paddingBottom: 120,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 99,
    borderWidth: 1,
  },
  badgeText: {
    fontFamily: 'Lexend',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.secondaryContainer + '10',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
  },
  rewardBadgeText: {
    fontFamily: 'Lexend',
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.secondaryContainer,
  },
  title: {
    fontFamily: 'Lexend',
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.onSurface,
    marginBottom: SPACING.sm,
    letterSpacing: -0.5,
  },
  description: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 16,
    color: COLORS.onSurfaceVariant,
    marginBottom: SPACING.xl,
    lineHeight: 24,
  },
  featuredCard: {
    backgroundColor: COLORS.surfaceContainer,
    padding: SPACING.lg,
    borderRadius: 16,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant + '20',
  },
  cardIconContainer: {
    width: 56,
    height: 56,
    backgroundColor: COLORS.primary + '10',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
  },
  cardTitle: {
    fontFamily: 'Lexend',
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.onSurface,
    marginBottom: SPACING.sm,
  },
  cardDescription: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  grid: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  smallCard: {
    flex: 1,
    backgroundColor: COLORS.surfaceContainerLow,
    padding: SPACING.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant + '10',
  },
  cardIconContainerSmall: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  smallCardTitle: {
    fontFamily: 'Lexend',
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.onSurface,
    marginBottom: 4,
  },
  smallCardDescription: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    lineHeight: 16,
  },
  quoteCard: {
    backgroundColor: COLORS.surfaceContainerLow,
    padding: SPACING.xl,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.secondaryContainer,
    marginBottom: SPACING.xl,
    position: 'relative',
    overflow: 'hidden',
  },
  quoteIcon: {
    position: 'absolute',
    top: 0,
    right: 0,
    opacity: 0.1,
    transform: [{ scale: 2 }],
  },
  quoteText: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 18,
    fontStyle: 'italic',
    color: COLORS.onSurface,
    lineHeight: 28,
    marginBottom: SPACING.md,
  },
  quoteAuthor: {
    fontFamily: 'Lexend',
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.secondaryContainer,
    letterSpacing: 1,
  },
  moodImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    marginBottom: SPACING.xl,
    opacity: 0.6,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    height: 64,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    shadowColor: COLORS.primaryContainer,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  primaryButtonText: {
    fontFamily: 'Lexend',
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.onPrimary,
  },
  centerHeader: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  badgeContainer: {
    marginBottom: SPACING.md,
  },
  largeTitle: {
    fontFamily: 'Lexend',
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.onSurface,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 18,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
  },
  reflectionCardPrimary: {
    backgroundColor: COLORS.surfaceContainer,
    padding: SPACING.lg,
    borderRadius: 16,
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  reflectionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  reflectionCardTitlePrimary: {
    fontFamily: 'Lexend',
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  reflectionCardDesc: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    fontWeight: '500',
  },
  reflectionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reflectionCardSmall: {
    flex: 1,
    backgroundColor: COLORS.surfaceContainerLow,
    padding: SPACING.lg,
    borderRadius: 16,
  },
  smallIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  meterCard: {
    backgroundColor: COLORS.surfaceContainerLow,
    padding: SPACING.lg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant + '20',
    marginBottom: SPACING.lg,
  },
  meterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  meterTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  meterTitle: {
    fontFamily: 'Lexend',
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  meterReward: {
    fontFamily: 'Lexend',
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  meterTrack: {
    height: 12,
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  meterFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 6,
  },
  meterFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  meterFooterText: {
    fontFamily: 'Lexend',
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1,
  },
  tipRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    backgroundColor: COLORS.primary + '05',
    padding: SPACING.md,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  tipText: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    fontStyle: 'italic',
    flex: 1,
  },
  progressSection: {
    marginBottom: SPACING.xl,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: SPACING.sm,
  },
  progressLabel: {
    fontFamily: 'Lexend',
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1,
  },
  progressValue: {
    fontFamily: 'Lexend',
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.surfaceContainerLow,
    padding: SPACING.lg,
    borderRadius: 16,
    marginBottom: SPACING.lg,
  },
  infoCardText: {
    flex: 1,
  },
  infoCardTitle: {
    fontFamily: 'Lexend',
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  infoCardSub: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
  },
  ayahCard: {
    backgroundColor: COLORS.surfaceContainer,
    padding: SPACING.xl,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary + '40',
    marginBottom: SPACING.md,
  },
  ayahNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  ayahNumberText: {
    fontFamily: 'Lexend',
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.onSurfaceVariant,
  },
  arabicText: {
    fontFamily: 'Amiri',
    fontSize: 32,
    color: COLORS.onSurface,
    textAlign: 'right',
    marginBottom: SPACING.lg,
    lineHeight: 56,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.outlineVariant + '30',
    marginBottom: SPACING.lg,
  },
  translationText: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    fontStyle: 'italic',
  },
  footerHint: {
    fontFamily: 'Lexend',
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
    marginTop: SPACING.md,
    letterSpacing: 1,
  },
  rewardBadgeContainer: {
    marginBottom: SPACING.md,
  },
  playerCard: {
    backgroundColor: COLORS.surfaceContainerLow,
    padding: SPACING.xl,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  albumArtContainer: {
    marginBottom: SPACING.xl,
  },
  progressRing: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 6,
    borderColor: COLORS.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  albumArtWrapper: {
    width: 210,
    height: 210,
    borderRadius: 105,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: COLORS.surfaceContainerHigh,
  },
  albumArt: {
    width: '100%',
    height: '100%',
  },
  albumArtOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  albumArtText: {
    fontFamily: 'Amiri',
    fontSize: 48,
    color: COLORS.primary,
    opacity: 0.2,
  },
  playerTitle: {
    fontFamily: 'Lexend',
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.onSurface,
    marginBottom: 4,
  },
  playerArtist: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 64,
    marginVertical: SPACING.xl,
  },
  waveBar: {
    width: 6,
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 40,
    marginBottom: SPACING.xl,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primaryContainer,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: SPACING.md,
  },
  timeText: {
    fontFamily: 'Lexend',
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  statItem: {
    flex: 1,
    backgroundColor: COLORS.surfaceContainer,
    padding: SPACING.md,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  statIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: {
    fontFamily: 'Lexend',
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1,
  },
  statValue: {
    fontFamily: 'Lexend',
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  counterContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  counterDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: SPACING.md,
  },
  counterMain: {
    fontFamily: 'Lexend',
    fontSize: 72,
    fontWeight: '900',
    color: COLORS.primary,
  },
  counterTarget: {
    fontFamily: 'Lexend',
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
  },
  meterTrackSmall: {
    width: 200,
    height: 6,
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: SPACING.xxl,
  },
  tapButton: {
    width: 224,
    height: 224,
    borderRadius: 112,
    padding: 4,
    borderWidth: 4,
    borderColor: COLORS.primary + '30',
  },
  tapButtonInner: {
    flex: 1,
    borderRadius: 108,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primaryContainer,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  tapButtonText: {
    fontFamily: 'Lexend',
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.surface,
    marginTop: 8,
  },
  virtueCard: {
    backgroundColor: COLORS.surfaceContainerLow,
    padding: SPACING.lg,
    borderRadius: 16,
    flexDirection: 'row',
    gap: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary + '10',
  },
  virtueIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  virtueTextContainer: {
    flex: 1,
  },
  virtueTitle: {
    fontFamily: 'Lexend',
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.onSurface,
    marginBottom: 4,
  },
  virtueDesc: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    lineHeight: 20,
  },
  hadithCard: {
    backgroundColor: COLORS.surfaceContainer,
    padding: SPACING.xl,
    borderRadius: 16,
    marginBottom: SPACING.lg,
  },
  hadithIconBox: {
    width: 56,
    height: 56,
    backgroundColor: COLORS.primary + '10',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
  },
  arabicTextHadith: {
    fontFamily: 'Amiri',
    fontSize: 36,
    color: COLORS.onSurface,
    textAlign: 'right',
    marginBottom: SPACING.xl,
    lineHeight: 64,
  },
  translationTextHadith: {
    fontFamily: 'Lexend',
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.onSurface,
    lineHeight: 28,
    marginBottom: SPACING.md,
  },
  sourceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sourceLabel: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
  },
  sourceValue: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
  },
  reflectionCard: {
    backgroundColor: COLORS.surfaceContainerLow,
    padding: SPACING.lg,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.secondaryContainer,
    marginBottom: SPACING.lg,
  },
  reflectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  reflectionTitle: {
    fontFamily: 'Lexend',
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.secondaryContainer,
  },
  reflectionBody: {
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    lineHeight: 22,
    fontWeight: '500',
  },
  locationCard: {
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: SPACING.xl,
  },
  locationImage: {
    width: '100%',
    height: '100%',
  },
  locationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationText: {
    fontFamily: 'Lexend',
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: SPACING.lg,
  },
  shareButtonText: {
    fontFamily: 'Lexend',
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
  },
  badgeLabel: {
    fontFamily: 'Lexend',
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 2,
    marginBottom: 8,
  },
  quizProgress: {
    flexDirection: 'row',
    gap: 12,
    marginTop: SPACING.md,
  },
  quizDot: {
    width: 32,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.surfaceContainerHighest,
  },
  quizDotActive: {
    backgroundColor: COLORS.primary,
  },
  questionCard: {
    backgroundColor: COLORS.surfaceContainerLow,
    padding: SPACING.xl,
    borderRadius: 16,
    marginBottom: SPACING.xl,
  },
  questionBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 99,
    alignSelf: 'flex-start',
    marginBottom: SPACING.md,
  },
  questionBadgeText: {
    fontFamily: 'Lexend',
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
  questionText: {
    fontFamily: 'Lexend',
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.onSurface,
    lineHeight: 28,
  },
  optionsContainer: {
    gap: SPACING.md,
    marginBottom: SPACING.xxl,
  },
  optionButton: {
    backgroundColor: COLORS.surfaceContainer,
    padding: SPACING.lg,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
  },
  optionLetter: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLetterText: {
    fontFamily: 'Lexend',
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
  },
  optionText: {
    fontFamily: 'Lexend',
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
  },
  optionButtonActive: {
    backgroundColor: COLORS.primary + '10',
    padding: SPACING.lg,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primaryContainer,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
  },
  optionLetterActive: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLetterTextActive: {
    fontFamily: 'Lexend',
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.surface,
  },
  optionTextActive: {
    fontFamily: 'Lexend',
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.primary,
  },
  potentialReward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    backgroundColor: COLORS.surfaceContainerHighest + '50',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant + '30',
    marginBottom: SPACING.xl,
  },
  potentialRewardLabel: {
    fontFamily: 'Lexend',
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.onSurfaceVariant,
    letterSpacing: 1,
  },
  potentialRewardValue: {
    fontFamily: 'Lexend',
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
  },
  bottomNav: {
    height: 96,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: COLORS.surface + '99',
    // @ts-ignore
    backdropFilter: 'blur(20px)',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingBottom: 20,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.sm,
  },
  navIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  navIconContainerActive: {
    backgroundColor: COLORS.primary,
    transform: [{ translateY: -12 }],
    shadowColor: COLORS.primaryContainer,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  navLabel: {
    fontFamily: 'Lexend',
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.onSurface + '66',
    letterSpacing: 1,
  },
  navLabelActive: {
    color: COLORS.primary,
  },
});
