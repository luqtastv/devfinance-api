import { pool } from "../database.js";
import { nanoid } from "nanoid";

function getAllTransactions(req, res) {
  const requestQuery = req.query;
  let parsedAmount = null;
  const allowedRequests = [
    "type",
    "category",
    "amount",
    "init_date",
    "end_date",
  ];
  const isAllowedQuery = Object.keys(requestQuery).every((key) =>
    allowedRequests.includes(key),
  );

  if (!isAllowedQuery) {
    return res.status(400).json({ message: "Invalid query parameter" });
  }

  if (requestQuery.amount !== undefined) {
    parsedAmount = Number(requestQuery.amount);

    if (requestQuery.amount.trim() == "" || !Number.isFinite(parsedAmount)) {
      return res.status(400).json({ message: "Amount must be a valid number" });
    }
  }

  const query = `SELECT * FROM transactions
    WHERE ($1::text IS NULL OR LOWER(type) = LOWER($1))
    AND ($2::text IS NULL OR category = $2)
    AND ($3::numeric IS NULL OR amount = $3)
    AND ($4::text IS NULL OR created_at >= $4::timestamp)
    AND ($5::text IS NULL OR created_at < $5::timestamp + INTERVAL '1 day')`;

  const filterValues = [
    requestQuery.type || null,
    requestQuery.category || null,
    parsedAmount,
    requestQuery.init_date || null,
    requestQuery.end_date || null,
  ];
  pool.query(query, filterValues, (error, results) => {
    if (error) {
      res
        .status(500)
        .json({ message: "Error fetching transactions", error: error.message });
    } else {
      res.status(200).json({
        message: "Transactions fetched successfully",
        data: results.rows,
      });
    }
  });
}

function createTransaction(req, res) {
  const { description, amount, type, category } = req.body;
  const date = new Date().toISOString();
  const nano_id = nanoid();
  pool.query(
    "INSERT INTO transactions (description, amount, type, category, updated_at, nano_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
    [description, amount, type, category, date, nano_id],
    (error, results) => {
      if (error) {
        res.status(500).json({
          message: "Error creating transaction",
          error: error.message,
        });
      } else {
        res.status(201).json({
          message: "Transaction created successfully",
          data: results.rows[0],
        });
      }
    },
  );
}

// fetch:summary

// init=2026-10-28&end=2026-10-29

function generateSummary(req, res) {
  const requestQuery = req.query;
  const query = `SELECT 
  COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS total_income,
  COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expense,
  COALESCE(SUM(CASE WHEN type = 'income' THEN amount WHEN type = 'expense' THEN -amount ELSE 0 END), 0) AS balance,
  COUNT(*) AS total_transactions
  FROM transactions
  WHERE ($1::text IS NULL OR created_at >= $1::timestamp)
  AND ($2::text IS NULL OR created_at < $2::timestamp + INTERVAL '1 day')`;

  const dateValues = [
    requestQuery.init_date || null,
    requestQuery.end_date || null,
  ];

  pool.query(query, dateValues, (error, results) => {
    if (error) {
      res
        .status(500)
        .json({ message: "Cannot find a summary", error: error.message });
    } else {
      res.status(200).json({
        message: "Summary fetched successfully",
        data: results.rows[0],
      });
    }
  });
}

// fetch:nano_id

function getTransactionById(req, res) {
  const { id } = req.params;
  pool.query(
    "SELECT * FROM transactions WHERE nano_id = $1",
    [id],
    (error, results) => {
      if (error) {
        res.status(500).json({
          message: "Error to found transaction",
          error: error.message,
        });
      } else if (results.rowCount == 0) {
        res.status(404).json({ message: "Transaction not found" });
      } else {
        res.status(200).json({
          message: "Transaction successfully found",
          data: results.rows[0],
        });
      }
    },
  );
}

function patchTransaction(req, res) {
  const { id } = req.params;
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({
      message: "Request body cannot be empty",
    });
  }

  const data = Object.entries(req.body);
  data.push(["updated_at", new Date().toISOString()]);

  const setClause = data
    .map(([field], index) => `${field} = $${index + 1}`)
    .join(", ");
  const values = data.map(([, value]) => value);
  values.push(id);

  const query = `UPDATE transactions
        SET ${setClause} WHERE nano_id = $${values.length} RETURNING *`;

  pool.query(query, values, (error, results) => {
    if (error) {
      res
        .status(500)
        .json({ message: "Error to do patch", error: error.message });
    } else if (results.rowCount === 0) {
      res.status(404).json({ message: "Error to do patch" });
    } else {
      res
        .status(200)
        .json({ message: "Patched with successfully", data: results.rows[0] });
    }
  });
}

function deleteTransaction(req, res) {
  const { id } = req.params;
  pool.query(
    "DELETE FROM transactions WHERE nano_id = $1 RETURNING *",
    [id],
    (error, results) => {
      if (error) {
        res.status(500).json({
          message: "Error deleting transaction",
          error: error.message,
        });
      } else if (results.rowCount === 0) {
        res.status(404).json({ message: "Transaction not found" });
      } else {
        res.status(200).json({
          message: "Transaction deleted successfully",
          data: results.rows[0],
        });
      }
    },
  );
}

export {
  getAllTransactions,
  createTransaction,

  // fetch/summary
  generateSummary,

  // fetch/:id
  getTransactionById,
  patchTransaction,
  deleteTransaction,
};
