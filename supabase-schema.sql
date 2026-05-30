-- ====================================================================
-- MOZPROSERVICES - SUPABASE DATABASES & SECURITY RULES SCHEMA
-- ====================================================================
-- Este ficheiro contém o código SQL necessário para criar as tabelas,
-- relações, restrições e Políticas de Segurança de Nível de Linha (RLS)
-- no editor SQL do Supabase (https://supabase.com).
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. TIPOS DE DADOS / ENUMS PERSONALIZADOS
-- --------------------------------------------------------------------
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM (
            'customer', 
            'seller_micro', 
            'seller_macro', 
            'deliverer', 
            'affiliate', 
            'service_provider', 
            'admin'
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE order_status AS ENUM (
            'pending', 
            'accepted', 
            'picked_up', 
            'delivering', 
            'completed', 
            'cancelled'
        );
    END IF;
END $$;

-- --------------------------------------------------------------------
-- 2. CRIAÇÃO DAS TABELAS DO SISTEMA
-- --------------------------------------------------------------------

-- Tabela: PROFILES (Perfis de Utilizadores)
CREATE TABLE IF NOT EXISTS public.profiles (
    uid UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    role TEXT NOT NULL DEFAULT 'customer', -- Guardado como texto para facilitar integração ou mapeamento
    avatar_url TEXT,
    phone_number TEXT,
    location JSONB, -- { lat: float, lng: float, address: text }
    business_name TEXT,
    nuit TEXT,
    vehicle_type TEXT,
    license_plate TEXT,
    commission NUMERIC(10, 2) DEFAULT 0.00,
    referral_link TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    interests TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela: PRODUCTS (Produtos do Marketplace)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    category TEXT NOT NULL,
    image_url TEXT,
    seller_id UUID REFERENCES public.profiles(uid) ON DELETE CASCADE NOT NULL,
    rating NUMERIC(3, 2) DEFAULT 5.00,
    reviews_count INTEGER DEFAULT 0,
    moderation_status TEXT DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'suspended')),
    stock INTEGER DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela: SERVICES (Serviços Oferecidos)
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price_per_hour NUMERIC(10, 2) NOT NULL CHECK (price_per_hour >= 0),
    category TEXT NOT NULL,
    image_url TEXT,
    provider_id UUID REFERENCES public.profiles(uid) ON DELETE CASCADE NOT NULL,
    rating NUMERIC(3, 2) DEFAULT 5.00,
    reviews_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela: ORDERS (Encomendas de Produtos/Serviços/Alimentação Directa)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.profiles(uid) ON DELETE SET NULL,
    items JSONB NOT NULL, -- Array de itens: [{ id: String, quantity: Integer, price: Numeric, name: String }]
    total_price NUMERIC(10, 2) NOT NULL CHECK (total_price >= 0),
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending'|'accepted'|'picked_up'|'delivering'|'completed'|'cancelled'
    type TEXT NOT NULL DEFAULT 'product', -- 'product' | 'service' | 'food'
    seller_id UUID REFERENCES public.profiles(uid) ON DELETE SET NULL,
    deliverer_id UUID REFERENCES public.profiles(uid) ON DELETE SET NULL,
    delivery_address TEXT NOT NULL,
    location JSONB, -- { lat: float, lng: float }
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela: WALLETS (Saldos/Carteiras Virtuais dos Utilizadores)
CREATE TABLE IF NOT EXISTS public.wallets (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(uid) ON DELETE CASCADE,
    available_balance NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    pending_balance NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    currency TEXT DEFAULT 'MZN' NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela: TRANSACTIONS (Registo de Transações Financeiras)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(uid) ON DELETE CASCADE NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    fee NUMERIC(10, 2) DEFAULT 0.00,
    net_amount NUMERIC(10, 2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('credit', 'debit', 'commission', 'payout')),
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'cancelled')),
    description TEXT,
    related_order_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela: PAYOUTS (Pedidos de Levantamento / Saques)
CREATE TABLE IF NOT EXISTS public.payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(uid) ON DELETE CASCADE NOT NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    method TEXT NOT NULL CHECK (method IN ('mpesa', 'emola', 'bank')),
    method_details TEXT NOT NULL, -- Número de Telefone ou IBAN Bancário
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- Tabela: SUPPORT_TICKETS (Suporte ao Cliente e Ouvidoria)
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(uid) ON DELETE CASCADE NOT NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'resolved', 'closed')),
    category TEXT NOT NULL CHECK (category IN ('complaint', 'suggestion', 'help', 'billing', 'technical')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 3. GATILHOS AUTOMÁTICOS (TRIGGERS) PARA INTEGRAÇÃO AUTH -> PUBLIC
-- --------------------------------------------------------------------

-- Criar Carteira Automática quando Criar Perfil
CREATE OR REPLACE FUNCTION public.create_wallet_for_new_profile()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.wallets (user_id, available_balance, pending_balance, currency)
    VALUES (new.uid, 0.00, 0.00, 'MZN')
    ON CONFLICT (user_id) DO NOTHING;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_profile_created
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.create_wallet_for_new_profile();

-- Trigger automático para criar Perfil Público aquando de Signup no Auth
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (uid, email, display_name, role, onboarding_completed, is_verified)
    VALUES (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        coalesce(new.raw_user_meta_data->>'role', 'customer'),
        FALSE,
        FALSE
    )
    ON CONFLICT (uid) DO NOTHING;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_signup
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();


-- --------------------------------------------------------------------
-- 4. SEGURANÇA E POLÍTICAS DE RLS (ROW LEVEL SECURITY)
-- --------------------------------------------------------------------

-- Activar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS: PROFILES
CREATE POLICY "Qualquer pessoa pode ler perfis" 
    ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Utilizadores autenticados criam ou atualizam o seu próprio perfil" 
    ON public.profiles FOR ALL 
    TO authenticated 
    USING (auth.uid() = uid) 
    WITH CHECK (auth.uid() = uid);

CREATE POLICY "Administradores têm controlo total sobre perfis" 
    ON public.profiles FOR ALL 
    TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE uid = auth.uid() AND role = 'admin'));

