import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { FiPhone, FiMail, FiMapPin, FiInstagram, FiSend } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import api from '../../services/api';

const Footer = () => {
  const { t, i18n } = useTranslation();
  const currentYear = new Date().getFullYear();
  const [contactInfo, setContactInfo] = useState(null);

  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        const response = await api.get('/public/settings');
        setContactInfo(response.data.data.contactInfo);
      } catch (error) {
        console.error('Error fetching contact info:', error);
      }
    };

    fetchContactInfo();
  }, []);

  const getCurrentLanguage = () => {
    const lang = i18n.language;
    if (lang.startsWith('uz')) return 'uz';
    if (lang.startsWith('ru')) return 'ru';
    return 'en';
  };

  const getLocalizedAddress = () => {
    if (!contactInfo?.address) return t('footer.address');
    const currentLang = getCurrentLanguage();
    return contactInfo.address[currentLang] || contactInfo.address.uz || t('footer.address');
  };

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">B</span>
              </div>
              <span className="text-xl font-bold text-white">
                {t('common.appName')}
              </span>
            </div>
            <p className="text-sm">
              {t('footer.description')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t('footer.quickLinks')}</h3>
            <ul className="space-y-2">
              <li>
                <a href="#features" className="text-sm hover:text-primary-400 transition-colors">
                  {t('navigation.features')}
                </a>
              </li>
              <li>
                <a href="#statistics" className="text-sm hover:text-primary-400 transition-colors">
                  {t('navigation.statistics')}
                </a>
              </li>
              <li>
                <Link to="/login" className="text-sm hover:text-primary-400 transition-colors">
                  {t('auth.loginButton')}
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-sm hover:text-primary-400 transition-colors">
                  {t('auth.registerButton')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t('footer.contactTitle')}</h3>
            <ul className="space-y-3">
              <li className="flex items-center space-x-3">
                <FiPhone className="w-4 h-4 text-primary-400" />
                <span className="text-sm">{contactInfo?.phone || t('footer.phone')}</span>
              </li>
              <li className="flex items-center space-x-3">
                <FiMail className="w-4 h-4 text-primary-400" />
                <span className="text-sm">{contactInfo?.email || t('footer.email')}</span>
              </li>
              <li className="flex items-start space-x-3">
                <FiMapPin className="w-4 h-4 text-primary-400 mt-1" />
                <span className="text-sm">{getLocalizedAddress()}</span>
              </li>
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t('footer.socialMedia')}</h3>
            <div className="flex space-x-4">
              {contactInfo?.whatsapp && (
                <a
                  href={`https://wa.me/${contactInfo.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary-600 transition-colors"
                >
                  <FaWhatsapp className="w-5 h-5" />
                </a>
              )}
              {contactInfo?.instagram && (
                <a
                  href={contactInfo.instagram.startsWith('http') ? contactInfo.instagram : `https://instagram.com/${contactInfo.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary-600 transition-colors"
                >
                  <FiInstagram className="w-5 h-5" />
                </a>
              )}
              {contactInfo?.telegram && (
                <a
                  href={contactInfo.telegram.startsWith('http') ? contactInfo.telegram : `https://t.me/${contactInfo.telegram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary-600 transition-colors"
                >
                  <FiSend className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-800 text-center">
          <p className="text-sm">
            © {currentYear} {t('common.appName')}. {t('footer.rights')}.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;