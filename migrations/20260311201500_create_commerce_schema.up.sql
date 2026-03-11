CREATE TABLE
    IF NOT EXISTS coupons (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
        code TEXT NOT NULL UNIQUE,
        discount_percent NUMERIC(5, 2) NOT NULL CHECK (
            discount_percent >= 0
            AND discount_percent <= 100
        ),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        expires_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW (),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW ()
    );

CREATE TABLE
    IF NOT EXISTS customer_cart_items (
        customer_id UUID NOT NULL REFERENCES customers (id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products (id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        color TEXT,
        size TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW (),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW (),
        PRIMARY KEY (customer_id, product_id)
    );

CREATE TABLE
    IF NOT EXISTS customer_wishlist_items (
        customer_id UUID NOT NULL REFERENCES customers (id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products (id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW (),
        PRIMARY KEY (customer_id, product_id)
    );

CREATE TABLE
    IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
        customer_id UUID NOT NULL REFERENCES customers (id) ON DELETE CASCADE,
        order_number TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL DEFAULT 'pending',
        subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
        delivery_fee NUMERIC(12, 2) NOT NULL DEFAULT 0,
        service_fee NUMERIC(12, 2) NOT NULL DEFAULT 0,
        discount NUMERIC(12, 2) NOT NULL DEFAULT 0,
        total NUMERIC(12, 2) NOT NULL DEFAULT 0,
        coupon_code TEXT,
        shipping_full_name TEXT,
        shipping_email TEXT,
        shipping_phone TEXT,
        shipping_location TEXT,
        shipping_address JSONB,
        notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW (),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW (),
        CONSTRAINT orders_status_check CHECK (
            status IN (
                'pending',
                'paid',
                'processing',
                'shipped',
                'delivered',
                'cancelled',
                'failed'
            )
        )
    );

CREATE TABLE
    IF NOT EXISTS order_items (
        id BIGSERIAL PRIMARY KEY,
        order_id UUID NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
        product_id UUID REFERENCES products (id) ON DELETE SET NULL,
        product_name TEXT NOT NULL,
        sku TEXT,
        color TEXT,
        size TEXT,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
        line_total NUMERIC(12, 2) NOT NULL CHECK (line_total >= 0),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW ()
    );

CREATE TABLE
    IF NOT EXISTS payment_transactions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
        customer_id UUID NOT NULL REFERENCES customers (id) ON DELETE CASCADE,
        order_id UUID REFERENCES orders (id) ON DELETE SET NULL,
        reference TEXT NOT NULL UNIQUE,
        provider TEXT NOT NULL DEFAULT 'paystack',
        status TEXT NOT NULL DEFAULT 'pending',
        amount NUMERIC(12, 2) NOT NULL,
        currency TEXT NOT NULL DEFAULT 'NGN',
        payload JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW (),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW (),
        CONSTRAINT payment_transactions_status_check CHECK (
            status IN ('pending', 'success', 'failed', 'abandoned')
        )
    );

CREATE INDEX IF NOT EXISTS idx_customer_cart_items_customer_id ON customer_cart_items (customer_id);

CREATE INDEX IF NOT EXISTS idx_customer_wishlist_items_customer_id ON customer_wishlist_items (customer_id);

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders (customer_id);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items (order_id);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_customer_id ON payment_transactions (customer_id);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON payment_transactions (order_id);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_reference ON payment_transactions (reference);

DROP TRIGGER IF EXISTS trg_coupons_updated_at ON coupons;

CREATE TRIGGER trg_coupons_updated_at BEFORE
UPDATE ON coupons FOR EACH ROW EXECUTE FUNCTION set_updated_at ();

DROP TRIGGER IF EXISTS trg_customer_cart_items_updated_at ON customer_cart_items;

CREATE TRIGGER trg_customer_cart_items_updated_at BEFORE
UPDATE ON customer_cart_items FOR EACH ROW EXECUTE FUNCTION set_updated_at ();

DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;

CREATE TRIGGER trg_orders_updated_at BEFORE
UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION set_updated_at ();

DROP TRIGGER IF EXISTS trg_payment_transactions_updated_at ON payment_transactions;

CREATE TRIGGER trg_payment_transactions_updated_at BEFORE
UPDATE ON payment_transactions FOR EACH ROW EXECUTE FUNCTION set_updated_at ();

INSERT INTO
    coupons (code, discount_percent, is_active)
VALUES
    ('QART10', 10, TRUE),
    ('SAVE10', 10, TRUE),
    ('WELCOME10', 10, TRUE) ON CONFLICT (code) DO NOTHING;