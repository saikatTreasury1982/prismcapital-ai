import { createClient } from '@/utils/supabase/client';
import { CURRENT_USER_ID } from '@/app/lib/auth';

export interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  residentCountry: string;
  homeCurrency: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export async function signUp(data: SignUpData) {
  const supabase = createClient();

  // 1. Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
  });

  if (authError) {
    throw new Error(`Authentication failed: ${authError.message}`);
  }

  if (!authData.user) {
    throw new Error('User creation failed');
  }

  // 2. Create user profile
  const { error: profileError } = await supabase.from('users').insert({
    auth_user_id: authData.user.id,
    email: data.email,
    first_name: data.firstName,
    last_name: data.lastName,
    middle_name: data.middleName || null,
    resident_country: data.residentCountry,
    home_currency: data.homeCurrency,
    is_active: true,
  });

  if (profileError) {
    throw new Error(`Profile creation failed: ${profileError.message}`);
  }

  return { user: authData.user };
}

export async function signIn(data: SignInData) {
  const supabase = createClient();

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) {
    throw new Error(`Sign in failed: ${error.message}`);
  }

  return { user: authData.user };
}

export async function signOut() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    throw new Error(`Sign out failed: ${error.message}`);
  }
}

export async function getCurrentUser() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}