import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMenu, FiX, FiGlobe, FiSun, FiMoon } from 'react-icons/fi';
import { useSelector } from 'react-redux';
import userService from '../../services/user.service';
import { toast } from 'react-toastify';
import api from '../../services/api';

const PublicHeader = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [contactInfo, setContactInfo] = useState(null);

  useEffect(() => {
    // Check if language in localStorage matches current language
    const savedLang = localStorage.getItem('language');
    if (savedLang && savedLang !== i18n.language && i18n.options.supportedLngs.includes(savedLang)) {
      i18n.changeLanguage(savedLang);
    }
  }, []);

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

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const changeLanguage = async (lng) => {
    try {
      await i18n.changeLanguage(lng);
      localStorage.setItem('language', lng);
      
      // Save to server if user is logged in
      if (user) {
        await userService.updateLanguage(lng);
      }
      
      setIsLangMenuOpen(false);
    } catch (error) {
      console.error('Error updating language:', error);
      toast.error(t('errors.updateLanguage'));
    }
  };

  const languages = [
    { code: 'uz', name: 'O\'zbekcha', flag: 'uz', shortName: 'uz' },
    { code: 'uz-Cyrl', name: 'Ўзбекча', flag: 'ўз', shortName: 'ўз' },
    { code: 'ru', name: 'Русский', flag: 'ру', shortName: 'ру' },
  ];

  const getNavLinks = () => [
    { href: '#features', label: t('navigation.features') },
    { href: '#functions', label: t('navigation.functions') },
    { href: '#statistics', label: t('navigation.statistics') },
    { href: '#test', label: t('navigation.tryTest') },
    { 
      href: contactInfo?.contactUrl || 'tel:+998933655060', 
      label: t('navigation.contact'),
      isExternal: contactInfo?.contactUrl ? true : false
    },
  ];

  return (
    <header className="fixed top-0 w-full bg-white/90 dark:bg-dark-bg/90 backdrop-blur-md shadow-sm z-40">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">B</span>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              {t('common.appName')}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {getNavLinks().map((link) => (
              <a
                key={link.href}
                href={link.href}
                target={link.isExternal ? "_blank" : undefined}
                rel={link.isExternal ? "noopener noreferrer" : undefined}
                className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center space-x-4">
            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <FiGlobe className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {languages.find((l) => l.code === i18n.language)?.shortName}
                </span>
              </button>

              <AnimatePresence>
                {isLangMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-card rounded-lg shadow-lg py-2"
                  >
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => changeLanguage(lang.code)}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                          i18n.language === lang.code
                            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <span className="mr-2">{lang.flag}</span>
                        {lang.name}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {theme === 'light' ? (
                <FiMoon className="w-5 h-5 text-gray-700" />
              ) : (
                <FiSun className="w-5 h-5 text-gray-300" />
              )}
            </button>

            {/* Login Button */}
            <button
              onClick={() => navigate('/login')}
              className="btn-primary"
            >
              {t('auth.loginButton')}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {isMenuOpen ? (
              <FiX className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            ) : (
              <FiMenu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden mt-4 pb-4 border-t border-gray-200 dark:border-gray-700"
            >
              <div className="pt-4 space-y-2">
                {getNavLinks().map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    target={link.isExternal ? "_blank" : undefined}
                    rel={link.isExternal ? "noopener noreferrer" : undefined}
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                {/* Mobile Language Selector */}
                <div className="px-4">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    {t('common.language')}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => changeLanguage(lang.code)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          i18n.language === lang.code
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {lang.flag} {lang.shortName}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mobile Theme Toggle */}
                <div className="px-4 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('common.theme')}
                  </span>
                  <button
                    onClick={toggleTheme}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    {theme === 'light' ? (
                      <FiMoon className="w-5 h-5 text-gray-700" />
                    ) : (
                      <FiSun className="w-5 h-5 text-gray-300" />
                    )}
                  </button>
                </div>

                {/* Mobile Login Button */}
                <div className="px-4">
                  <button
                    onClick={() => {
                      navigate('/login');
                      setIsMenuOpen(false);
                    }}
                    className="w-full btn-primary"
                  >
                    {t('auth.loginButton')}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
};

export default PublicHeader;