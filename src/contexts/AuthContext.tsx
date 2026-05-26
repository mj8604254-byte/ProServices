import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, UserRole } from '../types';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  loginAsDemo: (role: UserRole) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  loginAsDemo: () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Define loginAsDemo
  const loginAsDemo = (role: UserRole) => {
    sessionStorage.setItem('demo_user_role', role);
    sessionStorage.setItem('guest_mode', 'true');
    const mockUser: any = {
      id: `demo_${role}_id`,
      email: `demo_${role}@mozproservices.com`,
      user_metadata: {
        full_name: `Visitante ${role.toUpperCase().replace('_', ' ')}`
      }
    };
    const mockProfile: UserProfile = {
      uid: `demo_${role}_id`,
      email: `demo_${role}@mozproservices.com`,
      displayName: `Teste ${role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')}`,
      role: role,
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
    setUser(null);
    setProfile(null);
    await supabase.auth.signOut();
  };

  useEffect(() => {
    // Check if there is a active demo mode session
    const demoRole = sessionStorage.getItem('demo_user_role') as UserRole | null;
    if (demoRole) {
      const mockUser: any = {
        id: `demo_${demoRole}_id`,
        email: `demo_${demoRole}@mozproservices.com`,
        user_metadata: {
          full_name: `Visitante ${demoRole.toUpperCase().replace('_', ' ')}`
        }
      };
      const mockProfile: UserProfile = {
        uid: `demo_${demoRole}_id`,
        email: `demo_${demoRole}@mozproservices.com`,
        displayName: `Teste ${demoRole.charAt(0).toUpperCase() + demoRole.slice(1).replace('_', ' ')}`,
        role: demoRole,
        isVerified: true,
        onboardingCompleted: true,
        createdAt: new Date().toISOString(),
      };
      setUser(mockUser);
      setProfile(mockProfile);
      setLoading(false);
      return;
    }

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
            error.message.includes('Failed to fetch')
          )) {
            // Clean up stale session state
            supabase.auth.signOut().catch(() => {});
          }
        }
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id, session.user.email);
        } else {
          setLoading(false);
        }
      } catch (err: any) {
        console.warn('Session check failed or aborted:', err);
        setLoading(false);
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
        }
        return;
      }

      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id, session.user.email);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (uid: string, email?: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('uid', uid)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No profile found in database
          // Checks if there are pending registration details stored in localStorage
          if (email) {
            const pendingStr = localStorage.getItem(`pending_profile_${email.toLowerCase()}`);
            if (pendingStr) {
              try {
                const pendingData = JSON.parse(pendingStr);
                const profileData = {
                  uid: uid,
                  email: email,
                  display_name: pendingData.name || pendingData.display_name || email.split('@')[0],
                  role: pendingData.role,
                  phone_number: pendingData.phone || pendingData.phone_number || '',
                  business_name: pendingData.businessName || pendingData.business_name || '',
                  nuit: pendingData.nuit || '',
                  vehicle_type: pendingData.vehicleType || pendingData.vehicle_type || '',
                  license_plate: pendingData.licensePlate || pendingData.license_plate || '',
                  onboarding_completed: false,
                  is_verified: false,
                  created_at: new Date().toISOString(),
                };

                let newProfile = null;
                let insertError = null;
                try {
                  const { data, error } = await supabase
                    .from('profiles')
                    .upsert(profileData, { onConflict: 'uid' })
                    .select()
                    .single();
                  newProfile = data;
                  insertError = error;
                } catch (fetchErr: any) {
                  console.error('Falha de rede ao tentar criar o perfil no Supabase:', fetchErr);
                  insertError = { 
                    message: fetchErr.message || 'Falha de rede (TypeError: Failed to fetch). Por favor, certifique-se de que a base de dados SQL foi criada no Supabase.',
                    details: 'O erro pode ocorrer se as tabelas ainda não existirem ou por restrições CORS.'
                  };
                }

                if (!insertError && newProfile) {
                  localStorage.removeItem(`pending_profile_${email.toLowerCase()}`);
                  const mapped: UserProfile = {
                    ...newProfile,
                    displayName: newProfile.display_name,
                    avatarUrl: newProfile.avatar_url,
                    phoneNumber: newProfile.phone_number,
                    businessName: newProfile.business_name,
                    vehicleType: newProfile.vehicle_type,
                    licensePlate: newProfile.license_plate,
                    isVerified: newProfile.is_verified,
                    onboardingCompleted: newProfile.onboarding_completed,
                    referralLink: newProfile.referral_link,
                    createdAt: newProfile.created_at
                  };
                  setProfile(mapped);
                  return;
                } else {
                  console.error('Erro ao inserir perfil pendente:', insertError);
                }
              } catch (parseErr) {
                console.error('Error parsing pending profile info:', parseErr);
              }
            }
          }
          setProfile(null);
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
    }
  };

  const isAdmin = profile?.role === UserRole.ADMIN;

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, loginAsDemo, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
