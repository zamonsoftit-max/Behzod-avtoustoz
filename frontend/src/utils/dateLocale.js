// Custom Uzbek Cyrillic locale for date-fns
export const uzCyrl = {
  code: 'uz-Cyrl',
  formatDistance: () => '',
  formatLong: {
    date: () => 'dd MMMM yyyy',
    time: () => 'HH:mm',
    dateTime: () => 'dd MMMM yyyy HH:mm',
  },
  formatRelative: () => '',
  localize: {
    ordinalNumber: () => '',
    era: () => '',
    quarter: () => '',
    month: (n) => {
      const months = [
        'Январ', 'Феврал', 'Март', 'Апрел', 'Май', 'Июн',
        'Июл', 'Август', 'Сентябр', 'Октябр', 'Ноябр', 'Декабр'
      ];
      return months[n];
    },
    day: (n) => {
      const days = [
        'Якшанба', 'Душанба', 'Сешанба', 'Чоршанба',
        'Пайшанба', 'Жума', 'Шанба'
      ];
      return days[n];
    },
    dayPeriod: () => '',
  },
  formatters: {},
  match: {
    ordinalNumber: () => ({ value: 0 }),
    era: () => ({ value: 0 }),
    quarter: () => ({ value: 0 }),
    month: () => ({ value: 0 }),
    day: () => ({ value: 0 }),
    dayPeriod: () => ({ value: 0 }),
  },
  options: {
    weekStartsOn: 1,
    firstWeekContainsDate: 1,
  },
};