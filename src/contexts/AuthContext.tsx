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
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  hasConnectionIssue: false,
  loginAsDemo: () => {},
  logout: async () => {},
  refreshProfile: async () => {},
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

      const rawEmail = email || userMetadata?.email || '';
      const fallbackProfileData = {
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

      if (error) {
        if (error.code === 'PGRST116') {
          // No profile found in database.
          // Directly create it using metadata from supabase auth user
          const { data: insertedData, error: insertError } = await supabase
            .from('profiles')
            .upsert(fallbackProfileData, { onConflict: 'uid' })
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
            console.warn('Failed to insert missing profile in database:', insertError);
            // Fallback: Use metadata local profile object so that the user is not locked out and gets immediate access
            const mappedFallback: UserProfile = {
              uid: uid,
              email: rawEmail,
              displayName: fallbackProfileData.display_name,
              role: fallbackProfileData.role as UserRole,
              phoneNumber: fallbackProfileData.phone_number,
              businessName: fallbackProfileData.business_name,
              vehicleType: fallbackProfileData.vehicle_type,
              licensePlate: fallbackProfileData.license_plate,
              isVerified: false,
              onboardingCompleted: true,
              createdAt: fallbackProfileData.created_at
            };
            setProfile(mappedFallback);
          }
        } else {
          console.error('Error fetching profile:', error);
          // Fallback: Use metadata local profile object so they can still access their dashboard layout
          const mappedFallback: UserProfile = {
            uid: uid,
            email: rawEmail,
            displayName: fallbackProfileData.display_name,
            role: fallbackProfileData.role as UserRole,
            phoneNumber: fallbackProfileData.phone_number,
            businessName: fallbackProfileData.business_name,
            vehicleType: fallbackProfileData.vehicle_type,
            licensePlate: fallbackProfileData.license_plate,
            isVerified: false,
            onboardingCompleted: true,
            createdAt: fallbackProfileData.created_at
          };
          setProfile(mappedFallback);
        }
      } else {
        // Profile exists in database. Let's check if the basic profile requires syncing back the missing metadata fields 
        // (like business_name, nuit, role, etc., which might be missing due to trigger configuration limitations)
        const dbRole = data.role;
        const dbBusinessName = data.business_name;
        const dbNuit = data.nuit;
        const dbPhone = data.phone_number;
        const dbVehicle = data.vehicle_type;
        const dbLicense = data.license_plate;
        const dbOnboarding = data.onboarding_completed;

        const metaRole = userMetadata?.role;
        const metaBusinessName = userMetadata?.business_name || userMetadata?.businessName;
        const metaNuit = userMetadata?.nuit;
        const metaPhone = userMetadata?.phone || userMetadata?.phone_number || userMetadata?.phoneNumber;
        const metaVehicle = userMetadata?.vehicle_type || userMetadata?.vehicleType;
        const metaLicense = userMetadata?.license_plate || userMetadata?.licensePlate;

        const needsSync = (dbRole !== metaRole && metaRole) ||
                          (!dbBusinessName && metaBusinessName) ||
                          (!dbNuit && metaNuit) ||
                          (!dbPhone && metaPhone) ||
                          (!dbVehicle && metaVehicle) ||
                          (!dbLicense && metaLicense) ||
                          dbOnboarding === false;

        let finalData = data;
        if (needsSync) {
          const syncData: any = {};
          if (dbRole !== metaRole && metaRole) syncData.role = metaRole;
          if (!dbBusinessName && metaBusinessName) syncData.business_name = metaBusinessName;
          if (!dbNuit && metaNuit) syncData.nuit = metaNuit;
          if (!dbPhone && metaPhone) syncData.phone_number = metaPhone;
          if (!dbVehicle && metaVehicle) syncData.vehicle_type = metaVehicle;
          if (!dbLicense && metaLicense) syncData.license_plate = metaLicense;
          if (dbOnboarding === false) syncData.onboarding_completed = true;

          const { data: updatedData, error: updateError } = await supabase
            .from('profiles')
            .update(syncData)
            .eq('uid', uid)
            .select()
            .single();

          if (!updateError && updatedData) {
            finalData = updatedData;
          } else {
            console.warn('Silent sync of registration metadata to profile database failed:', updateError);
            // We overlay the fields from metadata onto finalData so that the local user interface is 100% accurate
            finalData = {
              ...data,
              role: metaRole || dbRole,
              business_name: dbBusinessName || metaBusinessName || '',
              nuit: dbNuit || metaNuit || '',
              phone_number: dbPhone || metaPhone || '',
              vehicle_type: dbVehicle || metaVehicle || '',
              license_plate: dbLicense || metaLicense || '',
              onboarding_completed: true
            };
          }
        }

        // Map snake_case to camelCase
        const mappedProfile: UserProfile = {
          ...finalData,
          displayName: finalData.display_name,
          avatarUrl: finalData.avatar_url,
          phoneNumber: finalData.phone_number,
          businessName: finalData.business_name,
          vehicleType: finalData.vehicle_type,
          licensePlate: finalData.license_plate,
          isVerified: finalData.is_verified,
          onboardingCompleted: finalData.onboarding_completed,
          referralLink: finalData.referral_link,
          createdAt: finalData.created_at
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

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id, user.email, user.user_metadata);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, hasConnectionIssue, loginAsDemo, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
