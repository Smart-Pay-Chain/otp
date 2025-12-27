# Mobile App Integration Guide

This guide shows how to integrate OTP verification in mobile applications using the @smart-pay-chain/otp.

## Architecture Overview

**IMPORTANT**: The OTP SDK should run on your **backend server**, not directly in mobile apps. This ensures your API keys remain secure.

```
Mobile App → Your Backend API → OTP SDK → OTP Service
```

## Security Best Practices

✅ **DO**:
- Use the SDK on your backend server
- Expose OTP operations through your own API endpoints
- Protect your API with authentication (JWT, session tokens, etc.)
- Validate phone numbers on both client and server
- Implement rate limiting on your endpoints

❌ **DON'T**:
- Hardcode API keys in mobile apps
- Use the SDK directly in mobile apps (except for development/testing)
- Trust client-side validation alone
- Expose your backend API without authentication

## React Native Integration

### 1. Backend API Setup

First, create backend endpoints using the OTP SDK:

```typescript
// backend/routes/auth.ts
import { Router } from 'express';
import { OtpClient } from '@smart-pay-chain/otp';

const router = Router();
const otpClient = new OtpClient({
  apiKey: process.env.OTP_API_KEY,
});

// Send OTP
router.post('/auth/send-otp', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    const result = await otpClient.sendOtp({
      phoneNumber,
      metadata: {
        platform: 'react-native',
        userId: req.user?.id, // if authenticated
      },
    });

    res.json({
      success: true,
      data: {
        requestId: result.requestId,
        expiresAt: result.expiresAt,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Verify OTP
router.post('/auth/verify-otp', async (req, res) => {
  try {
    const { requestId, code } = req.body;
    
    const result = await otpClient.verifyOtp({
      requestId,
      code,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    if (result.success) {
      // Generate JWT or session token
      const token = generateAuthToken({ phoneNumber: req.body.phoneNumber });
      
      res.json({
        success: true,
        data: {
          token,
          message: result.message,
        },
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message,
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
```

### 2. React Native Frontend

Use the provided [React Native example](./react-native-example.tsx) which includes:
- Phone number input with validation
- OTP code input
- Resend functionality with countdown
- Error handling
- Loading states

```bash
# Copy the example to your project
cp examples/react-native-example.tsx src/components/OtpVerification.tsx
```

Update the `API_BASE_URL` to point to your backend:

```typescript
const API_BASE_URL = 'https://your-backend.com/api';
```

### 3. Using in Your App

```typescript
import { OtpVerification } from './components/OtpVerification';

function App() {
  const handleVerified = async (phoneNumber: string) => {
    console.log('Phone verified:', phoneNumber);
    
    // Navigate to main app
    navigation.navigate('Dashboard');
    
    // Or store auth token
    await AsyncStorage.setItem('authToken', token);
  };

  return <OtpVerification onVerified={handleVerified} />;
}
```

## Flutter/Dart Integration

### Backend API

Use the same backend API as above.

### Flutter Frontend

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

class OtpService {
  final String baseUrl = 'https://your-backend.com/api';

  Future<Map<String, dynamic>> sendOtp(String phoneNumber) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/send-otp'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'phoneNumber': phoneNumber}),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to send OTP');
    }
  }

  Future<Map<String, dynamic>> verifyOtp(String requestId, String code) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/verify-otp'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'requestId': requestId,
        'code': code,
      }),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to verify OTP');
    }
  }
}

// Usage in Widget
class OtpScreen extends StatefulWidget {
  @override
  _OtpScreenState createState() => _OtpScreenState();
}

class _OtpScreenState extends State<OtpScreen> {
  final OtpService otpService = OtpService();
  String requestId = '';
  String phoneNumber = '+995';
  String otpCode = '';

  Future<void> sendOtp() async {
    try {
      final result = await otpService.sendOtp(phoneNumber);
      setState(() {
        requestId = result['data']['requestId'];
      });
    } catch (e) {
      // Handle error
      print('Error: $e');
    }
  }

