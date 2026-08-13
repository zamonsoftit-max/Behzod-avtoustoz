import React from 'react';
import { useTranslation } from 'react-i18next';

const TestTranslation = () => {
  const { t, i18n } = useTranslation();
  
  console.log('Current language:', i18n.language);
  console.log('Profile title:', t('profile.title'));
  console.log('Profile object:', t('profile', { returnObjects: true }));
  
  return (
    <div className="p-4">
      <h1>Translation Test</h1>
      <p>Current Language: {i18n.language}</p>
      <p>Profile Title: {t('profile.title')}</p>
      <p>Profile Subtitle: {t('profile.subtitle')}</p>
      <hr />
      <button onClick={() => i18n.changeLanguage('uz')} className="px-4 py-2 bg-blue-500 text-white rounded mr-2">
        UZ
      </button>
      <button onClick={() => i18n.changeLanguage('uz-Cyrl')} className="px-4 py-2 bg-blue-500 text-white rounded mr-2">
        UZ-Cyrl
      </button>
      <button onClick={() => i18n.changeLanguage('ru')} className="px-4 py-2 bg-blue-500 text-white rounded">
        RU
      </button>
    </div>
  );
};

export default TestTranslation;