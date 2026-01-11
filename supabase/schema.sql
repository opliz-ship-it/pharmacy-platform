-- Enable necessary extensions
create extension if not exists "vector" with schema public; -- Prepared for RAG embeddings
create extension if not exists "uuid-ossp";

-- 1. Users Table (Digital Twin Model)
-- Stores comprehensive medical profile and real-time bio-data.
create table public.users (
  id uuid references auth.users not null primary key,
  full_name text not null,
  email text,
  
  -- Medical Profile
  medical_history jsonb default '{}'::jsonb, -- e.g., [{"condition": "Hypertension", "diagnosed_at": "2020-01-01"}]
  chronic_conditions text[], -- Array of strings for fast lookup e.g., ['Diabetes', 'Asthma']
  allergies text[], -- Array of strings e.g., ['Penicillin', 'Peanuts']
  
  -- Real-time Bio-data (Digital Twin)
  -- In a production system, this might be a separate time-series table, 
  -- but for this schema we store the latest snapshot or a summary.
  bio_data jsonb default '{
    "heart_rate_avg": null,
    "sleep_hours_avg": null,
    "last_updated": null
  }'::jsonb,

  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Medicines Table (Smart Inventory)
-- Linked by active ingredients to prevent brand-name duplication issues.
create table public.medicines (
  id uuid default uuid_generate_v4() primary key,
  brand_name text not null,
  generic_name text not null,
  
  -- Smart Inventory Logic
  active_ingredients text[] not null, -- e.g., ['Paracetamol', 'Caffeine']
  dosage_form text not null, -- e.g., 'Tablet', 'Syrup'
  strength text not null, -- e.g., '500mg'
  
  -- Safety Data
  contraindications text[] default '{}', -- e.g., ['Liver Disease', 'Alcoholism']
  side_effects text[] default '{}',
  storage_temperature_celsius numeric, -- For cold chain monitoring
  
  -- Inventory
  stock_quantity integer default 0,
  price numeric(10, 2) not null,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. AI Consultations Table (Safety Layer & RAG Logs)
-- Tracks every AI suggestion and the safety checks performed.
create table public.ai_consultations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  
  -- Interaction Data
  user_symptoms text not null,
  ai_suggestion text, -- The initial suggestion from the LLM
  
  -- Safety Layer
  safety_report jsonb, -- The output of validateMedicationSafety
  is_safe boolean default false,
  pharmacist_approval boolean default false, -- Human-in-the-loop
  pharmacist_notes text,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Orders Table (Logistics & Cold Chain)
create table public.orders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) not null,
  
  -- We use a JSONB for line items to simplify for this demo, 
  -- or we could use an order_items join table.
  items jsonb not null, -- [{"medicine_id": "...", "quantity": 1}]
  
  status text default 'pending' check (status in ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  
  -- Cold Chain Monitoring
  temperature_logs jsonb default '[]'::jsonb, -- [{"timestamp": "...", "temp_c": 4.5}]
  
  total_amount numeric(10, 2) not null,
  delivery_address text,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for performance
create index idx_medicines_active_ingredients on public.medicines using gin(active_ingredients);
create index idx_medicines_brand_name on public.medicines(brand_name);
create index idx_users_chronic_conditions on public.users using gin(chronic_conditions);
