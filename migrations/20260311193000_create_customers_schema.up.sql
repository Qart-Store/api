CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE
    IF NOT EXISTS customers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        phone TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
        last_login_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW (),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW ()
    );

CREATE TABLE
    IF NOT EXISTS customer_addresses (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
        customer_id UUID NOT NULL REFERENCES customers (id) ON DELETE CASCADE,
        label TEXT,
        recipient_name TEXT NOT NULL,
        phone TEXT,
        country TEXT NOT NULL DEFAULT 'Nigeria',
        state TEXT NOT NULL,
        city TEXT NOT NULL,
        address_line_1 TEXT NOT NULL,
        address_line_2 TEXT,
        postal_code TEXT,
        is_default BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW (),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW ()
    );

CREATE INDEX IF NOT EXISTS idx_customers_email ON customers (email);

CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer_id ON customer_addresses (customer_id);

CREATE INDEX IF NOT EXISTS idx_customer_addresses_is_default ON customer_addresses (customer_id, is_default);

DROP TRIGGER IF EXISTS trg_customers_updated_at ON customers;

CREATE TRIGGER trg_customers_updated_at BEFORE
UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION set_updated_at ();

DROP TRIGGER IF EXISTS trg_customer_addresses_updated_at ON customer_addresses;

CREATE TRIGGER trg_customer_addresses_updated_at BEFORE
UPDATE ON customer_addresses FOR EACH ROW EXECUTE FUNCTION set_updated_at ();