import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiAward, FiBookOpen, FiClock, FiArrowRight, FiPlay, FiShield, FiUsers } from 'react-icons/fi';
import CountUp from 'react-countup';
import { useInView } from 'react-intersection-observer';

const HomePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [statsRef, statsInView] = useInView({ triggerOnce: true });

  const features = [
    {
      icon: <FiBookOpen className="w-8 h-8" />,
      title: t('landing.features.tests.title'),
      description: t('landing.features.tests.description'),
    },
    {
      icon: <FiAward className="w-8 h-8" />,
      title: t('landing.features.tickets.title'),
      description: t('landing.features.tickets.description'),
    },
    {
      icon: <FiClock className="w-8 h-8" />,
      title: t('landing.features.online.title'),
      description: t('landing.features.online.description'),
    },
    {
      icon: <FiCheckCircle className="w-8 h-8" />,
      title: t('landing.features.auto.title'),
      description: t('landing.features.auto.description'),
    },
  ];

  const statistics = [
    { value: 5, label: t('landing.statistics.students'), suffix: 'K+' },
    { value: 4.2, label: t('landing.statistics.passed'), suffix: 'K+' },
    { value: 1, label: t('landing.statistics.questions'), suffix: 'K+' },
    { value: 850, label: t('landing.statistics.active'), suffix: '+' },
  ];

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 dark:from-gray-900 dark:via-dark-bg dark:to-gray-900">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        
        <div className="container mx-auto px-4 py-20 lg:py-32 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6"
              >
                <FiShield className="w-5 h-5 text-green-400" />
                <span className="text-white text-sm font-medium">{t('landing.hero.safeReliable')}</span>
              </motion.div>
              
              <h1 className="text-5xl lg:text-7xl font-extrabold text-white mb-6 leading-tight">
                {t('landing.hero.title')}
              </h1>
              <p className="text-xl lg:text-2xl text-primary-100 mb-8 leading-relaxed">
                {t('landing.hero.subtitle')}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/register')}
                  className="bg-white text-primary-700 font-bold px-8 py-4 rounded-lg shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center space-x-2 text-lg"
                >
                  <span>{t('landing.hero.register')}</span>
                  <FiArrowRight className="w-5 h-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/login')}
                  className="bg-primary-500/20 backdrop-blur-sm text-white font-semibold px-8 py-4 rounded-lg border-2 border-white/30 hover:bg-primary-500/30 transition-all duration-300 flex items-center justify-center space-x-2 text-lg"
                >
                  <FiPlay className="w-5 h-5" />
                  <span>{t('landing.hero.login')}</span>
                </motion.button>
              </div>
              
              {/* Trust indicators */}
              <div className="flex items-center space-x-6 mt-12">
                <div className="flex items-center space-x-2">
                  <div className="flex -space-x-2">
                    {[1,2,3,4].map((i) => (
                      <div key={i} className="w-10 h-10 rounded-full bg-primary-400 border-2 border-white flex items-center justify-center">
                        <FiUsers className="w-5 h-5 text-white" />
                      </div>
                    ))}
                  </div>
                  <span className="text-white font-medium">{t('landing.hero.students', { count: '5K+' })}</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative hidden lg:block"
            >
              <div className="relative">
                {/* Animated circles */}
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute -inset-20 bg-white/10 rounded-full blur-3xl"
                />
                <motion.div
                  animate={{ 
                    scale: [1.2, 1, 1.2],
                    opacity: [0.2, 0.4, 0.2]
                  }}
                  transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                  className="absolute -inset-10 bg-primary-400/20 rounded-full blur-2xl"
                />
                
                {/* Main content */}
                <div className="relative bg-white/10 backdrop-blur-md rounded-3xl p-12 border border-white/20 shadow-2xl">
                  <div className="text-center">
                    <motion.div
                      animate={{ 
                        rotate: [0, 360],
                      }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="inline-block mb-6"
                    >
                      <div className="w-32 h-32 bg-gradient-to-br from-white/30 to-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
                        <span className="text-6xl">🚗</span>
                      </div>
                    </motion.div>
                    <h3 className="text-white text-3xl font-bold mb-4">{t('common.appName')}</h3>
                    <p className="text-primary-100 text-lg">{t('landing.hero.subtitle')}</p>
                    
                    {/* Stats cards */}
                    <div className="grid grid-cols-2 gap-4 mt-8">
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                        <div className="text-3xl font-bold text-white">98%</div>
                        <div className="text-sm text-primary-100">{t('landing.stats.success')}</div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                        <div className="text-3xl font-bold text-white">24/7</div>
                        <div className="text-sm text-primary-100">{t('landing.stats.online')}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Modern Wave separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto"
          >
            <path
              d="M0,96L48,80C96,64,192,32,288,26.7C384,21,480,43,576,53.3C672,64,768,64,864,58.7C960,53,1056,43,1152,48C1248,53,1344,75,1392,85.3L1440,96L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
              className="fill-gray-50 dark:fill-dark-bg"
            />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gray-50 dark:bg-dark-bg relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary-600 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary-400 rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              {t('landing.features.title')}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              {t('landing.features.subtitle')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                className="bg-white dark:bg-dark-card rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-800 group"
              >
                <motion.div 
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                  className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg"
                >
                  <div className="text-white">
                    {feature.icon}
                  </div>
                </motion.div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section
        id="statistics"
        ref={statsRef}
        className="py-24 bg-white dark:bg-gray-900 relative"
      >
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              {t('landing.statistics.title')}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              {t('landing.statistics.subtitle')}
            </p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {statistics.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
                className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-2xl p-4 sm:p-6 md:p-8 text-center border border-primary-200 dark:border-primary-800"
              >
                <motion.div 
                  className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent mb-3"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
                >
                  {statsInView && (
                    <CountUp
                      start={0}
                      end={stat.value}
                      duration={2.5}
                      separator=","
                      suffix={stat.suffix}
                      decimals={stat.value % 1 !== 0 ? 1 : 0}
                    />
                  )}
                </motion.div>
                <p className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-700 dark:text-gray-200 font-medium text-center px-2">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="functions" className="py-24 bg-gray-50 dark:bg-dark-bg relative overflow-hidden">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              {t('navigation.functions')}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              {t('landing.functions.subtitle')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-dark-card rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6">
                <FiBookOpen className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{t('landing.functions.practice.title')}</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {t('landing.functions.practice.description')}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-dark-card rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6">
                <FiAward className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{t('landing.functions.simulation.title')}</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {t('landing.functions.simulation.description')}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-dark-card rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6">
                <FiCheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{t('landing.functions.analysis.title')}</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {t('landing.functions.analysis.description')}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Try Test Section */}
      <section id="test" className="py-24 bg-white dark:bg-gray-900 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              {t('navigation.tryTest')}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              {t('landing.tryTest.subtitle')}
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-3xl p-8 md:p-12 border border-primary-200 dark:border-primary-800"
            >
              <div className="text-center">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  className="inline-block mb-8"
                >
                  <div className="w-24 h-24 bg-white dark:bg-dark-card rounded-full flex items-center justify-center shadow-xl">
                    <FiPlay className="w-12 h-12 text-primary-600" />
                  </div>
                </motion.div>
                
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  {t('landing.tryTest.demo.title')}
                </h3>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                  {t('landing.tryTest.demo.description')}
                </p>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/demo-test')}
                  className="bg-primary-600 text-white font-bold px-8 py-4 rounded-lg shadow-xl hover:bg-primary-700 transition-all duration-300 inline-flex items-center space-x-2"
                >
                  <FiPlay className="w-5 h-5" />
                  <span>{t('landing.tryTest.demo.button')}</span>
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 dark:from-primary-800 dark:via-primary-900 dark:to-gray-900 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-8"
            >
              <FiAward className="w-10 h-10 text-white" />
            </motion.div>
            
            <h2 className="text-4xl lg:text-6xl font-bold text-white mb-6">
              {t('landing.cta.title')}
            </h2>
            <p className="text-xl lg:text-2xl text-primary-100 mb-12 max-w-3xl mx-auto leading-relaxed">
              {t('landing.cta.subtitle')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/register')}
                className="bg-white text-primary-700 font-bold px-10 py-5 rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-300 text-lg flex items-center justify-center space-x-3"
              >
                <span>{t('landing.cta.startNow')}</span>
                <FiArrowRight className="w-6 h-6" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/login')}
                className="bg-transparent text-white font-semibold px-10 py-5 rounded-xl border-2 border-white/50 hover:bg-white/10 backdrop-blur-sm transition-all duration-300 text-lg"
              >
                {t('landing.cta.haveAccount')}
              </motion.button>
            </div>
            
            {/* Trust badges */}
            <div className="flex flex-wrap justify-center items-center gap-8 mt-16 pt-16 border-t border-white/20">
              <div className="flex items-center space-x-3">
                <FiShield className="w-8 h-8 text-green-400" />
                <span className="text-white font-medium">{t('landing.cta.safe')}</span>
              </div>
              <div className="flex items-center space-x-3">
                <FiCheckCircle className="w-8 h-8 text-green-400" />
                <span className="text-white font-medium">{t('landing.cta.verified')}</span>
              </div>
              <div className="flex items-center space-x-3">
                <FiUsers className="w-8 h-8 text-green-400" />
                <span className="text-white font-medium">{t('landing.cta.users')}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;