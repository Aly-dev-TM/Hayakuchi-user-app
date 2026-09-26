import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Modal,
  Share,
  Alert,
  StatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
  Feather,
} from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = '@hayakuchi_favorites';

// Local dataset import with fallback
let localTwistersData = [];
try {
  localTwistersData = require('./data/twisters.json');
} catch (e) {
  localTwistersData = [
    {
      id: 'twister_101',
      difficulty: 'easy',
      level: 'N5',
      japanese: '東京特許許可局',
      hiragana: 'とうきょうとっきょきょかきょく',
      romaji: 'Tōkyō tokkyo kyokakyoku',
      translation_tm: 'Tokio patent rugsat beriş edarasy.',
      audio_text: 'とうきょうとっきょきょかきょく',
    },
    {
      id: 'twister_102',
      difficulty: 'medium',
      level: 'N4',
      japanese: '生麦生米生卵',
      hiragana: 'なまむぎ なまごめ なまたまご',
      romaji: 'Namamugi namagome namatamago',
      translation_tm: 'Çig arpa, çig tüwi, çig ýumurtga.',
      audio_text: 'なまむぎなまごめなまたまご',
    },
    {
      id: 'twister_103',
      difficulty: 'hard',
      level: 'N3',
      japanese: '隣の客はよく柿食う客だ',
      hiragana: 'となり の きゃく は よく かき くう きゃく だ',
      romaji: 'Tonari no kyaku wa yoku kaki kuu kyaku da',
      translation_tm: 'Goňşy myhman köp hurma iýýän myhmandyr.',
      audio_text: 'となり の きゃく は よく かき くう きゃく だ',
    },
    {
      id: 'twister_104',
      difficulty: 'hard',
      level: 'N2',
      japanese: '赤巻紙青巻紙黄巻紙',
      hiragana: 'あかまきがみ あおまきがみ きまきがみ',
      romaji: 'Akamakigami aomakigami kimakigami',
      translation_tm: 'Gyzyl kagyzyň oýny, gök kagyzyň oýny, sary kagyzyň oýny.',
      audio_text: 'あかまきがみあおまきがみきまきがみ',
    },
    {
      id: 'twister_105',
      difficulty: 'hard',
      level: 'N1',
      japanese: '柔軟な思考で課題の克服に取り組む',
      hiragana: 'じゅうなんな しこうで かだいの こくふくに とりくむ',
      romaji: 'Jūnan na shikō de kadai no kokufuku ni torikumu',
      translation_tm: 'Çeýe pikirlenmek bilen kynçylyklary ýeňip geçmäge çalyşmak.',
      audio_text: 'じゅうなんなしこうでかだいのこくふくにとりくむ',
    },
  ];
}

const DARK_COLORS = {
  canvas: '#0D0F12',
  surface: '#161B22',
  surfaceBorder: '#30363D',
  primaryAccent: '#E63946',
  secondaryAccent: '#D4AF37',
  textPrimary: '#F0F6FC',
  textSubtext: '#8B949E',
  hiraganaText: '#FF7B72',
  buttonBg: '#21262D',
  overlay: 'rgba(0,0,0,0.85)',
};

const LIGHT_COLORS = {
  canvas: '#F4F4F0',
  surface: '#FFFFFF',
  surfaceBorder: '#E1E4E8',
  primaryAccent: '#D90429',
  secondaryAccent: '#C99700',
  textPrimary: '#1F242C',
  textSubtext: '#68707A',
  hiraganaText: '#E63946',
  buttonBg: '#F3F4F6',
  overlay: 'rgba(0,0,0,0.6)',
};

const DIFFICULTY_FILTERS = [
  { id: 'ALL', label_tm: 'ÄHLISI', label_jp: 'すべて' },
  { id: 'easy', label_tm: 'AŇSAT', label_jp: '易しい' },
  { id: 'medium', label_tm: 'ORTA', label_jp: '普通' },
  { id: 'hard', label_tm: 'KYN', label_jp: '難しい' },
  { id: 'FAVORITES', label_tm: 'HALANLARYM ❤️', label_jp: 'お気に入り' },
];

