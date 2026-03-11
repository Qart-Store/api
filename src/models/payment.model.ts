import { dbQuery } from "../config/db";

function generateReference() {
  return `QART-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

export async function initializePayment(
  customerId: string,
  orderId: string | null,
  amount: number,
  payload?: Record<string, unknown>,
) {
  const reference = generateReference();

  const result = await dbQuery<PaymentTransactionEntity>(
    `
      INSERT INTO payment_transactions(customer_id, order_id, reference, provider, status, amount, currency, payload)
      VALUES ($1,$2,$3,'paystack','pending',$4,'NGN',$5)
      RETURNING
        id,
        customer_id AS "customerId",
        order_id AS "orderId",
        reference,
        provider,
        status,
        amount::float8 AS amount,
        currency,
        payload,
        created_at AS "createdAt",
        updated_at AS "updatedAt";
    `,
    [customerId, orderId, reference, amount, payload ?? null],
  );

  return result.rows[0];
}

export async function getPaymentByReference(
  reference: string,
): Promise<PaymentTransactionEntity | null> {
  const result = await dbQuery<PaymentTransactionEntity>(
    `
      SELECT
        id,
        customer_id AS "customerId",
        order_id AS "orderId",
        reference,
        provider,
        status,
        amount::float8 AS amount,
        currency,
        payload,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM payment_transactions
      WHERE reference = $1
      LIMIT 1;
    `,
    [reference],
  );

  return result.rows[0] ?? null;
}

export async function markPaymentStatus(
  reference: string,
  status: PaymentTransactionEntity["status"],
  payload?: Record<string, unknown>,
) {
  const result = await dbQuery<PaymentTransactionEntity>(
    `
      UPDATE payment_transactions
      SET status = $2, payload = COALESCE($3, payload)
      WHERE reference = $1
      RETURNING
        id,
        customer_id AS "customerId",
        order_id AS "orderId",
        reference,
        provider,
        status,
        amount::float8 AS amount,
        currency,
        payload,
        created_at AS "createdAt",
        updated_at AS "updatedAt";
    `,
    [reference, status, payload ?? null],
  );

  return result.rows[0] ?? null;
}
