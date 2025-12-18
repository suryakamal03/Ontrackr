import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  User,
  UserCredential
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

export interface AuthError {
  code: string;
  message: string;
}

export interface SignUpData {
  email: string;
  password: string;
  fullName: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export const authService = {
  async signUpWithEmail(data: SignUpData): Promise<UserCredential> {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      
      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: data.fullName
        });
      }
      
      return userCredential;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  },

  async signInWithEmail(data: SignInData): Promise<UserCredential> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      return userCredential;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  },

  async signInWithGoogle(): Promise<UserCredential> {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      return userCredential;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  },

  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  },

  getCurrentUser(): User | null {
    return auth.currentUser;
  },

  handleAuthError(error: any): AuthError {
    const errorMessages: Record<string, string> = {
      'auth/email-already-in-use': 'This email is already registered',
      'auth/weak-password': 'Password should be at least 6 characters',
      'auth/invalid-email': 'Invalid email address',
      'auth/user-not-found': 'No account found with this email',
      'auth/wrong-password': 'Incorrect password',
      'auth/too-many-requests': 'Too many attempts. Please try again later',
      'auth/network-request-failed': 'Network error. Please check your connection',
      'auth/popup-closed-by-user': 'Sign-in popup was closed',
      'auth/cancelled-popup-request': 'Only one popup request is allowed at a time',
    };

    return {
      code: error.code || 'unknown',
      message: errorMessages[error.code] || error.message || 'An error occurred during authentication'
    };
  }
};
