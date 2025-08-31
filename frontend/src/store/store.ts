import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Vehicle, VehicleAnalytics } from '../services/vehicleService';

// Vehicle slice
interface VehicleState {
  vehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
  loading: boolean;
  error: string | null;
}

const initialState: VehicleState = {
  vehicles: [],
  selectedVehicle: null,
  loading: false,
  error: null,
};

const vehicleSlice = createSlice({
  name: 'vehicle',
  initialState,
  reducers: {
    setVehicles: (state, action: PayloadAction<Vehicle[]>) => {
      state.vehicles = action.payload;
    },
    setSelectedVehicle: (state, action: PayloadAction<Vehicle | null>) => {
      state.selectedVehicle = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    updateVehicle: (state, action: PayloadAction<Vehicle>) => {
      const index = state.vehicles.findIndex(v => v.id === action.payload.id);
      if (index !== -1) {
        state.vehicles[index] = action.payload;
      } else {
        state.vehicles.push(action.payload);
      }
    },
  },
});

// Analytics slice
interface AnalyticsState {
  analytics: VehicleAnalytics | null;
  loading: boolean;
  error: string | null;
}

const analyticsInitialState: AnalyticsState = {
  analytics: null,
  loading: false,
  error: null,
};

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState: analyticsInitialState,
  reducers: {
    setAnalytics: (state, action: PayloadAction<VehicleAnalytics>) => {
      state.analytics = action.payload;
    },
    setAnalyticsLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setAnalyticsError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

// Connection slice
interface ConnectionState {
  status: 'connected' | 'connecting' | 'disconnected';
  lastConnected: Date | null;
}

const connectionInitialState: ConnectionState = {
  status: 'disconnected',
  lastConnected: null,
};

const connectionSlice = createSlice({
  name: 'connection',
  initialState: connectionInitialState,
  reducers: {
    setConnectionStatus: (state, action: PayloadAction<'connected' | 'connecting' | 'disconnected'>) => {
      state.status = action.payload;
      if (action.payload === 'connected') {
        state.lastConnected = new Date();
      }
    },
  },
});

// Export actions
export const { 
  setVehicles, 
  setSelectedVehicle, 
  setLoading, 
  setError, 
  updateVehicle 
} = vehicleSlice.actions;

export const { 
  setAnalytics, 
  setAnalyticsLoading, 
  setAnalyticsError 
} = analyticsSlice.actions;

export const { 
  setConnectionStatus 
} = connectionSlice.actions;

// Configure store
export const store = configureStore({
  reducer: {
    vehicle: vehicleSlice.reducer,
    analytics: analyticsSlice.reducer,
    connection: connectionSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['vehicle/setVehicles', 'vehicle/updateVehicle'],
        // Ignore these field paths in all actions
        ignoredPaths: ['vehicle.vehicles', 'vehicle.selectedVehicle'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
