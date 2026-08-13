// Mock service for ticket statistics
// This will be replaced when backend API is ready

class TicketStatisticsService {
  constructor() {
    this.STORAGE_KEY = 'ticket_statistics';
    this.loadStatistics();
  }

  loadStatistics() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      this.statistics = saved ? JSON.parse(saved) : {};
    } catch (error) {
      this.statistics = {};
    }
  }

  saveStatistics() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.statistics));
    } catch (error) {
      console.error('Failed to save statistics:', error);
    }
  }

  // Update statistics for a ticket based on test result
  updateTicketStatistics(ticketId, correctAnswers, totalQuestions) {
    if (!ticketId) return;
    

    if (!this.statistics[ticketId]) {
      this.statistics[ticketId] = {
        totalAttempts: 0,
        totalCorrect: 0,
        totalQuestions: 0,
        percentage: 0,
        lastScore: 0,
        bestScore: 0
      };
    }

    const stats = this.statistics[ticketId];
    stats.totalAttempts += 1;
    
    // Calculate current test score
    const currentScore = Math.round((correctAnswers / totalQuestions) * 100);
    stats.lastScore = currentScore;
    
    // Update best score if current score is higher
    if (currentScore > stats.bestScore) {
      stats.bestScore = currentScore;
    }
    
    // Always use the best score as the percentage
    stats.percentage = stats.bestScore;
    
    
    this.saveStatistics();
  }

  // Get statistics for all tickets
  getAllStatistics() {
    const result = [];
    for (const [ticketId, stats] of Object.entries(this.statistics)) {
      result.push({
        ticketId,
        percentage: stats.percentage || 0,
        attempts: stats.totalAttempts || 0
      });
    }
    return result;
  }

  // Get statistics for a specific ticket
  getTicketStatistics(ticketId) {
    return this.statistics[ticketId] || {
      percentage: 0,
      attempts: 0,
      lastScore: 0,
      bestScore: 0
    };
  }

  // Clear all statistics
  clearStatistics() {
    this.statistics = {};
    this.saveStatistics();
  }
  
  // Clear statistics for a specific ticket
  clearTicketStatistics(ticketId) {
    if (this.statistics[ticketId]) {
      delete this.statistics[ticketId];
      this.saveStatistics();
    }
  }

  // Get all statistics as an object
  getStatistics() {
    return this.statistics || {};
  }
}

export default new TicketStatisticsService();