const JLPT_LEVELS = ['ÄHLISI', 'N5', 'N4', 'N3', 'N2', 'N1'];

const TwisterCard = React.memo(
  ({
    item,
    isPlaying,
    isFavorite,
    onPlay,
    onStop,
    onToggleFavorite,
    onShare,
    colors,
    styles,
  }) => {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.badgeGroup}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>{item.level}</Text>
            </View>
            <View style={styles.difficultyBadge}>
              <Text style={styles.difficultyBadgeText}>
                {item.difficulty === 'easy'
                  ? 'AŇSAT / 易しい'
                  : item.difficulty === 'medium'
                  ? 'ORTA / 普通'
                  : 'KYN / 難しい'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onToggleFavorite(item.id)}
            style={styles.favoriteButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={24}
              color={isFavorite ? colors.primaryAccent : colors.textSubtext}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.kanjiText} selectable={true}>
            {item.japanese}
          </Text>
          <Text style={styles.hiraganaText}>{item.hiragana}</Text>
          <Text style={styles.romajiText}>{item.romaji}</Text>
          <View style={styles.divider} />
          <Text style={styles.turkmenText}>{item.translation_tm}</Text>
        </View>

        <View style={styles.cardFooter}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.audioButton,
              isPlaying && styles.audioButtonActive,
            ]}
            onPress={() => (isPlaying ? onStop() : onPlay(item))}
          >
            <Ionicons
              name={isPlaying ? 'square' : 'play'}
              size={18}
              color="#FFF"
            />
            <Text style={styles.audioButtonText}>
              {isPlaying ? 'DURUZ / 停止' : 'AI SESI / 音声再生'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.actionIconButton}
            onPress={() => onShare(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="share-2" size={20} color={colors.textSubtext} />
          </TouchableOpacity>
        </View>
      </View>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.item.id === nextProps.item.id &&
      prevProps.isPlaying === nextProps.isPlaying &&
      prevProps.isFavorite === nextProps.isFavorite &&
      prevProps.colors === nextProps.colors
    );
  }
);

