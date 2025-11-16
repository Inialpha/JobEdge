// src/redux/userSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UserState {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isStaff: boolean;
  hasMasterResume: boolean;
}

const initialState: UserState = {
  id: "",
  firstName: "",
  lastName: "",
  email: "",
  isStaff: false,
  hasMasterResume: false,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    login: (
      currentState: UserState,
      action: PayloadAction<{
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        isStaff: boolean;
	hasMasterResume: boolean;
      }>
    ) => {
      const {
        id,
        firstName,
        lastName,
        email,
        isStaff,
	hasMasterResume,
      } = action.payload;

      currentState.id = id;
      currentState.firstName = firstName;
      currentState.lastName = lastName;
      currentState.email = email;
      currentState.isStaff = isStaff;
      currentState.hasMasterResume = hasMasterResume;
    },
    logout: () => {
      return { ...initialState };
    },
    updateUserInfo: (
      currentState: UserState,
      action: PayloadAction<{
        firstName?: string;
        lastName?: string;
        email?: string;
	isStaff?: boolean;
	hasMasterResume?: boolean;
      }>
    ) => {
      const { firstName, lastName, email, isStaff, hasMasterResume } = action.payload;
      if (firstName) currentState.firstName = firstName;
      if (lastName) currentState.lastName = lastName;
      if (email) currentState.email = email;
      if (isStaff !== undefined) currentState.isStaff = isStaff;
      if (hasMasterResume !== undefined) currentState.hasMasterResume = hasMasterResume;
    },
  },
});

export const { login, logout, updateUserInfo } = userSlice.actions;

export default userSlice.reducer;
