import { pool } from "../database.js";
import { nanoid } from "nanoid";

function getAllTransactions(_, res) {
  pool.query("SELECT * FROM transactions", (error, results) => {
    if (error) {
      res
        .status(500)
        .json({ message: "Error fetching transactions", error: error.message });
    } else {
      res
        .status(200)
        .json({
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
    "INSERT INTO transactions (description, amount, type, category, date, nano_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
    [description, amount, type, category, date, nano_id],
    (error, results) => {
      if (error) {
        res
          .status(500)
          .json({
            message: "Error creating transaction",
            error: error.message,
          });
      } else {
        res
          .status(201)
          .json({
            message: "Transaction created successfully",
            data: results.rows[0],
          });
      }
    },
  );
}

// fetch:nano_id

function getTransactionById(req, res) {
  const { id } = req.params;
  pool.query(
    "SELECT * FROM transactions WHERE nano_id = $1",
    [id],
    (error, results) => {
      if (error) {
        res
          .status(500)
          .json({
            message: "Error to found transaction",
            error: error.message,
          });
      } else if (results.rowCount == 0) {
        res.status(404).json({ message: "Transaction not found" });
      } else {
        res
          .status(200)
          .json({
            message: "Transaction successfully found",
            data: results.rows[0],
          });
      }
    },
  );
}

function patchTransaction(req, res) {
  const { id } = req.params;
  const data = Object.entries(req.body);

    const setClause = data
        .map(([field], index) => `${field} = $${index + 1}`)
    .join(", ");
  const values = data.map(([, value]) => value);
  values.push(id);

  const query = `UPDATE transactions
        SET ${setClause} WHERE nano_id = $${values.length}`;

    pool.query(query, values, (error, results) => {
    if (error) {
      res
        .status(400)
        .json({ message: "Error to do patch", error: error.message });
    } else {
      res
        .status(200)
        .json({ message: "Patched with successfully", data: results.rows });
    }
  });
}

function deleteTransaction(req, res) {
  const { id } = req.params;
  pool.query(
    "DELETE FROM transactions WHERE id = $1 RETURNING *",
    [id],
    (error, results) => {
      if (error) {
        res
          .status(500)
          .json({
            message: "Error deleting transaction",
            error: error.message,
          });
      } else if (results.rowCount === 0) {
        res.status(404).json({ message: "Transaction not found" });
      } else {
        res
          .status(200)
          .json({
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

  // fetch/:id
  getTransactionById,
  patchTransaction,
  deleteTransaction,
};
