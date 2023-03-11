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
        res.status(404).send("Ticket not found");
      } else {
        res.status(200).send("Valid Winning Ticket🚀");
        console.log("Valid Winning Ticket🚀");
      }
    }
  );
}


app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});
