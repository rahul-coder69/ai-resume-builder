import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    token: null,
    loading: true,
  },
  reducers: {
    login: (state, action) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.loading = false;
      localStorage.setItem("token", action.payload.token || "");
      localStorage.setItem(
        "authUser",
        JSON.stringify(action.payload.user || null),
      );
    },
    logout: (state) => {
      ((state.token = null), (state.user = null), (state.loading = false));
      localStorage.removeItem("token");
      localStorage.removeItem("authUser");
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
});

export const { login, logout, setLoading } = authSlice.actions;

export default authSlice.reducer;
