import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  users: [],
  questions: [],
  statistics: null,
  reports: [],
  loading: false,
  error: null,
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    setUsers: (state, action) => {
      state.users = action.payload;
    },
    setQuestions: (state, action) => {
      state.questions = action.payload;
    },
    setStatistics: (state, action) => {
      state.statistics = action.payload;
    },
    setReports: (state, action) => {
      state.reports = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const { setUsers, setQuestions, setStatistics, setReports, setLoading, setError } = adminSlice.actions;
export default adminSlice.reducer;