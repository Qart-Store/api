import { dbQuery } from "../config/db";

const CUSTOMER_SELECT = `
  SELECT
    c.id,
    c.first_name AS "firstName",
    c.last_name AS "lastName",
    c.email,
    c.phone,
    c.is_active AS "isActive",
    c.is_email_verified AS "isEmailVerified",
    c.last_login_at AS "lastLoginAt",
    c.created_at AS "createdAt",
    c.updated_at AS "updatedAt"
  FROM customers c
`;

const CUSTOMER_WITH_PASSWORD_SELECT = `
  SELECT
    c.id,
    c.first_name AS "firstName",
    c.last_name AS "lastName",
    c.email,
    c.phone,
    c.is_active AS "isActive",
    c.is_email_verified AS "isEmailVerified",
    c.last_login_at AS "lastLoginAt",
    c.created_at AS "createdAt",
    c.updated_at AS "updatedAt",
    c.password_hash AS "passwordHash"
  FROM customers c
`;

export async function createCustomer(
  input: CreateCustomerInput,
): Promise<CustomerEntity> {
  const result = await dbQuery<CustomerEntity>(
    `
      INSERT INTO customers(first_name, last_name, email, password_hash, phone)
      VALUES ($1, $2, LOWER($3), $4, $5)
      RETURNING
        id,
        first_name AS "firstName",
        last_name AS "lastName",
        email,
        phone,
        is_active AS "isActive",
        is_email_verified AS "isEmailVerified",
        last_login_at AS "lastLoginAt",
        created_at AS "createdAt",
        updated_at AS "updatedAt";
    `,
    [
      input.firstName.trim(),
      input.lastName.trim(),
      input.email.trim(),
      input.passwordHash,
      input.phone ?? null,
    ],
  );

  return result.rows[0];
}

export async function findCustomerByEmailWithPassword(
  email: string,
): Promise<CustomerWithPasswordEntity | null> {
  const result = await dbQuery<CustomerWithPasswordEntity>(
    `${CUSTOMER_WITH_PASSWORD_SELECT} WHERE LOWER(c.email) = LOWER($1) LIMIT 1;`,
    [email.trim()],
  );

  return result.rows[0] ?? null;
}

export async function findCustomerByEmail(
  email: string,
): Promise<CustomerEntity | null> {
  const result = await dbQuery<CustomerEntity>(
    `${CUSTOMER_SELECT} WHERE LOWER(c.email) = LOWER($1) LIMIT 1;`,
    [email.trim()],
  );

  return result.rows[0] ?? null;
}

export async function findCustomerById(
  customerId: string,
): Promise<CustomerEntity | null> {
  const result = await dbQuery<CustomerEntity>(
    `${CUSTOMER_SELECT} WHERE c.id = $1 LIMIT 1;`,
    [customerId],
  );

  return result.rows[0] ?? null;
}

export async function updateCustomer(
  customerId: string,
  input: UpdateCustomerInput,
): Promise<CustomerEntity | null> {
  const existing = await findCustomerById(customerId);
  if (!existing) return null;

  const result = await dbQuery<CustomerEntity>(
    `
      UPDATE customers
      SET
        first_name = $2,
        last_name = $3,
        phone = $4,
        is_active = $5,
        is_email_verified = $6
      WHERE id = $1
      RETURNING
        id,
        first_name AS "firstName",
        last_name AS "lastName",
        email,
        phone,
        is_active AS "isActive",
        is_email_verified AS "isEmailVerified",
        last_login_at AS "lastLoginAt",
        created_at AS "createdAt",
        updated_at AS "updatedAt";
    `,
    [
      customerId,
      input.firstName ?? existing.firstName,
      input.lastName ?? existing.lastName,
      input.phone !== undefined ? input.phone : existing.phone,
      input.isActive ?? existing.isActive,
      input.isEmailVerified ?? existing.isEmailVerified,
    ],
  );

  return result.rows[0] ?? null;
}

export async function touchCustomerLastLogin(customerId: string) {
  await dbQuery(`UPDATE customers SET last_login_at = NOW() WHERE id = $1;`, [
    customerId,
  ]);
}

