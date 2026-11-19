# Entity-Relationship Diagram (ERD) — Developer Sales OS

Skema database PostgreSQL: `sales_os`
Domain Target: `developerproperti.giivepro.com`

---

## 1. Visualisasi Mermaid ERD

```mermaid
erDiagram
    tenants ||--o{ projects : "memiliki"
    tenants ||--o{ users : "memiliki"
    tenants ||--o{ tenant_subscriptions : "berlangganan"
    tenants ||--o{ jobs : "menjalankan"
    tenants ||--o{ ai_usage : "mencatat_token"
    tenants ||--o{ audit_logs : "audit_trail"
    
    plans ||--o{ plan_features : "fitur_flags"
    plans ||--o{ tenant_subscriptions : "diberikan_ke"
    
    users ||--o{ users : "atasan_bawahan (SE->TL->SM)"
    users ||--o{ approvals : "menyetujui"
    
    projects ||--o{ clusters : "terdiri_dari"
    projects ||--o{ units : "memiliki_unit"
    projects ||--o{ project_files : "berkas_terstruktur"
    projects ||--o{ love_letters : "surat_cinta_99"
    projects ||--o{ approvals : "memerlukan_persetujuan"
    
    clusters ||--o{ units : "mengelompokkan"
    
    tenants {
        uuid id PK
        string slug UK
        string name
        string legal_name
        boolean is_active
        timestamp created_at
    }

    plans {
        uuid id PK
        string code UK
        string name
        numeric price
        string billing_period
        int max_active_projects
        int max_sales_users
    }

    plan_features {
        uuid id PK
        uuid plan_id FK
        string feature_key
        jsonb feature_value
        boolean is_enabled
    }

    users {
        uuid id PK
        uuid tenant_id FK
        string email UK
        string password_hash
        string name
        string role
        uuid manager_id FK
        boolean is_active
    }

    projects {
        uuid id PK
        uuid tenant_id FK
        string slug
        string name
        string project_type
        double latitude
        double longitude
        int total_units
        boolean is_public_case_study
    }

    clusters {
        uuid id PK
        uuid tenant_id FK
        uuid project_id FK
        string name
        double latitude
        double longitude
    }

    units {
        uuid id PK
        uuid tenant_id FK
        uuid project_id FK
        uuid cluster_id FK
        string unit_code
        string unit_type
        numeric land_area
        numeric building_area
        numeric price_cash_hard
        numeric price_cash_24m
        numeric price_kpr
        string status
    }

    love_letters {
        uuid id PK
        uuid tenant_id FK
        uuid project_id FK
        int version
        string title
        jsonb points_json
        int total_points
        boolean validator_passed
    }

    approvals {
        uuid id PK
        uuid tenant_id FK
        uuid project_id FK
        string module_name
        jsonb proposed_data
        uuid approver_id FK
        string status
    }
```

---

## 2. Hierarki Multi-Tenant & Aturan Isolasi

```
Tenant (Developer/PT)
 └── Subscriptions (Plan: Gold / Platinum / Diamond)
 └── Users (SUPERADMIN, OWNER, SM, TL, SE, DIGITAL_MARKETING)
      └── Hierarki Supervisi: SE -> TL (AI) -> SM (Semi-AI)
 └── Projects (The Park Townhouse Sukoharjo, dll)
      ├── Clusters (Nagoya, Osaka, Tokyo)
      │    └── Units (30 Unit Kavling)
      ├── Project Files (/storage/{tenant_id}/{project_id}/...)
      └── Love Letters (99 Poin Editorial Berversi v1, v2)
```

Setiap entitas bisnis mengikat `tenant_id` secara wajib dan difilter pada seluruh query pembacaan dan mutasi.
