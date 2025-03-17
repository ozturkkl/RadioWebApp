import type { TranslationType } from '../index';

export const tr: TranslationType = {
  settings: {
    title: 'Ayarlar',
    theme: 'Tema',
    chooseTheme: 'Tercih ettiğiniz temayı seçin',
    language: 'Dil',
    chooseLanguage: 'Tercih ettiğiniz dili seçin',
    autoplay: 'Otomatik Oynatma',
    autoplayDescription: 'Bir sonraki bölümü otomatik olarak oynat',
    resumeLastContent: 'Son İçeriği Devam Ettir',
    resumeLastContentDescription: 'Uygulamayı açtığınızda son oynatılan radyo veya podcast\'i otomatik olarak oynat',
    autoClosePodcasts: 'Podcastleri Otomatik Kapat',
    autoClosePodcastsDescription: 'Bir podcast açıldığında diğerlerini otomatik olarak kapat',
    skipDuration: 'Atlama Süresi',
		skipDurationDescription: 'Atlama düğmelerini kullanırken atlanacak saniye miktarı',
		install: 'Yükle',
		installApp: 'Uygulamayı Yükle',
		installAppDescription: 'Bu uygulamayı cihazınıza yükleyin',
		alreadyInstalled: 'Zaten Yüklü',
		seconds: 'saniye'
  },
  home: {
    favorites: 'Favoriler',
    radio: 'Radyo',
    archive: 'Arşiv',
    allStationsInFavorites: 'Tüm istasyonlar favorilerde',
    allArchiveInFavorites: 'Bu arşivin tamamı favorilerde',
    scrollForMoreEpisodes: 'Daha fazla bölüm için kaydırın',
    allCategories: 'Hepsini Gör'
  },
  player: {
    skipBackward: 'Geri atla',
    skipForward: 'İleri atla',
    play: 'Oynat',
    pause: 'Duraklat',
    nextTrack: 'Sonraki parça',
    previousTrack: 'Önceki parça',
    refreshRadio: 'Radyo yayınını yenile',
    playbackSpeed: 'Oynatma hızı',
    volumeControl: 'Ses kontrolü',
    goToPodcast: 'Podcaste git',
    goToRadio: 'Radyoya git'
  },
  podcast: {
    showMoreInfo: 'Daha fazla bilgi göster',
    showNewestFirst: 'Önce en yenileri göster',
    showOldestFirst: 'Önce en eskileri göster',
    episodes: 'Bölümler',
    refreshed: 'Yenilendi',
    justNow: 'şimdi',
    timeAgo: 'önce',
    overallProgress: 'Genel İlerleme',
    currentEpisode: 'Mevcut Bölüm',
    timeUnits: {
      days: 'g',
      hours: 's',
      minutes: 'dk'
    }
  },
  continueListening: {
    scrollLeft: 'Sola kaydır',
    scrollRight: 'Sağa kaydır'
  },
  navbar: {
    goBack: 'Geri git',
    otherLinks: 'Diğer Bağlantılar'
  },
  modals: {
    externalLinks: 'Diğer Kaynaklar'
  },
  installModal: {
    // Titles
    installOnIOS: 'iOS\'ta Yükle',
    installOnAndroid: 'Android\'de Yükle',
    
    // Common elements
    step1: 'Adım 1',
    step2: 'Adım 2',
    step3: 'Adım 3',
    
    // iOS specific
    ios: {
      shareButton: 'Safari veya Chrome\'da Paylaş düğmesine dokunun',
      shareButtonNote: '(yukarı ok işaretli kare)',
      addToHomeScreen: 'Paylaşım menüsünde aşağı kaydırın ve "Ana Ekrana Ekle" seçeneğine dokunun',
      finishInstall: 'İsterseniz adını düzenleyebilir, ardından sağ üst köşedeki "Ekle" düğmesine dokunabilirsiniz'
    },
    
    // Firefox specific
    firefox: {
      limitation: 'Firefox Sınırlaması',
      noSupport: 'Ne yazık ki Firefox, web sitelerini Progressive Web Apps (PWA) olarak yüklemeyi desteklemiyor.',
      useAlternative: 'Bu uygulamayı cihazınıza yüklemek için aşağıdaki tarayıcılardan birini kullanın:'
    },
    
    // Browser options
    browsers: {
      chrome: 'Chrome (Android için önerilir)',
      edge: 'Edge',
      safari: 'Safari (yalnızca iOS)',
      samsung: 'Samsung Internet'
    },
    
    // Generic instructions
    generic: {
      menuButton: '{browser} tarayıcısında menü düğmesine dokunun',
      menuPosition: '{position}',
      chromeInstall: '"Cast, save, and share" ve "Install page as app..." seçeneklerine dokunun',
      edgeInstall: '"Uygulamalar" ve ardından "bu siteyi uygulama olarak yükle" seçeneğine dokunun',
      defaultInstall: '"Uygulama yükle" veya "Ana ekrana ekle" seçeneğini arayın',
      tapInstall: 'Görünen istemde "Yükle" veya "Ekle" seçeneğine dokunun'
    },
    
    // Notes and tips
    notes: {
      important: 'Önemli',
      appOnHomeScreen: 'Not: Bu uygulama artık ana ekranınızda görünecek ve tarayıcı arayüzü olmadan tam ekran modunda çalışacaktır.',
      safariChromeOnly: 'Bu özellik yalnızca Safari ve Chrome\'da çalışır. iOS\'ta farklı bir tarayıcı kullanıyorsanız, lütfen önce bu siteyi Safari veya Chrome\'da açın.',
      mostBrowsersSupport: 'İpucu: Firefox dışındaki çoğu modern tarayıcı PWA yüklemeyi destekler.',
      tryChrome: 'İpucu: Yükleme seçeneğini görmüyorsanız Chrome kullanmayı deneyin.'
    },
    
    // Menu positions
    menuPositions: {
      chromeEdge: 'sağ üst köşedeki üç nokta',
      default: 'genellikle köşedeki üç nokta veya çizgi'
    }
  },
  auth: {
    googleAccount: 'Google Hesabı',
    syncData: 'Verileri Google ile senkronize et',
    signedInAs: 'Oturum açıldı:',
    signInToSync: 'İlerlemenizi cihazlar arasında senkronize etmek için oturum açın',
    changeUser: 'Kullanıcı Değiştir',
    signOut: 'Oturumu Kapat',
    signInWithGoogle: 'Google ile Oturum Aç',
    processing: 'İşleniyor...'
  }
};