  Future<void> verifyOtp() async {
    try {
      final result = await otpService.verifyOtp(requestId, otpCode);
      // Navigate to main app
      Navigator.pushReplacementNamed(context, '/dashboard');
    } catch (e) {
      // Handle error
      print('Error: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    // Build your UI
    return Scaffold(/* ... */);
  }
}
```

## iOS Native (Swift) Integration

### API Client

```swift
import Foundation

class OTPService {
    let baseURL = "https://your-backend.com/api"
    
    func sendOTP(phoneNumber: String, completion: @escaping (Result<String, Error>) -> Void) {
        guard let url = URL(string: "\(baseURL)/auth/send-otp") else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body = ["phoneNumber": phoneNumber]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            guard let data = data else { return }
            
            if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let dataDict = json["data"] as? [String: Any],
               let requestId = dataDict["requestId"] as? String {
                completion(.success(requestId))
            }
        }.resume()
    }
    
    func verifyOTP(requestId: String, code: String, completion: @escaping (Result<String, Error>) -> Void) {
        guard let url = URL(string: "\(baseURL)/auth/verify-otp") else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body = [
            "requestId": requestId,
            "code": code
        ]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            guard let data = data else { return }
            
            if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let dataDict = json["data"] as? [String: Any],
               let token = dataDict["token"] as? String {
                completion(.success(token))
            }
        }.resume()
    }
}

// Usage
let otpService = OTPService()

otpService.sendOTP(phoneNumber: "+995555123456") { result in
    switch result {
    case .success(let requestId):
        print("Request ID: \(requestId)")
    case .failure(let error):
        print("Error: \(error)")
    }
}
```

## Android Native (Kotlin) Integration

### API Client

```kotlin
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.IOException

class OTPService {
    private val baseUrl = "https://your-backend.com/api"
    private val client = OkHttpClient()
    private val JSON = "application/json; charset=utf-8".toMediaType()

    suspend fun sendOTP(phoneNumber: String): String = withContext(Dispatchers.IO) {
        val json = JSONObject()
        json.put("phoneNumber", phoneNumber)
        
        val body = json.toString().toRequestBody(JSON)
        val request = Request.Builder()
            .url("$baseUrl/auth/send-otp")
            .post(body)
            .build()

        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) throw IOException("Unexpected code $response")
            
            val responseBody = response.body?.string()
            val jsonResponse = JSONObject(responseBody)
            jsonResponse.getJSONObject("data").getString("requestId")
        }
    }

    suspend fun verifyOTP(requestId: String, code: String): String = withContext(Dispatchers.IO) {
        val json = JSONObject()
        json.put("requestId", requestId)
        json.put("code", code)
        
        val body = json.toString().toRequestBody(JSON)
        val request = Request.Builder()
            .url("$baseUrl/auth/verify-otp")
            .post(body)
            .build()

        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) throw IOException("Unexpected code $response")
            
            val responseBody = response.body?.string()
            val jsonResponse = JSONObject(responseBody)
            jsonResponse.getJSONObject("data").getString("token")
        }
    }
}

// Usage in ViewModel/Activity
class OTPViewModel : ViewModel() {
    private val otpService = OTPService()
    
    fun sendOTP(phoneNumber: String) {
        viewModelScope.launch {
            try {
                val requestId = otpService.sendOTP(phoneNumber)
                // Update UI
            } catch (e: Exception) {
                // Handle error
            }
        }
    }
    
