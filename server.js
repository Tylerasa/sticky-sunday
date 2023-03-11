const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
require("dotenv").config();

const app = express();

const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "password",
  database: "simnet",
  connectionLimit: 10,
});

// app.get("/add-column", (req, res) => {
//   pool.query(
//     "ALTER TABLE tickets ADD COLUMN PaidDate_Time datetime DEFAULT NULL",
//     (error, results, fields) => {
//       if (error) throw error;
//       console.log("PaidDate_Time column added to tickets table!");
//     }
//   );
// });

app.post("/validate-ticket", (req, res) => {
  const { ticket_no } = req.body;
  if (ticket_no.length !== 11) {
    return res.status(404).send("Incorrect ticket length");
  }
  pool.query(
    "SELECT * FROM tickets WHERE TicketNumber = ?",
    [ticket_no],
    (error, results, fields) => {
      if (error) throw error;

      if (results.length === 0) {
        res.status(404).send("Ticket not found");
      } else {
        is_valid_winning_ticket(ticket_no, res);
      }
    }
  );
});

function is_valid_winning_ticket(ticket_no, res) {
  pool.query(
    "SELECT * FROM winning_tickets WHERE Ticket_Code = ?",
    [ticket_no],
    (error, results, fields) => {
      if (error) throw error;

      if (results.length === 0) {
        res.status(404).send("Ticket valid but not a winning ticket.");
      } else {
        if (results[0].Paid == 1) {
          console.log("This winning ticket has already being paid.");
          res.status(200).send("This winning ticket has already being paid.");
        } else if (results[0].Paid == 0) {
          // res.status(200).send("Valid winning Ticket🚀, yet to be paid.");
          console.log("Valid winning Ticket🚀, yet to be paid.");
          make_payment(ticket_no);
        } else {
          res.status(200).send("Winning ticket, null paid field.");
          console.log("Winning ticket, null paid field.");
        }
      }
    }
  );
}

async function make_payment(ticket_no) {
  try {
    pool.query("START TRANSACTION");

    pool.query(
      "UPDATE winning_tickets SET Paid = 1, PaidDate_Time = NOW() WHERE Ticket_Code = ?",
      [ticket_no]
    );

    pool.query(
      "UPDATE tickets SET Paid = 1, PaidDate_Time = NOW() WHERE TicketNumber = ?",
      [ticket_no]
    );

    pool.query("COMMIT");

    console.log("Paid column updated successfully");
    res.status(404).send("Paid column updated successfully✔️");

  } catch (error) {
    pool.query("ROLLBACK");
    console.log("Error occurred while updating Paid column:", error.message);
  } 
}

app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});
