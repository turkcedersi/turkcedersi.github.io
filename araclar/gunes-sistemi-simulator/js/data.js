/**
 * Solar System Simulator - Astronomical Data & Parameters Module
 * Contains Keplerian orbital elements (NASA J2000 epoch), physical dimensions,
 * visual styles, procedural color keys, enriched scientific metrics, dual-source photo URLs, and seasonal event constants.
 */

export const TWO_PI = Math.PI * 2;
export const DEG = Math.PI / 180;

export const EPOCH_MS = Date.UTC(2000, 0, 1, 12, 0, 0);

export const ORBIT_UNIT = 100;
export const ORBIT_POW = 0.56;
export const DEFAULT_ZOOM = 0.85;
export const REAL_K = 0.000075;

export const SPIN_CAP = 35;
export const INC_SCALE = 1.5;

export const EPS = 23.44 * DEG; // Earth axial tilt: 23.44 degrees

export const MOON_INC = 5.145; // Moon orbital inclination to ecliptic
export const MOON_NODE_PERIOD = 18.61 * 365.25; // 18.61 years nodal precession

export const SEASON_NAMES = ['İLKBAHAR', 'YAZ', 'SONBAHAR', 'KIŞ'];
export const SEASON_COLS = ['#4ade80', '#f59e0b', '#fb923c', '#38bdf8'];

/**
 * Season events with CORRECTED ecliptic longitudes (lamSun values).
 * Standard astronomical convention:
 *   March equinox    = 0°      (lamSun = 0)
 *   June solstice    = 90°     (lamSun = π/2)
 *   September equinox= 180°    (lamSun = π)
 *   December solstice= 270°    (lamSun = 3π/2)
 */
export const SEASON_EVENTS = [
  { name: '21 MART · İLKBAHAR EKİNOKSU', lam: 0 },
  { name: '21 HAZİRAN · YAZ GÜN DÖNÜMÜ', lam: Math.PI / 2 },
  { name: '23 EYLÜL · SONBAHAR EKİNOKSU', lam: Math.PI },
  { name: '21 ARALIK · KIŞ GÜN DÖNÜMÜ', lam: 3 * Math.PI / 2 }
];

export const SUN = {
  key: 'sun', name: 'Güneş', type: 'G2V Tipi Sarı Cüce Yıldız', isSun: true,
  r: 26, trueR: 696000, rot: 25.4, glow: '255,190,90',
  cols: ['#ffffff', '#ffe88a', '#ffb63e', '#f4761b'],
  photoUrls: [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/The_Sun_by_the_Atmospheric_Imaging_Assembly_of_NASA%27s_Solar_Dynamics_Observatory_-_20100819.jpg/600px-The_Sun_by_the_Atmospheric_Imaging_Assembly_of_NASA%27s_Solar_Dynamics_Observatory_-_20100819.jpg',
    'https://images-assets.nasa.gov/image/GSFC_20171208_archive_e001435/GSFC_20171208_archive_e001435~medium.jpg'
  ],
  info: {
    diam: '1.392.700 km (109× Dünya)', mass: '1,989 × 10³⁰ kg (333.000× Dünya)',
    dist: 'Samanyolu Merkezine 26.000 ışık yılı', per: 'Galaktik Yıl ~230 milyon yıl',
    moons: '8 Gezegen, 5 Cüce Gezegen',
    fact: 'Güneş Sistemi\'nin kütlesinin %99,86\'sını tek başına oluşturur. Çekirdeğinde her saniye 600 milyon ton hidrojen nükleer füzyonla helyuma dönüşür. Yüzey sıcaklığı ~5.500 °C iken çekirdek sıcaklığı 15 milyon °C\'yi aşar. Işığı Dünya\'ya ulaşması yaklaşık 8 dakika 20 saniye sürer.'
  }
};

