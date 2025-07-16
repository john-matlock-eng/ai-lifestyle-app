import { configureStore } from "@reduxjs/toolkit";
import encryptionReducer from "./slices/encryptionSlice";

export const store = configureStore({
  reducer: {
    encryption: encryptionReducer,
    // Other reducers will be added here as modules are built
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
