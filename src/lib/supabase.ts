import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface AppUser {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  status: string;
  permissions: any;
  last_login: string | null;
  created_at: string;
  updated_at: string;
  phone: string | null;
  name: string | null;
  company_name: string | null;
  invited_by: string | null;
}

export interface Publisher {
  id: string;
  name: string;
  domain: string;
  network_code: string | null;
  contact_email: string | null;
  partner_id: string | null;
  mcm_parent_id: string | null;
  gam_status: string | null;
  service_key_status: string | null;
  service_key_last_check: string | null;
  admin_approved: boolean | null;
  approved_at: string | null;
  approval_notes: string | null;
  last_revenue: number | null;
  last_ecpm: number | null;
  last_ctr: number | null;
  last_fill_rate: number | null;
  metrics_updated_at: string | null;
  mfa_score: number | null;
  created_at: string;
  updated_at: string;
  site_audits?: SiteAudit[];
}

export interface SiteAudit {
  id: string;
  publisher_id: string;
  site_name: string;
  status: string;
  risk_score: number | null;
  is_directory: boolean | null;
  directory_type: string | null;
  directory_confidence: number | null;
  directory_data: any;
  created_at: string;
  updated_at: string;
}

export interface Alert {
  id: string;
  publisher_id: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  details: any;
  auto_actions_taken: any;
  status: string;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  publishers?: {
    name: string;
    domain: string;
  };
}

export interface ApprovalLog {
  id: string;
  publisher_id: string;
  user_id: string;
  action: string;
  old_status: string | null;
  new_status: string | null;
  notes: string | null;
  created_at: string;
}

export type UserRole = 'super_admin' | 'admin' | 'partner' | 'mcm_parent';

export interface MCMParent {
  id: string;
  name: string;
  parent_network_code: string;
  service_account_email: string;
  max_child_accounts: number;
  current_child_count: number;
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Invitation {
  id: string;
  email: string;
  role: UserRole;
  status: string;
  token: string;
  expires_at: string;
  created_at: string;
  metadata: any;
  partner_id?: string | null;
  invited_by: string;
  accepted_at?: string | null;
}

export interface Partner {
  id: string;
  name: string;
  email: string | null;
  status: string;
  full_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  details: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export const authHelpers = {
  async signUp(email: string, password: string, metadata?: Record<string, any>) {
    return supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
  },

  async signIn(email: string, password: string) {
    return supabase.auth.signInWithPassword({
      email,
      password,
    });
  },

  async signInWithOTP(email: string) {
    return supabase.auth.signInWithOtp({
      email,
    });
  },

  async signOut() {
    return supabase.auth.signOut();
  },

  async resetPassword(email: string) {
    return supabase.auth.resetPasswordForEmail(email);
  },

  async updatePassword(newPassword: string) {
    return supabase.auth.updateUser({
      password: newPassword,
    });
  },

  async getSession() {
    return supabase.auth.getSession();
  },

  async getUser() {
    return supabase.auth.getUser();
  },
};