export const PLANETS = [
  {
    key: 'mercury', name: 'Merkür', type: 'Karasal Gezegen',
    aAU: 0.387, e: 0.2056, inc: 7.00, w: 77.46, M0: 174.79, period: 87.969,
    r: 3.6, trueR: 2439, rot: 58.65, glow: '180,180,180',
    cols: ['#d5d5d5', '#9e9e9e', '#595959'],
    photoUrls: [
      'https://science.nasa.gov/wp-content/uploads/2024/03/pia15162-mercury-basins-messenger-16x9-1.jpg?w=1024',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Mercury_in_true_color.jpg/600px-Mercury_in_true_color.jpg'
    ],
    info: {
      diam: '4.879 km (0,38× Dünya)', mass: '3,301 × 10²³ kg (0,055× Dünya)',
      dist: '57,9 milyon km (0,39 AU)', per: '87,97 gün', moons: '0',
      fact: 'Güneş\'e en yakın gezegendir. Koruyucu atmosferi olmadığı için gündüzleri 430 °C, geceleri −180 °C olur — tek bir günde 610 °C sıcaklık farkı yaşanır. Bir Merkür günü (176 Dünya günü) bir Merkür yılından (88 gün) daha uzundur.'
    }
  },
  {
    key: 'venus', name: 'Venüs', type: 'Karasal Gezegen',
    aAU: 0.723, e: 0.0068, inc: 3.39, w: 131.53, M0: 50.12, period: 224.70,
    r: 6.0, trueR: 6052, rot: -243.0, atm: '255,200,120', glow: '240,200,130',
    cols: ['#fff3d1', '#e0b868', '#a87a2a'],
    photoUrls: [
      'https://science.nasa.gov/wp-content/uploads/2024/03/venus-mariner-10-pia23791-fig2-16x9-1.jpg?w=1024',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Venus_2_Approach_Image.jpg/600px-Venus_2_Approach_Image.jpg'
    ],
    info: {
      diam: '12.104 km (0,95× Dünya)', mass: '4,867 × 10²⁴ kg (0,815× Dünya)',
      dist: '108,2 milyon km (0,72 AU)', per: '224,70 gün', moons: '0',
      fact: 'Kontrolden çıkmış sera etkisi nedeniyle yüzey sıcaklığı 464 °C ile Güneş Sistemi\'nin en sıcak gezegenidir — Merkür\'den bile sıcak. Ters yönde döner: Venüs\'te Güneş batıdan doğar. Boyut olarak Dünya\'nın neredeyse ikizidir.'
    }
  },
  {
    key: 'earth', name: 'Dünya', type: 'Karasal Gezegen (Yaşam Barındıran)',
    aAU: 1.000, e: 0.0167, inc: 0.00, w: 102.94, M0: 357.53, period: 365.25,
    r: 6.5, trueR: 6371, rot: 0.997, atm: '100,180,255', glow: '100,180,255',
    cols: ['#5aa9ff', '#2d6bba', '#1a3a66'],
    photoUrls: [
      'https://science.nasa.gov/wp-content/uploads/2024/03/blue-marble-apollo-17-16x9-1.jpg?w=1024',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/The_Earth_seen_from_Apollo_17.jpg/600px-The_Earth_seen_from_Apollo_17.jpg'
    ],
    info: {
      diam: '12.742 km', mass: '5,972 × 10²⁴ kg',
      dist: '149,6 milyon km (1,00 AU)', per: '365,26 gün (1 yıl)', moons: '1 (Ay)',
      fact: 'Sıvı su ve yaşam barındırdığı bilinen tek gök cismidir. 23,44°\'lik eksen eğikliği mevsimleri oluşturur. Atmosferin %78\'i azot, %21\'i oksijendir. Yüzeyinin %71\'i okyanuslarla kaplıdır. 4,5 milyar yaşındadır ve Ay\'ı dev bir çarpışmadan doğmuştur.'
    }
  },
  {
    key: 'mars', name: 'Mars', type: 'Karasal Gezegen (Kızıl Gezegen)',
    aAU: 1.524, e: 0.0934, inc: 1.85, w: 336.04, M0: 19.37, period: 686.980,
    r: 4.8, trueR: 3390, rot: 1.026, atm: '220,120,80', glow: '230,110,60',
    cols: ['#ff8a5c', '#c44e2b', '#6b220e'],
    photoUrls: [
      'https://science.nasa.gov/wp-content/uploads/2024/03/mars-full-globe-16x9-1.jpg?w=1024',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/OSIRIS_Mars_true_color.jpg/600px-OSIRIS_Mars_true_color.jpg'
    ],
    info: {
      diam: '6.779 km (0,53× Dünya)', mass: '6,417 × 10²³ kg (0,107× Dünya)',
      dist: '227,9 milyon km (1,52 AU)', per: '686,98 gün (1,88 yıl)', moons: '2 (Phobos, Deimos)',
      fact: 'Yüzeyindeki demir oksit tozu kırmızı rengini verir. Güneş Sistemi\'nin en yüksek dağı Olympus Mons (21,9 km) ve en derin kanyonu Valles Marineris (7 km derinlik, 4.000 km uzunluk) burada. Bir Mars günü 24 saat 37 dakikadır — Dünya\'ya çok yakın.'
    }
  },
  {
    key: 'jupiter', name: 'Jüpiter', type: 'Gaz Devı',
    aAU: 5.203, e: 0.0489, inc: 1.30, w: 14.75, M0: 20.02, period: 4332.59,
    r: 16.0, trueR: 69911, rot: 0.414, atm: '220,180,140', glow: '220,170,120',
    cols: ['#e3b888', '#b57c4e', '#5e381b'],
    photoUrls: [
      'https://science.nasa.gov/wp-content/uploads/2024/03/jupiter-marble-pia22946-16x9-1.jpg?w=1024',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Jupiter_New_Horizons.jpg/600px-Jupiter_New_Horizons.jpg'
    ],
    info: {
      diam: '139.820 km (11,0× Dünya)', mass: '1,898 × 10²⁷ kg (318× Dünya)',
      dist: '778,5 milyon km (5,20 AU)', per: '11,86 yıl', moons: '95 bilinen uydu',
      fact: 'Güneş Sistemi\'nin en büyük gezegenidir — içine 1.300 Dünya sığar. 350+ yıldır süren Büyük Kırmızı Leke fırtınası Dünya\'dan büyüktür. Güneş Sistemi\'nin en güçlü manyetik alanına ve en kısa gününe (9 saat 56 dakika) sahiptir.'
    }
  },
  {
    key: 'saturn', name: 'Satürn', type: 'Halkalı Gaz Devı',
    aAU: 9.537, e: 0.0565, inc: 2.49, w: 92.43, M0: 317.02, period: 10759.2,
    r: 13.5, trueR: 58232, rot: 0.444, atm: '210,190,140', glow: '230,200,130',
    ringAng: -0.32, ringSq: 0.38,
    rings: [
      { i: 1.28, o: 1.52, c: 'rgba(210,185,140,0.45)', a: 0.45 },
      { i: 1.55, o: 1.98, c: 'rgba(235,210,160,0.75)', a: 0.75 },
      { i: 2.02, o: 2.25, c: 'rgba(190,165,125,0.40)', a: 0.40 }
    ],
    cols: ['#ebd6a7', '#bda26a', '#695530'],
    photoUrls: [
      'https://science.nasa.gov/wp-content/uploads/2023/05/saturn-farewell-pia21345-sse-banner-1920x640-1.jpg?w=1024',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Saturn_during_Equinox.jpg/600px-Saturn_during_Equinox.jpg'
    ],
    info: {
      diam: '116.460 km (9,1× Dünya)', mass: '5,683 × 10²⁶ kg (95× Dünya)',
      dist: '1,43 milyar km (9,54 AU)', per: '29,46 yıl', moons: '146 bilinen uydu',
      fact: 'Buz ve kaya parçalarından oluşan muhteşem halkaları 280.000 km genişliğinde ancak sadece 10-100 metre kalınlığındadır. Özkütlesi 0,687 g/cm³ ile sudan düşüktür — dev bir okyanus olsaydı yüzerdi. Rüzgarları saatte 1.800 km hıza ulaşır.'
    }
  },
  {
    key: 'uranus', name: 'Uranüs', type: 'Buz Devı',
    aAU: 19.191, e: 0.0457, inc: 0.77, w: 170.96, M0: 142.24, period: 30688.5,
    r: 9.5, trueR: 25362, rot: -0.718, atm: '120,220,230', glow: '120,210,220',
    ringAng: 1.35, ringSq: 0.28,
    rings: [{ i: 1.4, o: 1.65, c: 'rgba(160,220,230,0.32)', a: 0.32 }],
    cols: ['#b3f0f5', '#60c2cc', '#246b73'],
    photoUrls: [
      'https://science.nasa.gov/wp-content/uploads/2024/03/uranus-pia18182-16x9-1.jpg?w=1024',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Uranus2.jpg/600px-Uranus2.jpg'
    ],
    info: {
      diam: '50.724 km (4,0× Dünya)', mass: '8,681 × 10²⁵ kg (14,5× Dünya)',
      dist: '2,87 milyar km (19,19 AU)', per: '84,01 yıl', moons: '28 bilinen uydu',
      fact: '97,8° eksen eğikliğiyle yörüngesinde yan yatmış varil gibi yuvarlanır. Turkuaz rengini atmosferindeki metan gazından alır. −224 °C ile Güneş Sistemi\'nin en soğuk atmosferine sahiptir. 1781\'de William Herschel tarafından teleskopla keşfedilen ilk gezegendir.'
    }
  },
  {
    key: 'neptune', name: 'Neptün', type: 'Buz Devı (En Dış Gezegen)',
    aAU: 30.069, e: 0.0113, inc: 1.77, w: 44.97, M0: 256.23, period: 60182.0,
    r: 9.0, trueR: 24622, rot: 0.671, atm: '80,140,255', glow: '80,140,240',
    ringAng: 0.4, ringSq: 0.35,
    rings: [{ i: 1.35, o: 1.55, c: 'rgba(100,150,255,0.25)', a: 0.25 }],
    cols: ['#6ba4ff', '#2b65cc', '#102a66'],
    photoUrls: [
      'https://science.nasa.gov/wp-content/uploads/2024/03/pia01492-neptune-full-disk-16x9-1.jpg?w=1024',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Neptune_-_Voyager_2_%2829347980845%29_flatten_crop.jpg/600px-Neptune_-_Voyager_2_%2829347980845%29_flatten_crop.jpg'
    ],
    info: {
      diam: '49.244 km (3,9× Dünya)', mass: '1,024 × 10²⁶ kg (17,1× Dünya)',
      dist: '4,50 milyar km (30,07 AU)', per: '164,79 yıl', moons: '16 bilinen uydu',
      fact: 'Saatte 2.100 km\'ye ulaşan rüzgarlarıyla Güneş Sistemi\'nin en fırtınalı gezegenidir. Gözlemlenmeden önce matematiksel hesaplamalarla yeri bulunmuştur (1846). Keşfinden bu yana henüz Güneş etrafındaki ilk turunu bile tamamlayamamıştır.'
    }
  },
  {
    key: 'pluto', name: 'Plüton', type: 'Cüce Gezegen (Kuiper Kuşağı)',
    aAU: 39.482, e: 0.2488, inc: 17.16, w: 224.07, M0: 14.53, period: 90560.0,
    r: 2.6, trueR: 1188, rot: -6.387, glow: '190,160,140',
    cols: ['#e8d3c5', '#ad8d79', '#573f32'],
    photoUrls: [
      'https://science.nasa.gov/wp-content/uploads/2024/03/pluto-new-horizons-pia20291-16x9-1.jpg?w=1024',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Pluto_in_True_Color_-_High-Res.jpg/600px-Pluto_in_True_Color_-_High-Res.jpg'
    ],
    info: {
      diam: '2.377 km (0,19× Dünya)', mass: '1,303 × 10²² kg (0,0021× Dünya)',
      dist: '5,91 milyar km (39,48 AU)', per: '247,94 yıl', moons: '5 (Charon, Styx, Nix, Kerberos, Hydra)',
      fact: '2015\'te New Horizons geçtiğinde yüzeyinde devasa bir azot buzu kalbi (Sputnik Planitia) keşfedildi. Uydusu Charon o kadar büyüktür ki ikisi birbirlerinin etrafında döner — ikili cüce gezegen sistemi oluştururlar. 2006\'da "cüce gezegen" statüsüne indirildi.'
    }
  },
  {
    key: 'halley', name: 'Halley Kuyruklu Yıldızı', type: 'Periyodik Kuyruklu Yıldız (1P/Halley)',
    qAU: 0.586, QAU: 35.1, inc: 10.0, w: 112.0, M0: 298.0, period: 27510.0, isComet: true,
    r: 2.2, trueR: 7, rot: 2.2, glow: '160,230,210',
    photoUrls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Lspn_comet_halley.jpg/600px-Lspn_comet_halley.jpg',
      'https://images-assets.nasa.gov/image/PIA04221/PIA04221~medium.jpg'
    ],
    info: {
      diam: '11 × 8 km (Çekirdek)', mass: '2,2 × 10¹⁴ kg',
      dist: '0,59 AU (En yakın) − 35,1 AU (En uzak)', per: '75,3 yıl', moons: '0',
      fact: 'Çıplak gözle görülebilen tek kısa periyotlu kuyruklu yıldızdır. MÖ 240\'tan beri gözlemlenmiş, en az 30 geçişi kaydedilmiştir. Bir sonraki Güneş geçişi 2061 yılında. Güneş\'e yaklaştıkça eriyen buzu saatte tonlarca gaz ve toz fışkırtarak muhteşem kuyruğunu oluşturur.'
    }
  }
];