export default function App() {
  const [selectedDifficulty, setSelectedDifficulty] = useState('ALL');
  const [selectedLevel, setSelectedLevel] = useState('ÄHLISI');
  const [favorites, setFavorites] = useState([]);
  const [currentPlayingId, setCurrentPlayingId] = useState(null);
  
  // Kesgitli san bahaly ses tizligi state-i
  const [speechSpeed, setSpeechSpeed] = useState(1.25); 
  // Speech tizligini React state-den garaşsyz hem dessine okamak üçin ref
  const speechSpeedRef = useRef(1.25);
  const speechSessionRef = useRef(0);
  
  const [isDarkMode, setIsDarkMode] = useState(true);
  const themeColors = isDarkMode ? DARK_COLORS : LIGHT_COLORS;
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  const styles = useMemo(() => getDynamicStyles(themeColors), [themeColors]);

  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const storedFavorites = await AsyncStorage.getItem(FAVORITES_KEY);
        if (storedFavorites !== null) {
          setFavorites(JSON.parse(storedFavorites));
        }
      } catch (error) {
        console.error("Halanlarym ýüklenende ýalňyşlyk:", error);
      }
    };
    loadFavorites();

    return () => {
      speechSessionRef.current += 1;
      Speech.stop();
    };
  }, []);

  const handleStopAudio = useCallback(async () => {
    speechSessionRef.current += 1;

    try {
      await Speech.stop();
    } catch (e) {
      // Speech eýýäm duruzylan bolsa, dowam edýäris.
    }

    setCurrentPlayingId(null);
  }, []);

  const handleSpeechSpeedChange = useCallback((speed) => {
    // State-i hem, ref-i hem şol bir wagtda täzeleýäris.
    // Şeýlelikde täze saýlanan tizlik indiki speak() üçin köne closure-da galmaýar.
    speechSpeedRef.current = speed;
    setSpeechSpeed(speed);

    // Häzirki speech täze tizlik bilen garyşmaz ýaly duruzýarys.
    speechSessionRef.current += 1;
    Speech.stop().catch(() => {});
    setCurrentPlayingId(null);
  }, []);

  const handlePlayAudio = useCallback(
    async (item) => {
      const sessionId = ++speechSessionRef.current;
      const selectedSpeed = speechSpeedRef.current;
      const textToSpeak = item.audio_text || item.hiragana || item.japanese;

      try {
        // Öňki native speech session-y doly ýatyr.
        await Speech.stop();

        // Android/iOS native TTS köne utterance-y queue-dan aýyrýança
        // gysga garaşma täze rate-iň öňki rate bilen garyşmagynyň öňüni alýar.
        await new Promise((resolve) => setTimeout(resolve, 80));

        // Bu aralykda başga speech başlanan bolsa, köne request-i goýber.
        if (sessionId !== speechSessionRef.current) return;

        setCurrentPlayingId(item.id);

        const options = {
          language: 'ja-JP',
          rate: selectedSpeed,
          pitch: 1.0,
          onDone: () => {
            if (sessionId === speechSessionRef.current) {
              setCurrentPlayingId(null);
            }
          },
          onError: () => {
            if (sessionId === speechSessionRef.current) {
              setCurrentPlayingId(null);
            }
          },
          onStopped: () => {
            if (sessionId === speechSessionRef.current) {
              setCurrentPlayingId(null);
            }
          },
        };

        Speech.speak(textToSpeak, options);
      } catch (err) {
        if (sessionId === speechSessionRef.current) {
          Alert.alert('Nätanyş säwlik', 'Sesi diňletmekde säwlik ýüze çykdy.');
          setCurrentPlayingId(null);
        }
      }
    },
    []
  );


  const handleToggleFavorite = useCallback((id) => {
    setFavorites((prev) => {
      const updatedFavorites = prev.includes(id) 
        ? prev.filter((favId) => favId !== id) 
        : [...prev, id];
        
      AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites))
        .catch(err => console.error("Saklamakda säwlik:", err));
        
      return updatedFavorites;
    });
  }, []);

  const handleShareItem = useCallback((item) => {
    const message = `🇯🇵 早口言葉 (Hayakuchi): ${item.japanese}\n🗣 ${item.hiragana}\n🔤 ${item.romaji}\n\n🇹🇲 Türkmençe: ${item.translation_tm}\n\n✨ Hayakuchi Ýapon Dili Programmasy`;
    Share.share({ message });
  }, []);
  
  const handleShareApp = useCallback(() => {
    const message = `🇯🇵 Hayakuchi Kotoba (早口言葉)\nÝapon dilinde çalt we dogry gürlemegi öwrenmek üçin ajaýyp dil üçin ýöritelesdirilen programmadyr!\n\n✨ Öwren. Kämilleş. Paýlaş.`;
    Share.share({ message });
  }, []);

  const handleResetRAM = useCallback(async () => {
    Speech.stop();
    setCurrentPlayingId(null);
    setFavorites([]);
    setSelectedDifficulty('ALL');
    setSelectedLevel('ÄHLISI');
    speechSpeedRef.current = 1.25;
    setSpeechSpeed(1.25);
    
    try {
      await AsyncStorage.removeItem(FAVORITES_KEY);
    } catch (e) {
      console.error(e);
    }
    
    Alert.alert(
      'RAM Arassalandy / キャッシュ消去',
      'Programmanyň wagtlaýyn ýady, halanlaryňyz we ähli sazlamalar üstünlikli başky ýagdaýyna (default) getirildi.'
    );
  }, []);

  const filteredTwisters = useMemo(() => {
    return localTwistersData.filter((item) => {
      if (selectedDifficulty === 'FAVORITES') {
        if (!favorites.includes(item.id)) return false;
      } else if (
        selectedDifficulty !== 'ALL' &&
        item.difficulty !== selectedDifficulty
      ) {
        return false;
      }
      if (selectedLevel !== 'ÄHLISI' && item.level !== selectedLevel) {
        return false;
      }
      return true;
    });
  }, [selectedDifficulty, selectedLevel, favorites]);

  const renderItem = useCallback(
    ({ item }) => (
      <TwisterCard
        item={item}
        isPlaying={currentPlayingId === item.id}
        isFavorite={favorites.includes(item.id)}
        onPlay={handlePlayAudio}
        onStop={handleStopAudio}
        onToggleFavorite={handleToggleFavorite}
        onShare={handleShareItem}
        colors={themeColors}
        styles={styles}
      />
    ),
    [
      currentPlayingId,
      favorites,
      handlePlayAudio,
      handleStopAudio,
      handleToggleFavorite,
      handleShareItem,
      themeColors,
      styles
    ]
  );

  return (
    <SafeAreaProvider>
      <StatusBar 
        barStyle={isDarkMode ? "light-content" : "dark-content"} 
        backgroundColor={themeColors.canvas} 
      />
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        {/* APP HEADER */}
        <View style={styles.header}>
          <View style={styles.headerTitleGroup}>
            <View style={styles.hankoBadge}>
              <Text style={styles.hankoBadgeText}>早</Text>
            </View>
            <View>
              <Text style={styles.headerTitle}>HAYAKUCHI</Text>
              <Text style={styles.headerSubTitle}>早口言葉 • 日本語の訓練</Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.headerIconButton}
              onPress={() => setIsAboutOpen(true)}
            >
              <Feather name="info" size={20} color={themeColors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.headerIconButton}
              onPress={() => setIsSettingsOpen(true)}
            >
              <Ionicons name="settings-outline" size={20} color={themeColors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* DIFFICULTY / FAVORITES FILTERS */}
        <View style={styles.filterSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContent}
          >
            {DIFFICULTY_FILTERS.map((filter) => {
              const isActive = selectedDifficulty === filter.id;
              return (
                <TouchableOpacity
                  key={filter.id}
                  activeOpacity={0.8}
                  style={[
                    styles.filterChip,
                    isActive && styles.filterChipActive,
                  ]}
                  onPress={() => setSelectedDifficulty(filter.id)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      isActive && styles.filterChipTextActive,
                    ]}
                  >
                    {filter.label_tm}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* JLPT LEVEL FILTERS */}
        <View style={styles.jlptSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContent}
          >
            {JLPT_LEVELS.map((lvl) => {
              const isActive = selectedLevel === lvl;
              return (
                <TouchableOpacity
                  key={lvl}
                  activeOpacity={0.8}
                  style={[
                    styles.jlptChip,
                    isActive && styles.jlptChipActive,
                  ]}
                  onPress={() => setSelectedLevel(lvl)}
                >
                  <Text
                    style={[
                      styles.jlptChipText,
                      isActive && styles.jlptChipTextActive,
                    ]}
                  >
                    {lvl}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* DYNAMIC VIRTUALIZED FLATLIST */}
        {filteredTwisters.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="cards-heart-outline"
              size={56}
              color={themeColors.textSubtext}
            />
            <Text style={styles.emptyText}>Maglumat tapylmady</Text>
            <Text style={styles.emptySubText}>データが見つかりません</Text>
          </View>
        ) : (
          <FlatList
            data={filteredTwisters}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            initialNumToRender={4}
            maxToRenderPerBatch={4}
            windowSize={3}
            removeClippedSubviews={false}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* SETTINGS MODAL */}
        <Modal
          visible={isSettingsOpen}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setIsSettingsOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Sazlamalar / 設定</Text>
                <TouchableOpacity
                  onPress={() => setIsSettingsOpen(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={24} color={themeColors.textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Speech Speed Settings - Professional UI with Exact Numbers */}
                <Text style={styles.settingLabel}>
                  AI Sesiň Tizligi / 音声速度
                </Text>
                <View style={styles.speedOptionGroup}>
                  {[
                    { speed: 0.25, label: '0.25x Örän haýal' },
                    { speed: 0.5, label: '0.5x Haýal' },
                    { speed: 0.75, label: '0.75x Orta-haýal' },
                    { speed: 1.25, label: '1.25x Adaty' },
                    { speed: 1.5, label: '1.50x Çalt' },
                  ].map((opt) => (
                    <TouchableOpacity
                      key={opt.speed}
                      activeOpacity={0.8}
                      style={[
                        styles.speedButton,
                        speechSpeed === opt.speed && styles.speedButtonActive,
                      ]}
                      onPress={() => handleSpeechSpeedChange(opt.speed)}
                    >
                      <Text
                        style={[
                          styles.speedButtonText,
                          speechSpeed === opt.speed && styles.speedButtonTextActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.settingBox}>
                  <View style={styles.settingBoxHeader}>
                    <Ionicons 
                      name="options-outline" 
                      size={18} 
                      color={themeColors.secondaryAccent} 
                    />
                    <Text style={styles.settingBoxTitle}>Ulgam Sazlamalary / システム</Text>
                  </View>
                  
                  {/* Dark/Light Mode Toggle */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.actionButton}
                    onPress={() => setIsDarkMode(!isDarkMode)}
                  >
                    <Ionicons
                      name={isDarkMode ? "sunny-outline" : "moon-outline"}
                      size={20}
                      color={themeColors.textPrimary}
                    />
                    <Text style={styles.actionButtonText}>
                      {isDarkMode ? "Gündiz Tema / ライトモード" : "Gije Tema / ダークモード"}
                    </Text>
                  </TouchableOpacity>

                  {/* Share App Button */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.actionButton}
                    onPress={handleShareApp}
                  >
                    <Feather
                      name="share"
                      size={20}
                      color={themeColors.textPrimary}
                    />
                    <Text style={styles.actionButtonText}>
                      Programmany Paýlaş / シェア
                    </Text>
                  </TouchableOpacity>

                  {/* RAM Reset / Clear Cache */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.actionButton}
                    onPress={handleResetRAM}
                  >
                    <Ionicons
                      name="refresh-circle-outline"
                      size={20}
                      color={themeColors.textPrimary}
                    />
                    <Text style={styles.actionButtonText}>
                      RAM Arassalamak / キャッシュ消去
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.appVersionContainer}>
                  <Text style={styles.appVersionText}>
                    Hayakuchi Versiýa 1.1.2 
                  </Text>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* ABOUT MODAL */}
        <Modal
          visible={isAboutOpen}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setIsAboutOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Programma Barada / アプリ情報
                </Text>
                <TouchableOpacity
                  onPress={() => setIsAboutOpen(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={24} color={themeColors.textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.aboutBadgeRow}>
                  <View style={styles.hankoBadgeLarge}>
                    <Text style={styles.hankoBadgeTextLarge}>早</Text>
                  </View>
                  <View style={styles.aboutBadgeTextGroup}>
                    <Text style={styles.aboutAppTitle}>Hayakuchi Kotoba</Text>
                    <Text style={styles.aboutAppSub}>早口言葉 • 滑舌の訓練</Text>
                  </View>
                </View>

                <Text style={styles.aboutParagraph}>
                  Hayakuchi Kotoba (早口言葉) — ýapon dilinde artikulýasiýany,
                  diňläp düşünmegi we çalt geplemegi kämilleşdirmek üçin niýetlenen
                  diller ýaňlytmaçlar toplumydyr.
                </Text>

                <View style={styles.thanksCard}>
                  <View style={styles.thanksHeader}>
                    <FontAwesome5
                      name="award"
                      size={18}
                      color={themeColors.secondaryAccent}
                    />
                    <Text style={styles.thanksTitle}>Aýratyn Minnetdarlyk</Text>
                  </View>
                  <Text style={styles.thanksText}>
                    Gurbansähedowa Ogulbibi / Ussat Mugallymymyza — Ýapon diliniň, bilimiň we ylmyň
                    çuňluklaryny öwredip, gözýetimimizi giňelden hormatly
                    mugallymyma çuňňur minnetdarlygymy bildirýärin.
                  </Text>
                </View>

                <Text style={styles.developerCredits}>
                  Işläp düzüji / 開発者: Aly-dev_TM{'\n'}   
                  Email : alyhydyrow027@gmail.com {'\n'}
                  Hayakuchi App © 2026 AlyDev.{'\n'} All rights reserved.
                  Designed for Japanese Language Learners.
                </Text>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const getDynamicStyles = (COLORS) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.canvas,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hankoBadge: {
    width: 36,
    height: 36,
    backgroundColor: COLORS.primaryAccent,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  hankoBadgeText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1.2,
  },
  headerSubTitle: {
    color: COLORS.textSubtext,
    fontSize: 11,
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerIconButton: {
    padding: 8,
    marginLeft: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  filterSection: {
    paddingTop: 12,
    paddingBottom: 8,
  },
  filterScrollContent: {
    paddingHorizontal: 16,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: COLORS.primaryAccent,
    borderColor: COLORS.primaryAccent,
  },
  filterChipText: {
    color: COLORS.textSubtext,
    fontSize: 12,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFF',
  },
  jlptSection: {
    paddingTop: 4,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  },
  jlptChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: COLORS.surface,
    marginRight: 6,
  },
  jlptChipActive: {
    backgroundColor: COLORS.secondaryAccent,
  },
  jlptChipText: {
    color: COLORS.textSubtext,
    fontSize: 11,
    fontWeight: 'bold',
  },
  jlptChipTextActive: {
    color: '#000',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 30,
  },
  card: {
    minHeight: 220,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelBadge: {
    backgroundColor: COLORS.secondaryAccent,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginRight: 8,
  },
  levelBadgeText: {
    color: '#000',
    fontSize: 11,
    fontWeight: 'bold',
  },
  difficultyBadge: {
    backgroundColor: COLORS.buttonBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  difficultyBadgeText: {
    color: COLORS.textSubtext,
    fontSize: 11,
  },
  favoriteButton: {
    padding: 4,
  },
  textContainer: {
    marginVertical: 6,
  },
  kanjiText: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginBottom: 6,
    flexWrap: 'wrap',
    lineHeight: 30,
  },
  hiraganaText: {
    color: COLORS.hiraganaText,
    fontSize: 13,
    marginBottom: 4,
    flexWrap: 'wrap',
    lineHeight: 18,
  },
  romajiText: {
    color: COLORS.textSubtext,
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.surfaceBorder,
    marginVertical: 8,
  },
  turkmenText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    lineHeight: 20,
    flexWrap: 'wrap',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
  },
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryAccent,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
    marginRight: 10,
  },
  audioButtonActive: {
    backgroundColor: '#990000',
  },
  audioButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  actionIconButton: {
    padding: 10,
    backgroundColor: COLORS.buttonBg,
    borderRadius: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
  },
  emptySubText: {
    color: COLORS.textSubtext,
    fontSize: 13,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
    marginBottom: 16,
  },
  modalTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  settingLabel: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  speedOptionGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  speedButton: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: COLORS.buttonBg,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 3,
  },
  speedButtonActive: {
    backgroundColor: COLORS.secondaryAccent,
  },
  speedButtonText: {
    color: COLORS.textSubtext,
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  speedButtonTextActive: {
    color: '#000',
  },
  settingBox: {
    backgroundColor: COLORS.canvas,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  settingBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  settingBoxTitle: {
    color: COLORS.secondaryAccent,
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.buttonBg,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 10,
  },
  actionButtonText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  appVersionContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  appVersionText: {
    color: COLORS.textSubtext,
    fontSize: 11,
  },
  aboutBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  hankoBadgeLarge: {
    width: 48,
    height: 48,
    backgroundColor: COLORS.primaryAccent,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  hankoBadgeTextLarge: {
    color: '#FFF',
    fontSize: 26,
    fontWeight: 'bold',
  },
  aboutBadgeTextGroup: {
    flex: 1,
  },
  aboutAppTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  aboutAppSub: {
    color: COLORS.textSubtext,
    fontSize: 12,
  },
  aboutParagraph: {
    color: COLORS.textPrimary,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 16,
  },
  thanksCard: {
    backgroundColor: COLORS.canvas,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.secondaryAccent,
    marginBottom: 16,
  },
  thanksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  thanksTitle: {
    color: COLORS.secondaryAccent,
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  thanksText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  developerCredits: {
    color: COLORS.textSubtext,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
  },
});