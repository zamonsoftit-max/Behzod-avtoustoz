import api from './api';

class PaymentService {
  // Get subscription plans
  async getSubscriptionPlans() {
    const response = await api.get('/payments/plans');
    return response.data;
  }

  // Create payment
  async createPayment(plan, paymentMethod) {
    const response = await api.post('/payments/create', {
      plan,
      paymentMethod
    });
    return response.data;
  }

  // Get payment history
  async getPaymentHistory(params = {}) {
    const response = await api.get('/payments/history', { params });
    return response.data;
  }

  // Get payment details
  async getPaymentDetails(paymentId) {
    const response = await api.get(`/payments/${paymentId}`);
    return response.data;
  }

  // Click payment methods
  async clickPrepare(data) {
    const response = await api.post('/payments/click/prepare', data);
    return response.data;
  }

  async clickComplete(data) {
    const response = await api.post('/payments/click/complete', data);
    return response.data;
  }

  // Payme payment methods
  async paymeCreate(data) {
    const response = await api.post('/payments/payme/create', data);
    return response.data;
  }

  async paymePerform(data) {
    const response = await api.post('/payments/payme/perform', data);
    return response.data;
  }

  // Cancel payment
  async cancelPayment(paymentId) {
    const response = await api.post(`/payments/${paymentId}/cancel`);
    return response.data;
  }

  // Check payment status
  async checkPaymentStatus(paymentId) {
    const response = await api.get(`/payments/${paymentId}/status`);
    return response.data;
  }
}

export default new PaymentService();