export const MOONS = [
  {
    key: 'moon', parentKey: 'earth', name: 'Ay', type: 'Doğal Uydu', isMoon: true,
    aVis: 13, period: 27.32, r: 1.9, trueR: 1737, glow: '220,220,220',
    photoUrls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/FullMoon2010.jpg/600px-FullMoon2010.jpg',
      'https://images-assets.nasa.gov/image/PIA00405/PIA00405~medium.jpg'
    ],
    info: {
      diam: '3.474 km (0,27× Dünya)', mass: '7,342 × 10²² kg',
      dist: '384.400 km (Dünya\'dan)', per: '27,32 gün', moons: '—',
      fact: 'İnsanoğlunun ayak bastığı tek gök cismidir (Apollo 11, 20 Temmuz 1969). Deniz gelgitlerinin ana nedenidir. Her yıl Dünya\'dan 3,8 cm uzaklaşır. Dünya\'ya hep aynı yüzünü gösterir (eş zamanlı dönüş). Güneş tutulması sırasında Güneş\'i mükemmel kapatır — bu evrendeki nadir bir tesadüftür.'
    }
  },
  {
    key: 'io', parentKey: 'jupiter', name: 'Io', type: 'Jüpiter Uydusu (Volkanik)', isMoon: true,
    aVis: 21, period: 1.769, r: 1.7, trueR: 1822, glow: '240,220,100',
    photoUrls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Io_highest_resolution_true_color.jpg/600px-Io_highest_resolution_true_color.jpg',
      'https://images-assets.nasa.gov/image/PIA02308/PIA02308~medium.jpg'
    ],
    info: {
      diam: '3.643 km', mass: '8,93 × 10²² kg', dist: '421.700 km (Jüpiter\'e)', per: '1,77 gün', moons: '—',
      fact: 'Jüpiter\'in çekim gücü Io\'yu sürekli esneterek ısıtır. 400\'den fazla aktif kükürt volkanıyla Güneş Sistemi\'nin en volkanik yeridir. Volkanları uzaya 500 km yüksekliğe lav fışkırtır. Sarı-turuncu yüzeyi pizza görünümü verir.'
    }
  },
  {
    key: 'europa', parentKey: 'jupiter', name: 'Europa', type: 'Jüpiter Uydusu (Buz Okyanusu)', isMoon: true,
    aVis: 25, period: 3.551, r: 1.6, trueR: 1561, glow: '180,210,230',
    photoUrls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Europa-moon-with-ocean.jpg/600px-Europa-moon-with-ocean.jpg',
      'https://images-assets.nasa.gov/image/PIA00502/PIA00502~medium.jpg'
    ],
    info: {
      diam: '3.122 km', mass: '4,80 × 10²² kg', dist: '670.900 km (Jüpiter\'e)', per: '3,55 gün', moons: '—',
      fact: 'Buz kabuğunun altında Dünya\'daki tüm okyanuslardan daha fazla su barındıran devasa bir yeraltı okyanusu saklar. Bu nedenle Dünya dışı yaşam arayışında en umut verici hedeflerden biridir. Yüzeyindeki çatlak çizgiler buz kabuğunun altındaki okyanus hareketlerinden kaynaklanır.'
    }
  },
  {
    key: 'ganymede', parentKey: 'jupiter', name: 'Ganymede', type: 'Jüpiter Uydusu (En Büyük Uydu)', isMoon: true,
    aVis: 30, period: 7.155, r: 2.0, trueR: 2634, glow: '170,160,150',
    photoUrls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Ganymede_-_Perijove_34_Composite.png/600px-Ganymede_-_Perijove_34_Composite.png',
      'https://images-assets.nasa.gov/image/PIA00716/PIA00716~medium.jpg'
    ],
    info: {
      diam: '5.268 km', mass: '1,48 × 10²³ kg', dist: '1.070.400 km (Jüpiter\'e)', per: '7,15 gün', moons: '—',
      fact: 'Merkür gezegeninden bile büyüktür. Güneş Sistemi\'nde kendi manyetik alanı olan bilinen tek uydudur — küçük bir aurora\'sı bile var. Buz ve kaya katmanlarından oluşan iç yapısı bir yeraltı okyanusu barındırıyor olabilir.'
    }
  },
  {
    key: 'callisto', parentKey: 'jupiter', name: 'Callisto', type: 'Jüpiter Uydusu (Kraterli)', isMoon: true,
    aVis: 36, period: 16.689, r: 1.9, trueR: 2410, glow: '130,120,110',
    photoUrls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Callisto.jpg/600px-Callisto.jpg',
      'https://images-assets.nasa.gov/image/PIA03456/PIA03456~medium.jpg'
    ],
    info: {
      diam: '4.821 km', mass: '1,08 × 10²³ kg', dist: '1.882.700 km (Jüpiter\'e)', per: '16,69 gün', moons: '—',
      fact: 'Güneş Sistemi\'nde en yoğun krater içeren yüzeye sahiptir. 4 milyar yıldır neredeyse hiç değişmeden kalmış — Güneş Sistemi\'nin en eski yüzeyidir. Jüpiter\'in zararlı radyasyon kuşağının dışında olduğu için gelecekteki uzay üssü adaylarından biridir.'
    }
  },
  {
    key: 'titan', parentKey: 'saturn', name: 'Titan', type: 'Satürn Uydusu (Atmosferli)', isMoon: true,
    aVis: 40, period: 15.945, r: 2.0, trueR: 2575, glow: '230,170,90',
    photoUrls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Titan_in_true_color.jpg/600px-Titan_in_true_color.jpg',
      'https://images-assets.nasa.gov/image/PIA20068/PIA20068~medium.jpg'
    ],
    info: {
      diam: '5.149 km', mass: '1,35 × 10²³ kg', dist: '1.221.870 km (Satürn\'e)', per: '15,95 gün', moons: '—',
      fact: 'Dünya dışındaki tek yağmur ve göl döngüsü Titan\'dadır — ancak su yerine sıvı metan ve etan yağar, nehirler akar ve denizler oluşturur. Yoğun turuncu atmosferi Dünya\'nınkinden 1,5 kat daha kalındır. Huygens sondası 2005\'te yüzeyine inerek uzak bir uyduya inen ilk araç oldu.'
    }
  },
  {
    key: 'triton', parentKey: 'neptune', name: 'Triton', type: 'Neptün Uydusu (Ters Yörüngeli)', isMoon: true,
    aVis: 15, period: -5.877, r: 1.6, trueR: 1353, glow: '160,200,210',
    photoUrls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Triton_moon_mosaic_Voyager_2_%28large%29.jpg/600px-Triton_moon_mosaic_Voyager_2_%28large%29.jpg',
      'https://images-assets.nasa.gov/image/PIA00317/PIA00317~medium.jpg'
    ],
    info: {
      diam: '2.706 km', mass: '2,14 × 10²² kg', dist: '354.759 km (Neptün\'e)', per: '5,88 gün (Ters)', moons: '—',
      fact: 'Neptün\'ün dönme yönünün tersine hareket eden tek büyük uydudur — muhtemelen Kuiper Kuşağı\'ndan yakalanmış bir cüce gezegendir. Yüzeyinde sıvı azot fışkırtan buz gayzerleri vardır. −235 °C ile Güneş Sistemi\'ndeki en soğuk yüzeylerden birine sahiptir.'
    }
  }
];

