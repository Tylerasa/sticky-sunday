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
  if(ticket_no.length !== 11){
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
        res.status(200).send("Valid Winning Ticket🚀");
        if(results[0].Paid){
          console.log("Paid winning Ticket🚀");
        }else{
          console.log("Valid winning Ticket🚀, yet to be paid.");

        }
      }
    }
  );
}


app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});
