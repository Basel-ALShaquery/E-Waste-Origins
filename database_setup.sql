-- =============================================
-- COMPLETE DATABASE WITH FINAL FIX
-- =============================================

-- =============================================
-- USER PROFILES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;

CREATE POLICY "Users can view own profile"
ON public.user_profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.user_profiles
FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON public.user_profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.user_profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE id = auth.uid()
  )
);

-- =============================================
-- FUNCTION AND TRIGGER FIX
-- =============================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      split_part(NEW.email, '@', 1)
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- ADMIN USERS (FIXED - NO RECURSION)
-- =============================================

CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins view admin table" ON public.admin_users;

-- ✅ FIXED: استخدام auth.jwt() بدلاً من recursion
CREATE POLICY "Admins view admin table"
ON public.admin_users
FOR SELECT
USING (auth.jwt() ->> 'is_admin' = 'true');

-- =============================================
-- EWASTE ITEMS
-- =============================================

CREATE TABLE IF NOT EXISTS public.ewaste_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  device_type TEXT,
  quantity INTEGER DEFAULT 1,
  condition TEXT,
  description TEXT,
  photo_url TEXT,
  status TEXT DEFAULT 'pending',
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ewaste_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users ewaste select" ON public.ewaste_items;
DROP POLICY IF EXISTS "Users ewaste insert" ON public.ewaste_items;

CREATE POLICY "Users ewaste select"
ON public.ewaste_items
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users ewaste insert"
ON public.ewaste_items
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- =============================================
-- PICKUPS
-- =============================================

CREATE TABLE IF NOT EXISTS public.pickups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pickup_type TEXT,
  scheduled_date DATE,
  scheduled_time TEXT,
  address TEXT,
  phone TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.pickups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users pickups select" ON public.pickups;
DROP POLICY IF EXISTS "Users pickups insert" ON public.pickups;

CREATE POLICY "Users pickups select"
ON public.pickups
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users pickups insert"
ON public.pickups
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- =============================================
-- USER REWARDS
-- =============================================

CREATE TABLE IF NOT EXISTS public.user_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users rewards select" ON public.user_rewards;

CREATE POLICY "Users rewards select"
ON public.user_rewards
FOR SELECT
USING (auth.uid() = user_id);

-- =============================================
-- DROP LOCATIONS
-- =============================================

CREATE TABLE IF NOT EXISTS public.drop_off_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  address TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.drop_off_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Locations select" ON public.drop_off_locations;

CREATE POLICY "Locations select"
ON public.drop_off_locations
FOR SELECT
USING (true);

-- =============================================
-- SAMPLE LOCATION
-- =============================================

INSERT INTO public.drop_off_locations (name,address)
VALUES ('Cairo Recycling Center','Tahrir Square')
ON CONFLICT DO NOTHING;

-- =============================================
-- STORAGE POLICIES FOR EWASTE-IMAGES BUCKET
-- =============================================

-- 
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
CREATE POLICY "Public Read Access"
ON storage.objects
FOR SELECT
USING (bucket_id = 'ewaste-images');

-- Policy 
DROP POLICY IF EXISTS "Authenticated Users Upload" ON storage.objects;
CREATE POLICY "Authenticated Users Upload"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'ewaste-images' 
  AND auth.role() = 'authenticated'
);

-- Policy 
DROP POLICY IF EXISTS "Users Update Own Images" ON storage.objects;
CREATE POLICY "Users Update Own Images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'ewaste-images' 
  AND auth.uid() = owner
);

-- Policy 
DROP POLICY IF EXISTS "Users Delete Own Images" ON storage.objects;
CREATE POLICY "Users Delete Own Images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'ewaste-images' 
  AND auth.uid() = owner
);