// Test authentication functionality
const testLogin = async () => {
  console.log('🧪 Testing authentication flow...');

  try {
    // Test basic login call
    const mockLoginFunction = async (username, password, deviceID) => {
      console.log('Mock login called with:', { username, password, deviceID });

      // Simulate successful login response
      return {
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: 'user-123',
            username: username,
            full_name: 'Administrator',
            role: 'ADMIN',
            is_active: true
          },
          session: {
            user_id: 'user-123',
            username: username,
            role: 'ADMIN',
            device_id: deviceID,
            login_time: new Date().toISOString()
          }
        }
      };
    };

    // Test the login flow
    console.log('Testing login with mock function...');
    const result = await mockLoginFunction('admin', 'admin123', 'device-test');
    console.log('Login result:', result);

    if (result.success) {
      console.log('✅ Mock login test successful!');
    } else {
      console.log('❌ Mock login test failed');
    }

    return result;
  } catch (error) {
    console.error('❌ Login test failed:', error);
    return { success: false, error: error.message };
  }
};

// Test the useAuthStore login functionality
const testAuthStore = async () => {
  console.log('🧪 Testing useAuthStore...');

  try {
    // Import the store (if available)
    const { default: useAuthStore } = await import('./frontend/src/features/auth/store/useAuthStore.js');

    // Create a mock login function that simulates backend response
    const mockBackendLogin = async (username, password, deviceID) => {
      console.log('🔐 Mock backend login called with:', { username, password, deviceID });

      // Simulate the exact JSON response format from the real backend
      const response = {
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: '0c9a93a2-0e62-4106-b96f-f9798e29ea8a',
            username: username,
            full_name: 'Administrator',
            email: '',
            role: 'ADMIN',
            is_active: true,
            must_change_password: false,
            created_at: '2025-11-18T08:00:31.667Z',
            updated_at: '2025-11-18T10:46:17.252Z',
            last_login_at: new Date().toISOString()
          },
          session: {
            user_id: '0c9a93a2-0e62-4106-b96f-f9798e29ea8a',
            username: username,
            role: 'ADMIN',
            device_id: deviceID,
            login_time: new Date().toISOString(),
            expires_at: new Date(Date.now() + 8*60*60*1000).toISOString() // 8 hours
          }
        },
        meta: {
          device_id: deviceID,
          timestamp: new Date().toISOString()
        }
      };

      // Return as JSON string to simulate backend
      return JSON.stringify(response);
    };

    // Test the store login
    const store = useAuthStore.getState();
    console.log('Initial store state:', {
      isAuthenticated: store.isAuthenticated,
      user: store.user,
      error: store.error
    });

    console.log('Calling store.login...');
    const loginResult = await store.login(mockBackendLogin, 'admin', 'admin123', 'device-test');

    console.log('Login result:', loginResult);

    // Check final state
    const finalState = useAuthStore.getState();
    console.log('Final store state:', {
      isAuthenticated: finalState.isAuthenticated,
      user: finalState.user,
      session: finalState.session,
      error: finalState.error
    });

    if (finalState.isAuthenticated && finalState.user) {
      console.log('✅ useAuthStore login test successful!');
      return true;
    } else {
      console.log('❌ useAuthStore login test failed');
      return false;
    }

  } catch (error) {
    console.error('❌ useAuthStore test failed:', error);
    return false;
  }
};

// Run tests
testLogin().then(() => {
  console.log('Basic login test completed');
});

testAuthStore().then(() => {
  console.log('AuthStore test completed');
});