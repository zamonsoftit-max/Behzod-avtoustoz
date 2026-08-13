import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunks for API calls
export const fetchTopics = createAsyncThunk(
  'test/fetchTopics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/tests/topics');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch topics');
    }
  }
);

export const fetchTickets = createAsyncThunk(
  'test/fetchTickets',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/tests/tickets');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch tickets');
    }
  }
);

export const fetchQuestions = createAsyncThunk(
  'test/fetchQuestions',
  async ({ type, params }, { rejectWithValue }) => {
    try {
      let endpoint = '';
      
      switch (type) {
        case 'topic':
          endpoint = `/tests/questions/topic/${params.topicId}`;
          break;
        case 'ticket':
          endpoint = `/tests/questions/ticket/${params.ticketId}`;
          break;
        case 'random':
          endpoint = '/tests/questions/random';
          break;
        case 'wrong-answers':
          endpoint = '/tests/questions/wrong-answers';
          break;
        case 'my-wrong-answers':
          endpoint = '/tests/questions/my-wrong-answers';
          break;
        case 'exam':
          endpoint = '/tests/questions/exam';
          break;
        default:
          endpoint = '/tests/questions/random';
      }

      const response = await api.get(endpoint);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch questions');
    }
  }
);

export const submitTest = createAsyncThunk(
  'test/submitTest',
  async (testData, { rejectWithValue }) => {
    try {
      const response = await api.post('/tests/submit', testData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to submit test');
    }
  }
);

export const fetchTestResult = createAsyncThunk(
  'test/fetchTestResult',
  async (testId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/tests/results/${testId}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch test result');
    }
  }
);

const initialState = {
  // Data
  topics: [],
  tickets: [],
  questions: [],
  currentTest: null,
  testResults: [],
  currentResult: null,
  
  // Test session state
  testSession: {
    isActive: false,
    testType: null,
    currentQuestionIndex: 0,
    answers: {},
    timeRemaining: null,
    startTime: null,
    testConfig: {}
  },
  
  // Loading states
  loading: false,
  topicsLoading: false,
  ticketsLoading: false,
  questionsLoading: false,
  submitting: false,
  
  // Error state
  error: null,
};

const testSlice = createSlice({
  name: 'test',
  initialState,
  reducers: {
    // Test session management
    startTestSession: (state, action) => {
      state.testSession = {
        isActive: true,
        testType: action.payload.testType,
        currentQuestionIndex: 0,
        answers: {},
        timeRemaining: action.payload.timeLimit ? action.payload.timeLimit * 60 : null,
        startTime: Date.now(),
        testConfig: action.payload.config || {}
      };
    },
    
    endTestSession: (state) => {
      state.testSession = {
        isActive: false,
        testType: null,
        currentQuestionIndex: 0,
        answers: {},
        timeRemaining: null,
        startTime: null,
        testConfig: {}
      };
    },
    
    setCurrentQuestion: (state, action) => {
      state.testSession.currentQuestionIndex = action.payload;
    },
    
    setAnswer: (state, action) => {
      const { questionId, answerIndex } = action.payload;
      state.testSession.answers[questionId] = answerIndex;
    },
    
    updateTimeRemaining: (state, action) => {
      state.testSession.timeRemaining = action.payload;
    },
    
    // Navigation
    nextQuestion: (state) => {
      if (state.testSession.currentQuestionIndex < state.questions.length - 1) {
        state.testSession.currentQuestionIndex += 1;
      }
    },
    
    previousQuestion: (state) => {
      if (state.testSession.currentQuestionIndex > 0) {
        state.testSession.currentQuestionIndex -= 1;
      }
    },
    
    // Generic setters
    setCurrentTest: (state, action) => {
      state.currentTest = action.payload;
    },
    
    setCurrentResult: (state, action) => {
      state.currentResult = action.payload;
    },
    
    clearError: (state) => {
      state.error = null;
    },
  },
  
  extraReducers: (builder) => {
    // Fetch topics
    builder
      .addCase(fetchTopics.pending, (state) => {
        state.topicsLoading = true;
        state.error = null;
      })
      .addCase(fetchTopics.fulfilled, (state, action) => {
        state.topicsLoading = false;
        state.topics = action.payload;
      })
      .addCase(fetchTopics.rejected, (state, action) => {
        state.topicsLoading = false;
        state.error = action.payload;
      })
      
    // Fetch tickets
      .addCase(fetchTickets.pending, (state) => {
        state.ticketsLoading = true;
        state.error = null;
      })
      .addCase(fetchTickets.fulfilled, (state, action) => {
        state.ticketsLoading = false;
        state.tickets = action.payload;
      })
      .addCase(fetchTickets.rejected, (state, action) => {
        state.ticketsLoading = false;
        state.error = action.payload;
      })
      
    // Fetch questions
      .addCase(fetchQuestions.pending, (state) => {
        state.questionsLoading = true;
        state.error = null;
      })
      .addCase(fetchQuestions.fulfilled, (state, action) => {
        state.questionsLoading = false;
        state.questions = action.payload.data;
        state.testSession.testConfig = {
          testType: action.payload.testType,
          timeLimit: action.payload.timeLimit,
          topicId: action.payload.topicId,
          ticketId: action.payload.ticketId
        };
      })
      .addCase(fetchQuestions.rejected, (state, action) => {
        state.questionsLoading = false;
        state.error = action.payload;
      })
      
    // Submit test
      .addCase(submitTest.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(submitTest.fulfilled, (state, action) => {
        state.submitting = false;
        state.currentResult = action.payload;
        // End test session
        state.testSession = {
          isActive: false,
          testType: null,
          currentQuestionIndex: 0,
          answers: {},
          timeRemaining: null,
          startTime: null,
          testConfig: {}
        };
      })
      .addCase(submitTest.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })
      
    // Fetch test result
      .addCase(fetchTestResult.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTestResult.fulfilled, (state, action) => {
        state.loading = false;
        state.currentResult = action.payload;
      })
      .addCase(fetchTestResult.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  startTestSession,
  endTestSession,
  setCurrentQuestion,
  setAnswer,
  updateTimeRemaining,
  nextQuestion,
  previousQuestion,
  setCurrentTest,
  setCurrentResult,
  clearError,
} = testSlice.actions;

export default testSlice.reducer;