export async function listCustomerAddresses(
  customerId: string,
): Promise<CustomerAddressEntity[]> {
  const result = await dbQuery<CustomerAddressEntity>(
    `
      SELECT
        id,
        customer_id AS "customerId",
        label,
        recipient_name AS "recipientName",
        phone,
        country,
        state,
        city,
        address_line_1 AS "addressLine1",
        address_line_2 AS "addressLine2",
        postal_code AS "postalCode",
        is_default AS "isDefault",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM customer_addresses
      WHERE customer_id = $1
      ORDER BY is_default DESC, created_at ASC;
    `,
    [customerId],
  );

  return result.rows;
}

export async function createCustomerAddress(
  customerId: string,
  input: CreateCustomerAddressInput,
): Promise<CustomerAddressEntity> {
  if (input.isDefault) {
    await dbQuery(
      `UPDATE customer_addresses SET is_default = FALSE WHERE customer_id = $1;`,
      [customerId],
    );
  }

  const result = await dbQuery<CustomerAddressEntity>(
    `
      INSERT INTO customer_addresses(
        customer_id, label, recipient_name, phone, country, state, city,
        address_line_1, address_line_2, postal_code, is_default
      )
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING
        id,
        customer_id AS "customerId",
        label,
        recipient_name AS "recipientName",
        phone,
        country,
        state,
        city,
        address_line_1 AS "addressLine1",
        address_line_2 AS "addressLine2",
        postal_code AS "postalCode",
        is_default AS "isDefault",
        created_at AS "createdAt",
        updated_at AS "updatedAt";
    `,
    [
      customerId,
      input.label ?? null,
      input.recipientName.trim(),
      input.phone ?? null,
      input.country?.trim() || "Nigeria",
      input.state.trim(),
      input.city.trim(),
      input.addressLine1.trim(),
      input.addressLine2 ?? null,
      input.postalCode ?? null,
      Boolean(input.isDefault),
    ],
  );

  return result.rows[0];
}

export async function updateCustomerAddress(
  customerId: string,
  addressId: string,
  input: UpdateCustomerAddressInput,
): Promise<CustomerAddressEntity | null> {
  const existing = await dbQuery<CustomerAddressEntity>(
    `
      SELECT
        id,
        customer_id AS "customerId",
        label,
        recipient_name AS "recipientName",
        phone,
        country,
        state,
        city,
        address_line_1 AS "addressLine1",
        address_line_2 AS "addressLine2",
        postal_code AS "postalCode",
        is_default AS "isDefault",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM customer_addresses
      WHERE customer_id = $1 AND id = $2
      LIMIT 1;
    `,
    [customerId, addressId],
  );

  const row = existing.rows[0];
  if (!row) return null;

  if (input.isDefault) {
    await dbQuery(
      `UPDATE customer_addresses SET is_default = FALSE WHERE customer_id = $1;`,
      [customerId],
    );
  }

  const result = await dbQuery<CustomerAddressEntity>(
    `
      UPDATE customer_addresses
      SET
        label = $3,
        recipient_name = $4,
        phone = $5,
        country = $6,
        state = $7,
        city = $8,
        address_line_1 = $9,
        address_line_2 = $10,
        postal_code = $11,
        is_default = $12
      WHERE customer_id = $1 AND id = $2
      RETURNING
        id,
        customer_id AS "customerId",
        label,
        recipient_name AS "recipientName",
        phone,
        country,
        state,
        city,
        address_line_1 AS "addressLine1",
        address_line_2 AS "addressLine2",
        postal_code AS "postalCode",
        is_default AS "isDefault",
        created_at AS "createdAt",
        updated_at AS "updatedAt";
    `,
    [
      customerId,
      addressId,
      input.label !== undefined ? input.label : row.label,
      input.recipientName ?? row.recipientName,
      input.phone !== undefined ? input.phone : row.phone,
      input.country ?? row.country,
      input.state ?? row.state,
      input.city ?? row.city,
      input.addressLine1 ?? row.addressLine1,
      input.addressLine2 !== undefined ? input.addressLine2 : row.addressLine2,
      input.postalCode !== undefined ? input.postalCode : row.postalCode,
      input.isDefault !== undefined ? input.isDefault : row.isDefault,
    ],
  );

  return result.rows[0] ?? null;
}

export async function deleteCustomerAddress(
  customerId: string,
  addressId: string,
): Promise<boolean> {
  const result = await dbQuery(
    `DELETE FROM customer_addresses WHERE customer_id = $1 AND id = $2;`,
    [customerId, addressId],
  );

  return (result.rowCount ?? 0) > 0;
}
