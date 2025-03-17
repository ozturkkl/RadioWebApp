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
    allCategories: 'Hepsi'
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
    installOnIOS: 'iOS\'ta Yükle',
    installOnAndroid: 'Android\'de Yükle',
    step1: 'Adım 1',
    step2: 'Adım 2',
    step3: 'Adım 3',
    tapShareButton: 'Safari veya Chrome\'da Paylaş düğmesine dokunun',
    squareWithArrow: '(yukarı ok işaretli kare)',
    addToHomeScreen: 'Paylaşım menüsünde aşağı kaydırın ve "Ana Ekrana Ekle" seçeneğine dokunun',
    editNameAndAdd: 'İsterseniz adını düzenleyebilir, ardından sağ üst köşedeki "Ekle" düğmesine dokunabilirsiniz',
    appOnHomeScreen: 'Not: Bu uygulama artık ana ekranınızda görünecek ve tarayıcı arayüzü olmadan tam ekran modunda çalışacaktır.',
    worksSafariChrome: 'Önemli: Bu özellik yalnızca Safari ve Chrome\'da çalışır. iOS\'ta farklı bir tarayıcı kullanıyorsanız, lütfen önce bu siteyi Safari veya Chrome\'da açın.',
    firefoxLimitation: 'Firefox Sınırlaması',
    firefoxNoSupport: 'Ne yazık ki Firefox, web sitelerini Progressive Web Apps (PWA) olarak yüklemeyi desteklemiyor.',
    useOtherBrowser: 'Bu uygulamayı cihazınıza yüklemek için aşağıdaki tarayıcılardan birini kullanın:',
    chromeRecommended: 'Chrome (Android için önerilir)',
    edge: 'Edge',
    safariIOS: 'Safari (yalnızca iOS)',
    samsungInternet: 'Samsung Internet',
    modernBrowsers: 'İpucu: Firefox dışındaki çoğu modern tarayıcı PWA yüklemeyi destekler.',
    tapMenuButton: 'Menü düğmesine dokunun',
    tapInstall: 'Görünen istemde "Yükle" veya "Ekle" seçeneğine dokunun',
    tipUseChrome: 'İpucu: Yükleme seçeneğini görmüyorsanız Chrome kullanmayı deneyin.'
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
