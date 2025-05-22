import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage"; // Changed import syntax
import authReducer from "@/store/slices/authSlice";
import userReducer from "@/store/slices/userSlice";
import statsReducer from "@/store/slices/statsSlice";
import subscriptionReducer from "@/store/slices/subscriptionSlice";
import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";
import dashboardReducer from "@/store/slices/dashboardSlice";

// Improved storage initialization for Next.js SSR compatibility
const createNoopStorage = () => ({
  getItem(_key: string) {
    return Promise.resolve(null);
  },
  setItem(_key: string, value: any) {
    return Promise.resolve(value);
  },
  removeItem(_key: string) {
    return Promise.resolve();
  },
});

const isClient = typeof window !== "undefined";

// Use the imported storage directly
const persistStorage = isClient ? storage : createNoopStorage();

// Persist configuration for auth slice
const authPersistConfig = {
  key: "auth",
  storage: persistStorage,
  whitelist: ["token", "isAuthenticated", "user"],
};

// Create persisted reducer
const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);

export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    user: userReducer,
    stats: statsReducer,
    subscriptions: subscriptionReducer,
    dashboard: dashboardReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          "persist/PERSIST",
          "persist/REHYDRATE",
          "persist/PAUSE",
          "persist/PURGE",
          "persist/REGISTER",
        ],
      },
    }),
  devTools: process.env.NODE_ENV !== "production",
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
