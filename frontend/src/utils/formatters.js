// Currency formatter for UZS
export const formatCurrency = (amount, locale = 'uz') => {
  if (!amount && amount !== 0) {
    const currencyNames = {
      uz: 'so\'m',
      'uz-Cyrl': 'сўм',
      ru: 'сўм'
    };
    return '0 ' + (currencyNames[locale] || 'so\'m');
  }
  
  const formatter = new Intl.NumberFormat('uz-UZ', {
    style: 'decimal',
    maximumFractionDigits: 0
  });
  
  const currencyNames = {
    uz: 'so\'m',
    'uz-Cyrl': 'сўм',
    ru: 'сўм'
  };
  
  // Get current locale from provided parameter or localStorage
  let currentLocale = locale;
  if (!currentLocale) {
    try {
      currentLocale = localStorage.getItem('language') || 'uz';
    } catch (e) {
      currentLocale = 'uz';
    }
  }
  
  const currency = currencyNames[currentLocale] || 'so\'m';
  return formatter.format(amount) + ' ' + currency;
};

// Date formatter with proper Uzbek localization
export const formatDate = (date, format = 'full', locale = 'uz') => {
  if (!date) return '';
  
  const dateObj = new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  
  // Month names in different languages
  const monthNames = {
    uz: [
      'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
      'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
    ],
    'uz-Cyrl': [
      'Январ', 'Феврал', 'Март', 'Апрел', 'Май', 'Июн',
      'Июл', 'Август', 'Сентябр', 'Октябр', 'Ноябр', 'Декабр'
    ],
    ru: [
      'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ]
  };
  
  const shortMonthNames = {
    uz: [
      'Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn',
      'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'
    ],
    'uz-Cyrl': [
      'Ян', 'Фев', 'Мар', 'Апр', 'Май', 'Июн',
      'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'
    ],
    ru: [
      'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн',
      'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'
    ]
  };
  
  // Get current locale from provided parameter, localStorage, or default to 'uz'
  let currentLocale = locale;
  if (!currentLocale) {
    try {
      currentLocale = localStorage.getItem('language') || 'uz';
    } catch (e) {
      currentLocale = 'uz';
    }
  }
  
  const day = dateObj.getDate();
  const month = dateObj.getMonth();
  const year = dateObj.getFullYear();
  const hours = dateObj.getHours().toString().padStart(2, '0');
  const minutes = dateObj.getMinutes().toString().padStart(2, '0');
  
  const longMonth = monthNames[currentLocale] ? monthNames[currentLocale][month] : monthNames.uz[month];
  const shortMonth = shortMonthNames[currentLocale] ? shortMonthNames[currentLocale][month] : shortMonthNames.uz[month];
  
  switch (format) {
    case 'short':
      return `${day}-${shortMonth}, ${year}`;
    case 'date':
      return `${day}-${longMonth}, ${year}`;
    case 'time':
      return `${hours}:${minutes}`;
    case 'full':
    default:
      return `${day}-${longMonth}, ${year}, ${hours}:${minutes}`;
  }
};

// Time formatter (duration)
export const formatDuration = (seconds) => {
  if (!seconds || seconds < 0) return '0:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Phone number formatter
export const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '';
  
  // Remove all non-digits
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Check if it's a Uzbekistan number
  if (cleaned.startsWith('998') && cleaned.length === 12) {
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8, 10)} ${cleaned.slice(10)}`;
  }
  
  // Return as is if format is not recognized
  return phoneNumber;
};

// File size formatter
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

// Percentage formatter
export const formatPercentage = (value, totalValue) => {
  if (!value || !totalValue || totalValue === 0) return '0%';
  
  const percentage = (value / totalValue) * 100;
  return Math.round(percentage * 100) / 100 + '%';
};

// Number formatter with K, M suffixes
export const formatNumber = (number) => {
  if (!number && number !== 0) return '0';
  
  if (number >= 1000000) {
    return Math.round((number / 1000000) * 10) / 10 + 'M';
  } else if (number >= 1000) {
    return Math.round((number / 1000) * 10) / 10 + 'K';
  }
  
  return number.toString();
};