import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, UserRole } from '../types';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  hasConnectionIssue: boolean;
  loginAsDemo: (role: UserRole, customData?: {
    email?: string;
    name?: string;
    phone?: string;
    businessName?: string;
    nuit?: string;
    vehicleType?: string;
    licensePlate?: string;
  }) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  hasConnectionIssue: false,
  loginAsDemo: () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasConnectionIssue, setHasConnectionIssue] = useState(false);
  const safetyTimeoutRef = React.useRef<any>(null);

  const clearSafetyTimeout = () => {
    if (safetyTimeoutRef.current) {
      clearTimeout(safetyTimeoutRef.current);
      safetyTimeoutRef.current = null;
    }
  };

  const clearSupabaseTokens = () => {
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('sb-') || key.includes('auth-token') || key.includes('supabase'))) {
          localStorage.removeItem(key);
        }
      }
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const key = sessionStorage.key(i);
        if (key && (key.startsWith('sb-') || key.includes('auth-token') || key.includes('supabase'))) {
          sessionStorage.removeItem(key);
        }
      }
      supabase.auth.signOut().catch(() => {});
    } catch (err) {
      console.warn('Silent note on clearing supabase tokens:', err);
    }
  };

  // Define loginAsDemo
  const loginAsDemo = (role: UserRole, customData?: {
    email?: string;
    name?: string;
    phone?: string;
    businessName?: string;
    nuit?: string;
    vehicleType?: string;
    licensePlate?: string;
  }) => {
    sessionStorage.setItem('demo_user_role', role);
    sessionStorage.setItem('guest_mode', 'true');
    if (customData) {
      if (customData.email) sessionStorage.setItem('demo_user_email', customData.email);
      if (customData.name) sessionStorage.setItem('demo_user_name', customData.name);
      if (customData.phone) sessionStorage.setItem('demo_user_phone', customData.phone);
      if (customData.businessName) sessionStorage.setItem('demo_user_business_name', customData.businessName);
      if (customData.nuit) sessionStorage.setItem('demo_user_nuit', customData.nuit);
      if (customData.vehicleType) sessionStorage.setItem('demo_user_vehicle_type', customData.vehicleType);
      if (customData.licensePlate) sessionStorage.setItem('demo_user_license_plate', customData.licensePlate);
    }
    
    const email = customData?.email || sessionStorage.getItem('demo_user_email') || `demo_${role}@mozproservices.com`;
    const name = customData?.name || sessionStorage.getItem('demo_user_name') || `Teste ${role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')}`;
    const phone = customData?.phone || sessionStorage.getItem('demo_user_phone') || '';
    const businessName = customData?.businessName || sessionStorage.getItem('demo_user_business_name') || '';
    const nuit = customData?.nuit || sessionStorage.getItem('demo_user_nuit') || '';
    const vehicleType = customData?.vehicleType || sessionStorage.getItem('demo_user_vehicle_type') || '';
    const licensePlate = customData?.licensePlate || sessionStorage.getItem('demo_user_license_plate') || '';

    const mockUser: any = {
      id: `demo_${role}_id`,
      email: email,
      user_metadata: {
        full_name: name
      }
    };
    const mockProfile: UserProfile = {
      uid: `demo_${role}_id`,
      email: email,
      displayName: name,
      role: role,
      phoneNumber: phone,
      businessName: businessName,
      vehicleType: vehicleType,
      licensePlate: licensePlate,
      isVerified: true,
      onboardingCompleted: true,
      createdAt: new Date().toISOString(),
    };
    setUser(mockUser);
    setProfile(mockProfile);
    setLoading(false);
  };

  // Define logout
  const logout = async () => {
    sessionStorage.removeItem('demo_user_role');
    sessionStorage.removeItem('guest_mode');
    sessionStorage.removeItem('demo_user_email');
    sessionStorage.removeItem('demo_user_name');
    sessionStorage.removeItem('demo_user_phone');
    sessionStorage.removeItem('demo_user_business_name');
    sessionStorage.removeItem('demo_user_nuit');
    sessionStorage.removeItem('demo_user_vehicle_type');
    sessionStorage.removeItem('demo_user_license_plate');
    setUser(null);
    setProfile(null);
    await supabase.auth.signOut();
  };

  useEffect(() => {
    // Check if there is a active demo mode session
    const demoRole = sessionStorage.getItem('demo_user_role') as UserRole | null;
    if (demoRole) {
      const email = sessionStorage.getItem('demo_user_email') || `demo_${demoRole}@mozproservices.com`;
      const name = sessionStorage.getItem('demo_user_name') || `Teste ${demoRole.charAt(0).toUpperCase() + demoRole.slice(1).replace('_', ' ')}`;
      const phone = sessionStorage.getItem('demo_user_phone') || '';
      const businessName = sessionStorage.getItem('demo_user_business_name') || '';
      const nuit = sessionStorage.getItem('demo_user_nuit') || '';
      const vehicleType = sessionStorage.getItem('demo_user_vehicle_type') || '';
      const licensePlate = sessionStorage.getItem('demo_user_license_plate') || '';

      const mockUser: any = {
        id: `demo_${demoRole}_id`,
        email: email,
        user_metadata: {
          full_name: name
        }
      };
      const mockProfile: UserProfile = {
        uid: `demo_${demoRole}_id`,
        email: email,
        displayName: name,
        role: demoRole,
        phoneNumber: phone,
        businessName: businessName,
        vehicleType: vehicleType,
        licensePlate: licensePlate,
        isVerified: true,
        onboardingCompleted: true,
        createdAt: new Date().toISOString(),
      };
      setUser(mockUser);
      setProfile(mockProfile);
      setLoading(false);
      return;
    }

    // Set a safety timeout of 15 seconds to prevent infinite "white screen / spinner" loading states
    // if Supabase is offline, paused, or the network connection is slow.
    safetyTimeoutRef.current = setTimeout(() => {
      console.warn('Authentication status check timed out (Supabase is taking too long to respond).');
      setHasConnectionIssue(true);
      setLoading(false);
    }, 15000);

    // Initial session check
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('Silent notice on initial session extraction:', error.message);
          if (error.message && (
            error.message.includes('Refresh Token') || 
            error.message.includes('not found') || 
            error.message.includes('expired') || 
            error.message.includes('Failed to fetch') ||
            error.message.includes('invalid')
          )) {
            // Clean up stale session state
            clearSupabaseTokens();
          }
        }
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id, session.user.email, session.user.user_metadata);
        } else {
          setLoading(false);
          clearSafetyTimeout();
        }
      } catch (err: any) {
        console.warn('Session check failed or aborted:', err);
        const errMsg = err?.message || '';
        if (
          errMsg.includes('Refresh Token') || 
          errMsg.includes('not found') || 
          errMsg.includes('expired') || 
          errMsg.includes('invalid')
        ) {
          clearSupabaseTokens();
        }
        setUser(null);
        setProfile(null);
        setLoading(false);
        clearSafetyTimeout();
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (sessionStorage.getItem('demo_user_role')) {
        if (event === 'SIGNED_OUT') {
          sessionStorage.removeItem('demo_user_role');
          sessionStorage.removeItem('guest_mode');
          setUser(null);
          setProfile(null);
          setLoading(false);
          clearSafetyTimeout();
        }
        return;
      }

      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id, session.user.email, session.user.user_metadata);
      } else {
        setProfile(null);
        setLoading(false);
        clearSafetyTimeout();
      }
    });

    return () => {
      subscription.unsubscribe();
      clearSafetyTimeout();
    };
  }, []);

  const fetchProfile = async (uid: string, email?: string, userMetadata: any = {}) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('uid', uid)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No profile found in database.
          // Directly create it using metadata from supabase auth user (the only source of truth!)
          const rawEmail = email || userMetadata?.email || '';
          const profileData = {
            uid: uid,
            email: rawEmail,
            display_name: userMetadata?.full_name || userMetadata?.display_name || rawEmail.split('@')[0],
            role: userMetadata?.role || 'customer',
            phone_number: userMetadata?.phone || userMetadata?.phone_number || '',
            business_name: userMetadata?.business_name || userMetadata?.businessName || '',
            nuit: userMetadata?.nuit || '',
            vehicle_type: userMetadata?.vehicle_type || userMetadata?.vehicleType || '',
            license_plate: userMetadata?.license_plate || userMetadata?.licensePlate || '',
            onboarding_completed: true,
            is_verified: false,
            created_at: new Date().toISOString()
          };

          const { data: insertedData, error: insertError } = await supabase
            .from('profiles')
            .upsert(profileData, { onConflict: 'uid' })
            .select()
            .single();

          if (!insertError && insertedData) {
            const mapped: UserProfile = {
              ...insertedData,
              displayName: insertedData.display_name,
              avatarUrl: insertedData.avatar_url,
              phoneNumber: insertedData.phone_number,
              businessName: insertedData.business_name,
              vehicleType: insertedData.vehicle_type,
              licensePlate: insertedData.license_plate,
              isVerified: insertedData.is_verified,
              onboardingCompleted: insertedData.onboarding_completed,
              referralLink: insertedData.referral_link,
              createdAt: insertedData.created_at
            };
            setProfile(mapped);
          } else {
            console.error('Failed to auto-create missing profile in database:', insertError);
            setProfile(null);
          }
        } else {
          console.error('Error fetching profile:', error);
          setProfile(null);
        }
      } else {
        // Map snake_case to camelCase
        const mappedProfile: UserProfile = {
          ...data,
          displayName: data.display_name,
          avatarUrl: data.avatar_url,
          phoneNumber: data.phone_number,
          businessName: data.business_name,
          vehicleType: data.vehicle_type,
          licensePlate: data.license_plate,
          isVerified: data.is_verified,
          onboardingCompleted: data.onboarding_completed,
          referralLink: data.referral_link,
          createdAt: data.created_at
        };
        setProfile(mappedProfile);
      }
    } catch (err) {
      console.error('Profile fetch failed:', err);
      setProfile(null);
    } finally {
      setLoading(false);
      clearSafetyTimeout();
    }
  };

  const isAdmin = profile?.role === UserRole.ADMIN;

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, hasConnectionIssue, loginAsDemo, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
