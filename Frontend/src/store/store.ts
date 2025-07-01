// src/store/store.ts
import { configureStore } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import createWebStorage from "redux-persist/lib/storage/createWebStorage";
import { combineReducers } from "redux";
import authReducer from "@/store/slices/authSlice";
import userReducer from "@/store/slices/userSlice";
import statsReducer from "@/store/slices/statsSlice";
import subscriptionReducer from "@/store/slices/subscriptionSlice";
import dashboardReducer from "@/store/slices/dashboardSlice";
import designReducer from "@/store/slices/networkDesignSlice";
import topologyReducer from "@/store/slices/networkTopologySlice";
import networkReportReducer from "@/store/slices/networkReportSlice";
import equipmentReducer from "@/store/slices/equipmentSlice";
import { Equipment } from "@/types/equipment";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";

interface EquipmentState {
  equipment: Equipment[];
}
// Create a no-op storage for server-side
const createNoopStorage = () => {
  return {
    getItem(_key: string) {
      return Promise.resolve(null);
    },
    setItem(_key: string, value: any) {
      return Promise.resolve(value);
    },
    removeItem(_key: string) {
      return Promise.resolve();
    },
  };
};

const storage =
  typeof window !== "undefined"
    ? createWebStorage("local")
    : createNoopStorage();

// Persist configuration for auth slice
const authPersistConfig = {
  key: "auth",
  storage,
  whitelist: ["token", "isAuthenticated", "user"],
};

// Combine reducers
const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authReducer),
  user: userReducer,
  stats: statsReducer,
  subscriptions: subscriptionReducer,
  dashboard: dashboardReducer,
  designs: designReducer,
  topology: topologyReducer,
  reports: networkReportReducer,
  equipment: equipmentReducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: process.env.NODE_ENV !== "production",
});

export const persistor = persistStore(store);

// Type definitions
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
