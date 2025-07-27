// Feature flag configuration for companion-enhanced forms
// This allows gradual rollout or easy switching between enhanced and standard forms

export const COMPANION_FEATURES = {
  // Enable enhanced login form with companion
  ENHANCED_LOGIN: true,

  // Enable enhanced registration form with companion
  ENHANCED_REGISTRATION: true,

  // Enable companion personality system
  PERSONALITY_SYSTEM: true,

  // Enable particle effects
  PARTICLE_EFFECTS: true,

  // Enable thought bubbles
  THOUGHT_BUBBLES: true,

  // Enable sound effects (future feature)
  SOUND_EFFECTS: false,

  // Enable advanced moods
  ADVANCED_MOODS: true,

  // Enable petting interaction
  PETTING_ENABLED: true,

  // Debug mode - shows companion state
  DEBUG_MODE: process.env.NODE_ENV === "development",
} as const;

// Helper to check if enhanced forms should be used
export const useEnhancedForms = () => {
  return {
    login: COMPANION_FEATURES.ENHANCED_LOGIN,
    registration: COMPANION_FEATURES.ENHANCED_REGISTRATION,
  };
};

// Example usage in LoginPage.tsx:
/*
import { useEnhancedForms } from '@/features/auth/config/companionFeatures';
import LoginForm from '@/features/auth/components/LoginForm';
import EnhancedLoginForm from '@/features/auth/components/EnhancedLoginForm';

const LoginPage = () => {
  const { login: useEnhanced } = useEnhancedForms();
  
  return (
    <AuthLayout>
      {useEnhanced ? <EnhancedLoginForm /> : <LoginForm />}
    </AuthLayout>
  );
};
*/
