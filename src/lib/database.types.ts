export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export type Seller = Database["public"]["Tables"]["sellers"]["Row"];
export type SellerInsert = Database["public"]["Tables"]["sellers"]["Insert"];
export type SellerUpdate = Database["public"]["Tables"]["sellers"]["Update"];

export type Passport = Database["public"]["Tables"]["passports"]["Row"];
export type PassportInsert = Database["public"]["Tables"]["passports"]["Insert"];
export type PassportUpdate = Database["public"]["Tables"]["passports"]["Update"];

export type PassportAttribute = Database["public"]["Tables"]["passport_attributes"]["Row"];
export type PassportAttributeInsert = Database["public"]["Tables"]["passport_attributes"]["Insert"];
export type PassportAttributeUpdate = Database["public"]["Tables"]["passport_attributes"]["Update"];

export type PassportHistory = Database["public"]["Tables"]["passport_history"]["Row"];
export type PassportHistoryInsert = Database["public"]["Tables"]["passport_history"]["Insert"];
export type PassportHistoryUpdate = Database["public"]["Tables"]["passport_history"]["Update"];

export type PassportReport = Database["public"]["Tables"]["passport_reports"]["Row"];
export type PassportReportInsert = Database["public"]["Tables"]["passport_reports"]["Insert"];
export type PassportReportUpdate = Database["public"]["Tables"]["passport_reports"]["Update"];

export type VerificationStatus = "Draft" | "Pending" | "Seller Verified" | "Rejected" | "Flagged";
export type WarrantyStatus =
  | "No Warranty"
  | "Store Warranty"
  | "Manufacturer Warranty"
  | "Third-Party Warranty";
export type SolanaCertificateStatus = "Not Minted" | "Pending" | "Minted" | "Failed";
export type QrStatus = "Not Ready" | "QR Ready" | "Disabled";
export type ReportStatus = "Open" | "Reviewing" | "Resolved" | "Rejected";

export type PassportWithPublicRelations = Passport & {
  passport_attributes: PassportAttribute[];
  passport_history: PassportHistory[];
};

export type PassportWithDashboardRelations = PassportWithPublicRelations & {
  passport_reports: PassportReport[];
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      sellers: {
        Row: {
          id: string;
          profile_id: string;
          seller_name: string;
          store_name: string;
          country: string | null;
          verification_status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          seller_name: string;
          store_name: string;
          country?: string | null;
          verification_status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          seller_name?: string;
          store_name?: string;
          country?: string | null;
          verification_status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sellers_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      passports: {
        Row: {
          id: string;
          passport_id: string;
          category: string;
          product_name: string;
          brand: string | null;
          model: string | null;
          condition: string | null;
          description: string | null;
          identifier_type: string | null;
          masked_identifier: string | null;
          identifier_hash: string | null;
          verification_status: string;
          warranty_status: string;
          warranty_period: string | null;
          warranty_expiry: string | null;
          seller_name: string;
          seller_id: string | null;
          owner_wallet: string | null;
          solana_certificate_status: string;
          solana_mint_address: string | null;
          solana_tx_signature: string | null;
          qr_status: string;
          public_link: string | null;
          is_published: boolean;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          passport_id?: string;
          category: string;
          product_name: string;
          brand?: string | null;
          model?: string | null;
          condition?: string | null;
          description?: string | null;
          identifier_type?: string | null;
          masked_identifier?: string | null;
          identifier_hash?: string | null;
          verification_status?: string;
          warranty_status?: string;
          warranty_period?: string | null;
          warranty_expiry?: string | null;
          seller_name: string;
          seller_id?: string | null;
          owner_wallet?: string | null;
          solana_certificate_status?: string;
          solana_mint_address?: string | null;
          solana_tx_signature?: string | null;
          qr_status?: string;
          public_link?: string | null;
          is_published?: boolean;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          passport_id?: string;
          category?: string;
          product_name?: string;
          brand?: string | null;
          model?: string | null;
          condition?: string | null;
          description?: string | null;
          identifier_type?: string | null;
          masked_identifier?: string | null;
          identifier_hash?: string | null;
          verification_status?: string;
          warranty_status?: string;
          warranty_period?: string | null;
          warranty_expiry?: string | null;
          seller_name?: string;
          seller_id?: string | null;
          owner_wallet?: string | null;
          solana_certificate_status?: string;
          solana_mint_address?: string | null;
          solana_tx_signature?: string | null;
          qr_status?: string;
          public_link?: string | null;
          is_published?: boolean;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "passports_seller_id_fkey";
            columns: ["seller_id"];
            isOneToOne: false;
            referencedRelation: "sellers";
            referencedColumns: ["id"];
          },
        ];
      };
      passport_attributes: {
        Row: {
          id: string;
          passport_id: string;
          attribute_key: string;
          attribute_value: string | null;
          attribute_type: string;
          is_public: boolean;
          sort_order: number;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          passport_id: string;
          attribute_key: string;
          attribute_value?: string | null;
          attribute_type?: string;
          is_public?: boolean;
          sort_order?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          passport_id?: string;
          attribute_key?: string;
          attribute_value?: string | null;
          attribute_type?: string;
          is_public?: boolean;
          sort_order?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "passport_attributes_passport_id_fkey";
            columns: ["passport_id"];
            isOneToOne: false;
            referencedRelation: "passports";
            referencedColumns: ["id"];
          },
        ];
      };
      passport_history: {
        Row: {
          id: string;
          passport_id: string;
          event_type: string;
          title: string;
          description: string | null;
          status: string;
          actor_profile_id: string | null;
          event_at: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          passport_id: string;
          event_type: string;
          title: string;
          description?: string | null;
          status?: string;
          actor_profile_id?: string | null;
          event_at?: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          passport_id?: string;
          event_type?: string;
          title?: string;
          description?: string | null;
          status?: string;
          actor_profile_id?: string | null;
          event_at?: string;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "passport_history_actor_profile_id_fkey";
            columns: ["actor_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "passport_history_passport_id_fkey";
            columns: ["passport_id"];
            isOneToOne: false;
            referencedRelation: "passports";
            referencedColumns: ["id"];
          },
        ];
      };
      passport_reports: {
        Row: {
          id: string;
          passport_id: string;
          reporter_profile_id: string | null;
          reporter_email: string | null;
          report_type: string;
          message: string;
          status: string;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          passport_id: string;
          reporter_profile_id?: string | null;
          reporter_email?: string | null;
          report_type?: string;
          message: string;
          status?: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          passport_id?: string;
          reporter_profile_id?: string | null;
          reporter_email?: string | null;
          report_type?: string;
          message?: string;
          status?: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "passport_reports_passport_id_fkey";
            columns: ["passport_id"];
            isOneToOne: false;
            referencedRelation: "passports";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "passport_reports_reporter_profile_id_fkey";
            columns: ["reporter_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_seller_id: {
        Args: Record<PropertyKey, never>;
        Returns: string | null;
      };
      generate_passport_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      is_passport_published: {
        Args: { passport_uuid: string };
        Returns: boolean;
      };
      owns_passport: {
        Args: { passport_uuid: string };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