-- POLÍTICAS: PRODUCTS
CREATE POLICY "Produtos aprovados são públicos" 
    ON public.products FOR SELECT 
    USING (moderation_status = 'approved' OR auth.uid() = seller_id);

CREATE POLICY "Vendedores podem gerir os seus próprios produtos" 
    ON public.products FOR ALL 
    TO authenticated 
    USING (auth.uid() = seller_id) 
    WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Admins podem moderar todos os produtos" 
    ON public.products FOR ALL 
    TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE uid = auth.uid() AND role = 'admin'));

-- POLÍTICAS: SERVICES
CREATE POLICY "Serviços são visíveis publicamente" 
    ON public.services FOR SELECT 
    USING (true);

CREATE POLICY "Prestadores gerem os seus próprios serviços" 
    ON public.services FOR ALL 
    TO authenticated 
    USING (auth.uid() = provider_id) 
    WITH CHECK (auth.uid() = provider_id);

-- POLÍTICAS: ORDERS
CREATE POLICY "Utilizadores veem encomendas relacionadas a si mesmos" 
    ON public.orders FOR SELECT 
    TO authenticated 
    USING (auth.uid() = customer_id OR auth.uid() = seller_id OR auth.uid() = deliverer_id);

CREATE POLICY "Clientes podem submeter encomendas" 
    ON public.orders FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Atores atribuídos podem atualizar estado" 
    ON public.orders FOR UPDATE 
    TO authenticated 
    USING (auth.uid() = customer_id OR auth.uid() = seller_id OR auth.uid() = deliverer_id);

-- POLÍTICAS: WALLETS
CREATE POLICY "Visualização de carteiras" 
    ON public.wallets FOR SELECT 
    TO authenticated 
    USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE uid = auth.uid() AND role = 'admin'));

-- POLÍTICAS: TRANSACTIONS
CREATE POLICY "Utilizadores veem as suas transações" 
    ON public.transactions FOR SELECT 
    TO authenticated 
    USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE uid = auth.uid() AND role = 'admin'));

-- POLÍTICAS: PAYOUTS
CREATE POLICY "Visualização de saques" 
    ON public.payouts FOR SELECT 
    TO authenticated 
    USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE uid = auth.uid() AND role = 'admin'));

CREATE POLICY "Criar pedido de saque" 
    ON public.payouts FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() = user_id);

-- POLÍTICAS: SUPPORT_TICKETS
CREATE POLICY "Ver bilhetes de suporte próprios" 
    ON public.support_tickets FOR SELECT 
    TO authenticated 
    USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE uid = auth.uid() AND role = 'admin'));

CREATE POLICY "Criar bilhete de suporte" 
    ON public.support_tickets FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() = user_id);

-- --------------------------------------------------------------------
-- 5. TABELA DE AVALIAÇÕES E REVISÕES (RATINGS & REVIEWS)
-- --------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.profiles(uid) ON DELETE SET NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT one_target_check CHECK (
        (product_id IS NOT NULL AND service_id IS NULL) OR 
        (service_id IS NOT NULL AND product_id IS NULL)
    )
);

-- Ativar RLS em reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Avaliações são de visualização pública" 
    ON public.reviews FOR SELECT 
    USING (true);

CREATE POLICY "Clientes autenticados podem criar as suas avaliações" 
    ON public.reviews FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() = customer_id);

-- Função de gatilho para recalcular de forma automatizada o rating médio e número total de reviews
CREATE OR REPLACE FUNCTION public.recalculate_rating_on_review()
RETURNS trigger AS $$
BEGIN
    IF NEW.product_id IS NOT NULL THEN
        UPDATE public.products
        SET 
            rating = (SELECT ROUND(coalesce(avg(rating), 5.0), 2) FROM public.reviews WHERE product_id = NEW.product_id),
            reviews_count = (SELECT count(*) FROM public.reviews WHERE product_id = NEW.product_id)
        WHERE id = NEW.product_id;
    ELSIF NEW.service_id IS NOT NULL THEN
        UPDATE public.services
        SET 
            rating = (SELECT ROUND(coalesce(avg(rating), 5.0), 2) FROM public.reviews WHERE service_id = NEW.service_id),
            reviews_count = (SELECT count(*) FROM public.reviews WHERE service_id = NEW.service_id)
        WHERE id = NEW.service_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_review_added
    AFTER INSERT ON public.reviews
    FOR EACH ROW EXECUTE FUNCTION public.recalculate_rating_on_review();

