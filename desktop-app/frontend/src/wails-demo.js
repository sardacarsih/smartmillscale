// Demo file showing how to use the new type-safe Wails v2 bindings
// This file demonstrates the improvements made to your Smart Mill Scale application

import { CreateWeighingTyped, LoginTyped, CheckSessionTyped, StartWeightMonitoringTyped, StopWeightMonitoringTyped } from '../wailsjs/go/main/App';
import { EventsOn, EventsOff } from '../wailsjs/runtime/runtime';

// Example: Type-safe weighing operation
export async function createWeighingExample() {
  const request = {
    weight: 12922.50,
    productId: "PROD-001",
    unitId: "UNIT-001",
    supplierId: "SUPP-001",
    ticketNumber: "TKT-2025-001",
    notes: "Test weighing with new type-safe API",
    timestamp: new Date(),
    deviceId: "device-demo"
  };

  try {
    const response = await CreateWeighingTyped(request, "operator-123");
    console.log('Weighing created successfully:', response);

    // Access response properties with full type safety
    console.log(`Weighing ID: ${response.weighingId}`);
    console.log(`Ticket Number: ${response.ticketNumber}`);
    console.log(`Weight: ${response.weight} kg`);
    console.log(`Created at: ${response.createdAt}`);

    return response;
  } catch (error) {
    console.error('Failed to create weighing:', error);
    throw error;
  }
}

// Example: Type-safe login
export async function loginExample() {
  const loginRequest = {
    username: "admin",
    password: "admin123",
    deviceId: "device-demo"
  };

  try {
    const response = await LoginTyped(loginRequest);

    if (response.success) {
      console.log('Login successful!');
      console.log('User:', response.user);
      console.log('Token expires at:', response.expiresAt);

      // Store tokens securely
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('refreshToken', response.refreshToken);

      return response;
    } else {
      throw new Error(response.message);
    }
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}

// Example: Type-safe session check
export async function checkSessionExample() {
  const token = localStorage.getItem('authToken');
  const refreshToken = localStorage.getItem('refreshToken');

  if (!token) {
    throw new Error('No authentication token found');
  }

  try {
    const response = await CheckSessionTyped({
      token: token,
      refreshToken: refreshToken || undefined
    });

    if (response.valid) {
      console.log('Session is valid');
      console.log('User:', response.user);
      return response;
    } else {
      console.log('Session is invalid:', response.message);
      // Redirect to login
      throw new Error('Session expired');
    }
  } catch (error) {
    console.error('Session check failed:', error);
    throw error;
  }
}

// Example: Real-time weight monitoring with events
export class WeightMonitor {
  constructor() {
    this.isMonitoring = false;
    this.callbacks = {
      onWeightUpdate: null,
      onConnectionStatus: null,
      onMonitoringStarted: null,
      onMonitoringStopped: null
    };
  }

  // Set event callbacks
  on(event, callback) {
    if (this.callbacks.hasOwnProperty(event)) {
      this.callbacks[event] = callback;
    }
  }

  // Start monitoring weight with real-time events
  async startMonitoring() {
    if (this.isMonitoring) {
      console.log('Weight monitoring is already active');
      return;
    }

    try {
      // Register event listeners
      EventsOn('weight_update', (weightEvent) => {
        console.log('Weight update received:', weightEvent);
        if (this.callbacks.onWeightUpdate) {
          this.callbacks.onWeightUpdate(weightEvent);
        }
      });

      EventsOn('connection_status', (connectionEvent) => {
        console.log('Connection status:', connectionEvent);
        if (this.callbacks.onConnectionStatus) {
          this.callbacks.onConnectionStatus(connectionEvent);
        }
      });

      EventsOn('weight_monitoring_started', (event) => {
        console.log('Weight monitoring started:', event);
        this.isMonitoring = true;
        if (this.callbacks.onMonitoringStarted) {
          this.callbacks.onMonitoringStarted(event);
        }
      });

      EventsOn('weight_monitoring_stopped', (event) => {
        console.log('Weight monitoring stopped:', event);
        this.isMonitoring = false;
        if (this.callbacks.onMonitoringStopped) {
          this.callbacks.onMonitoringStopped(event);
        }
      });

      // Start monitoring
      await StartWeightMonitoringTyped();
      console.log('Weight monitoring started successfully');

    } catch (error) {
      console.error('Failed to start weight monitoring:', error);
      throw error;
    }
  }

  // Stop monitoring weight
  async stopMonitoring() {
    if (!this.isMonitoring) {
      console.log('Weight monitoring is not active');
      return;
    }

    try {
      await StopWeightMonitoringTyped();

      // Unregister event listeners
      EventsOff('weight_update');
      EventsOff('connection_status');
      EventsOff('weight_monitoring_started');
      EventsOff('weight_monitoring_stopped');

      console.log('Weight monitoring stopped successfully');

    } catch (error) {
      console.error('Failed to stop weight monitoring:', error);
      throw error;
    }
  }

  // Get current monitoring status
  isActive() {
    return this.isMonitoring;
  }
}

// Example usage in your React component
export function useWeightMonitor() {
  const monitor = new WeightMonitor();

  // Setup callbacks
  monitor.on('onWeightUpdate', (weightEvent) => {
    // Update your UI with new weight data
    console.log(`New weight: ${weightEvent.weight} kg (Stable: ${weightEvent.stable})`);
  });

  monitor.on('onConnectionStatus', (connectionEvent) => {
    // Update connection status indicator
    console.log(`Scale connected: ${connectionEvent.isConnected}`);
  });

  return monitor;
}

// Example: Complete weighing workflow
export async function completeWeighingWorkflow() {
  try {
    // 1. Login
    const loginResult = await loginExample();
    console.log('✅ Login successful');

    // 2. Check session
    const sessionResult = await checkSessionExample();
    console.log('✅ Session valid');

    // 3. Start weight monitoring
    const monitor = new WeightMonitor();
    await monitor.startMonitoring();
    console.log('✅ Weight monitoring started');

    // 4. Create weighing record (you'd typically do this when weight is stable)
    const weighingResult = await createWeighingExample();
    console.log('✅ Weighing record created');

    // 5. Stop monitoring (optional)
    await monitor.stopMonitoring();
    console.log('✅ Workflow completed');

    return {
      login: loginResult,
      session: sessionResult,
      weighing: weighingResult
    };

  } catch (error) {
    console.error('❌ Workflow failed:', error);
    throw error;
  }
}

// Export all functions for use in your application
export default {
  createWeighingExample,
  loginExample,
  checkSessionExample,
  WeightMonitor,
  useWeightMonitor,
  completeWeighingWorkflow
};