    fun verifyOTP(requestId: String, code: String) {
        viewModelScope.launch {
            try {
                val token = otpService.verifyOTP(requestId, code)
                // Save token and navigate
            } catch (e: Exception) {
                // Handle error
            }
        }
    }
}
```

## Passwordless Authentication Flow with Refresh Tokens

For implementing passwordless auth with JWT refresh tokens:

### 1. Backend - Initial OTP Verification

```typescript
router.post('/auth/verify-otp', async (req, res) => {
  const { requestId, code } = req.body;
  
  const result = await otpClient.verifyOtp({ requestId, code });
  
  if (result.success) {
    // Generate access token (short-lived: 15 minutes)
    const accessToken = jwt.sign(
      { phoneNumber, userId },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    
    // Generate refresh token (long-lived: 7 days)
    const refreshToken = jwt.sign(
      { phoneNumber, userId, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );
    
    // Store refresh token in database
    await db.refreshTokens.create({
      userId,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    
    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        expiresIn: 900, // 15 minutes
      },
    });
  }
});
```

### 2. Backend - Refresh Token Endpoint

```typescript
router.post('/auth/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Validate refresh token in database
    const stored = await db.refreshTokens.findOne({
      userId: decoded.userId,
      token: refreshToken,
    });
    
    if (!stored || stored.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    
    // Generate new access token
    const accessToken = jwt.sign(
      { phoneNumber: decoded.phoneNumber, userId: decoded.userId },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    
    res.json({
      success: true,
      data: {
        accessToken,
        expiresIn: 900,
      },
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});
```

### 3. Mobile App - Token Management

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

class AuthService {
  async login(phoneNumber: string, otpCode: string) {
    const response = await fetch(`${API_URL}/auth/verify-otp`, {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, otpCode }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Store tokens
      await AsyncStorage.setItem('accessToken', data.data.accessToken);
      await AsyncStorage.setItem('refreshToken', data.data.refreshToken);
    }
  }
  
  async refreshAccessToken() {
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      await AsyncStorage.setItem('accessToken', data.data.accessToken);
      return data.data.accessToken;
    }
    
    throw new Error('Failed to refresh token');
  }
  
  async makeAuthenticatedRequest(url: string, options: RequestInit = {}) {
    let accessToken = await AsyncStorage.getItem('accessToken');
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    // If 401, try to refresh token
    if (response.status === 401) {
      accessToken = await this.refreshAccessToken();
      
      // Retry request with new token
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${accessToken}`,
        },
      });
    }
    
    return response;
  }
}
```

## App Backgrounding/Foregrounding

Handle OTP flows when the app goes to background/foreground:

```typescript
import { AppState } from 'react-native';

useEffect(() => {
  const subscription = AppState.addEventListener('change', (nextAppState) => {
    if (nextAppState === 'active') {
      // App came to foreground
      // Check if OTP was received while in background
      checkOtpStatus();
    }
  });

  return () => {
    subscription.remove();
  };
}, []);

const checkOtpStatus = async () => {
  if (requestId && step === 'verify') {
    try {
      const status = await fetch(`${API_URL}/otp/status/${requestId}`);
      const data = await status.json();
      
      if (data.status === 'VERIFIED') {
        // OTP was verified elsewhere (e.g., web)
        onVerified(phoneNumber);
      } else if (data.isExpired) {
        setError('OTP has expired. Please request a new one.');
        setStep('phone');
      }
    } catch (error) {
      // Handle error
    }
  }
};
```

## UX Best Practices

1. **Clear Instructions**: Tell users what to expect
2. **Phone Number Formatting**: Show examples of valid formats
3. **Countdown Timer**: Show when resend will be available
4. **Error Messages**: Use user-friendly, actionable messages
5. **Loading States**: Show spinners during API calls
6. **Auto-focus**: Auto-focus inputs for better UX
7. **Numeric Keyboard**: Use number pad for OTP input
8. **Auto-submit**: Consider auto-submitting when OTP is complete
9. **Accessibility**: Add proper labels for screen readers
10. **Offline Handling**: Show helpful message when offline

## Testing

Use test mode in development:

```typescript
// Backend - Enable test mode
const otpClient = new OtpClient({
  apiKey: process.env.OTP_API_KEY,
  autoConfig: true, // Auto-detect test mode
});

// Check if in test mode
const testMode = await otpClient.isTestMode();
if (testMode) {
  console.log('Test mode enabled - use test phone numbers');
}

// Use test phone numbers
const TEST_PHONE = '+15005550006'; // Always succeeds
const TEST_OTP = '123456'; // Fixed code in test mode
```

## Common Pitfalls

❌ **Storing API keys in mobile app** - Use backend API instead  
❌ **No rate limiting** - Add rate limits to prevent abuse  
❌ **Poor error handling** - Show user-friendly error messages  
❌ **No validation** - Validate on both client and server  
❌ **Hardcoded URLs** - Use environment variables  
❌ **No timeout handling** - Set appropriate timeouts  
❌ **Ignoring app lifecycle** - Handle backgrounding properly  

## Support

- See [examples/react-native-example.tsx](./react-native-example.tsx) for complete React Native code
- Check [TESTING_GUIDE.md](../TESTING_GUIDE.md) for testing strategies
- Review main [README.md](../README.md) for SDK documentation

