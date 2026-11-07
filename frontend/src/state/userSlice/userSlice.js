import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import CryptoJS from "crypto-js";

const BASE_URL = import.meta.env.VITE_BASE_URL;
const ENCRYPT_SECRET = import.meta.env.VITE_TOKEN_SECRET || "default-secret";

// Initial state
const initialState = {
  currentUser: null,
  accessToken: null,
  refreshToken: null,
  error: null,
  loading: false,
};

// SIGN IN
export const signIn = createAsyncThunk(
  "user/signIn",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/users/login/`,
        credentials
      );

      const { token, user } = response.data;
      // Encrypt token before saving in Redux
      const encryptedToken = CryptoJS.AES.encrypt(
        token,
        ENCRYPT_SECRET
      ).toString();

      return {
        accessToken: encryptedToken,
        userData: user,
      };
    } catch (error) {
      const message =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        "Login failed. Please try again.";

      return rejectWithValue(message);
    }
  }
);

// ✅ CREATE USER (e.g., registration)
export const createUser = createAsyncThunk(
  "user/createUser",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${BASE_URL}/user/create/`, userData);
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        "User creation failed";
      return rejectWithValue(message);
    }
  }
);

// ✅ UPDATE USER (non-image data)
export const updateUser = createAsyncThunk(
  "user/updateUser",
  async (userData, { rejectWithValue, getState }) => {
    try {
      const { accessToken } = getState().user;
      if (!accessToken) return rejectWithValue("Not authenticated");

      const response = await axios.patch(
        `${BASE_URL}/users/profile/me/`,
        userData,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        "Update failed";
      return rejectWithValue(message);
    }
  }
);

// ✅ UPDATE PROFILE PICTURE
export const updateProfilePicture = createAsyncThunk(
  "user/updateProfilePicture",
  async (file, { rejectWithValue, getState }) => {
    try {
      const { accessToken } = getState().user;
      if (!accessToken) return rejectWithValue("Not authenticated");

      const formData = new FormData();
      formData.append("profile_pic", file);

      const response = await axios.patch(
        `${BASE_URL}/users/profile/me/`,
        formData,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.profile_pic?.[0] ||
        error.response?.data?.detail ||
        "Image upload failed";
      return rejectWithValue(message);
    }
  }
);

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    signOutSuccess: (state) => {
      state.currentUser = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.error = null;
      state.loading = false;
    },
    clearUserError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ✅ signIn
      .addCase(signIn.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signIn.fulfilled, (state, action) => {
        state.currentUser = action.payload.userData;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.loading = false;
      })
      .addCase(signIn.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      })

      // ✅ createUser
      .addCase(createUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createUser.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      })

      // ✅ updateUser
      .addCase(updateUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = { ...state.currentUser, ...action.payload };
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      })

      // ✅ updateProfilePicture
      .addCase(updateProfilePicture.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfilePicture.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = {
          ...state.currentUser,
          profile_pic_url: action.payload.profile_pic_url,
        };
      })
      .addCase(updateProfilePicture.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      });
  },
});

export const { signOutSuccess, clearUserError } = userSlice.actions;
export default userSlice.reducer;