export const PROBES = [
  {
    key: 'voyager1', name: 'Voyager 1', type: 'Yıldızlararası Uzay Sondası (NASA)', isProbe: true,
    r: 4.0, r0: 164.5, v: 3.57, dir: 255.0, lat: 34.0, scaleFac: 6, glow: '100,220,255',
    photoUrls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Voyager_spacecraft_model.png/600px-Voyager_spacecraft_model.png',
      'https://images-assets.nasa.gov/image/PIA21930/PIA21930~medium.jpg'
    ],
    info: {
      diam: '3,7 m (Anten çapı)', mass: '825 kg',
      dist: '163,5+ AU (~24,4 milyar km)', per: 'Yıldızlararası Uzayda', moons: '—',
      fact: '1977\'de fırlatıldı. 2012\'de Güneş\'in etki alanından çıkarak yıldızlararası uzaya ulaşan ilk insan yapımı nesnedir. Üzerindeki altın plak, dünya dışı varlıklara hitaben müzik, doğa sesleri ve 55 dilde selamlar taşır. 2025 itibarıyla hâlâ veri göndermektedir.'
    }
  },
  {
    key: 'voyager2', name: 'Voyager 2', type: 'Yıldızlararası Uzay Sondası (NASA)', isProbe: true,
    r: 4.0, r0: 137.0, v: 3.22, dir: 302.0, lat: -48.0, scaleFac: 6, glow: '100,200,255',
    photoUrls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Voyager_spacecraft_model.png/600px-Voyager_spacecraft_model.png',
      'https://images-assets.nasa.gov/image/PIA21930/PIA21930~medium.jpg'
    ],
    info: {
      diam: '3,7 m', mass: '825 kg', dist: '136,2+ AU (~20,3 milyar km)', per: 'Yıldızlararası Uzayda', moons: '—',
      fact: '4 gaz devini (Jüpiter, Satürn, Uranüs, Neptün) sırasıyla ziyaret eden tek uzay aracıdır — "Grand Tour" olarak bilinen eşsiz bir gezegen diziliminden yararlanmıştır. 2018\'de yıldızlararası uzaya geçti. Voyager 1\'den 16 gün ÖNCE fırlatılmış olmasına rağmen daha yavaş hareket eder.'
    }
  },
  {
    key: 'pioneer10', name: 'Pioneer 10', type: 'Uzay Sondası (NASA)', isProbe: true,
    r: 4.0, r0: 136.0, v: 2.52, dir: 65.0, lat: 10.0, scaleFac: 6, glow: '180,180,255',
    photoUrls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Pioneer_10_Construction.jpg/600px-Pioneer_10_Construction.jpg',
      'https://images-assets.nasa.gov/image/P-12821/P-12821~medium.jpg'
    ],
    info: {
      diam: '2,7 m', mass: '258 kg', dist: '133,0+ AU (~19,9 milyar km)', per: 'Derin Uzay', moons: '—',
      fact: 'Asteroit Kuşağı\'nı geçip Jüpiter\'in yakınından ilk geçen araçtır (1973). Üzerinde Carl Sagan\'ın tasarladığı ve insan figürleri ile Güneş Sistemi\'nin konumunu gösteren meşhur altın levhayı taşır. 2003\'te son sinyalini göndermiştir.'
    }
  },
  {
    key: 'pioneer11', name: 'Pioneer 11', type: 'Uzay Sondası (NASA)', isProbe: true,
    r: 4.0, r0: 111.0, v: 2.36, dir: 282.0, lat: -6.0, scaleFac: 6, glow: '180,180,255',
    photoUrls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Pioneer_10_Construction.jpg/600px-Pioneer_10_Construction.jpg',
      'https://images-assets.nasa.gov/image/P-12821/P-12821~medium.jpg'
    ],
    info: {
      diam: '2,7 m', mass: '259 kg', dist: '110,0+ AU (~16,4 milyar km)', per: 'Derin Uzay', moons: '—',
      fact: 'Satürn\'e ilk ulaşan ve halkalarının yakın çekim fotoğraflarını çeken araçtır (1979). Satürn\'ün halkalarından sadece 21.000 km uzaklıktan geçmiştir. 1995\'te son sinyalini göndermiş ve sessizliğe gömülmüştür.'
    }
  },
  {
    key: 'newhorizons', name: 'New Horizons', type: 'Derin Uzay Sondası (NASA)', isProbe: true,
    r: 4.0, r0: 61.0, v: 2.95, dir: 276.0, lat: 4.0, scaleFac: 6, glow: '255,220,100',
    photoUrls: [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/New_Horizons_spacecraft_model_1.png/600px-New_Horizons_spacecraft_model_1.png',
      'https://images-assets.nasa.gov/image/PIA19857/PIA19857~medium.jpg'
    ],
    info: {
      diam: '2,1 m', mass: '478 kg', dist: '58,0+ AU (~8,6 milyar km)', per: 'Kuiper Kuşağında', moons: '—',
      fact: '2015\'te Plüton\'un 12.500 km yakınından saatte 50.000 km hızla geçerek meşhur "kalp" şeklini tüm dünyaya gösterdi. 2019\'da Arrokoth (Ultima Thule) adlı Kuiper Kuşağı nesnesini de ziyaret etti — insanlığın keşfettiği en uzak gök cismi.'
    }
  }
];

export const CASSINI = {
  key: 'cassini', name: 'Cassini-Huygens', type: 'Satürn Yörünge Görevi (NASA/ESA)', isProbe: true,
  r: 3.5, glow: '255,180,100',
  photoUrls: [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Cassini_Saturn_Orbit_Insertion.jpg/600px-Cassini_Saturn_Orbit_Insertion.jpg',
    'https://images-assets.nasa.gov/image/PIA03883/PIA03883~medium.jpg'
  ],
  info: {
    diam: '6,7 m yüksekliğinde', mass: '5.712 kg',
    dist: 'Satürn Yörüngesinde (2004-2017)', per: 'Görev Tamamlandı', moons: '—',
    fact: 'Satürn etrafında 13 yıl boyunca 294 yörünge tamamladı. Huygens sondası Titan\'a inerek başka bir gezegenin uydusuna inen ilk araç oldu. 15 Eylül 2017\'de Satürn atmosferine dalarak "Grand Finale" ile görevini tamamladı — bilim için kendini feda etti.'
  }
};
