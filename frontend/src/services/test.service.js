import api from './api';

class TestService {
  // Get all topics
  async getTopics() {
    const response = await api.get('/tests/topics');
    return response.data;
  }

  // Get all tickets
  async getTickets() {
    const response = await api.get('/tests/tickets');
    return response.data;
  }

  // Get questions by topic
  async getQuestionsByTopic(topicId, limit = 20) {
    const response = await api.get(`/tests/questions/topic/${topicId}`, {
      params: { limit }
    });
    return response.data;
  }

  // Get questions by ticket
  async getQuestionsByTicket(ticketId) {
    const response = await api.get(`/tests/questions/ticket/${ticketId}`);
    return response.data;
  }

  // Get wrong questions
  async getWrongQuestions(all = false) {
    const response = await api.get('/tests/questions/wrong', {
      params: { all }
    });
    return response.data;
  }

  // Get random questions
  async getRandomQuestions(count = 20) {
    const response = await api.get('/tests/questions/random', {
      params: { count }
    });
    return response.data;
  }

  // Get exam questions
  async getExamQuestions() {
    const response = await api.get('/tests/questions/exam');
    return response.data;
  }

  // Start test
  async startTest(testType, params = {}) {
    const response = await api.post('/tests/start', {
      testType,
      ...params
    });
    return response.data;
  }

  // Submit test
  async submitTest(testId, answers) {
    const response = await api.post(`/tests/${testId}/submit`, { answers });
    return response.data;
  }

  // Get test result
  async getTestResult(resultId) {
    const response = await api.get(`/tests/results/${resultId}`);
    return response.data;
  }

  // Get test history
  async getTestHistory(params = {}) {
    const response = await api.get('/tests/results', { params });
    return response.data;
  }

  // Save current test progress
  async saveProgress(testId, answers, currentQuestion) {
    const response = await api.put(`/tests/${testId}/progress`, {
      answers,
      currentQuestion
    });
    return response.data;
  }

  // Get test progress
  async getProgress(testId) {
    const response = await api.get(`/tests/${testId}/progress`);
    return response.data;
  }

  // Demo test methods
  async getDemoQuestions() {
    const response = await api.get('/tests/demo/questions');
    return response;
  }

  async submitDemoTest(data) {
    const response = await api.post('/tests/demo/submit', data);
    return response;
  }

  // Ticket statistics methods
  async saveTicketStatistics(ticketId, bestScore, attempts) {
    const response = await api.post('/tests/ticket-statistics', {
      ticketId,
      bestScore,
      attempts
    });
    return response.data;
  }

  async getTicketStatistics() {
    const response = await api.get('/tests/ticket-statistics');
    return response.data;
  }
}

const testService = new TestService();

export default testService;
