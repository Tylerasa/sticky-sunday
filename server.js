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


//run this to add new columns
app.get("/add-info-column", (req, res) => {
  pool.query(
    `
    ALTER TABLE tickets 
     ADD COLUMN Surname varchar(255) DEFAULT NULL,
     ADD COLUMN FirstName varchar(255) DEFAULT NULL,
     ADD COLUMN PhoneNumber varchar(14) DEFAULT NULL,
     ADD COLUMN PhoneNetwork varchar(10) DEFAULT NULL,
     ADD COLUMN IdType varchar(30) DEFAULT NULL,
     ADD COLUMN IdNumber varchar(30) DEFAULT NULL,
     ADD COLUMN method varchar(30) DEFAULT NULL;
    `,
    (error, results, fields) => {
      if (error) throw error;
      console.log("New columns added to tickets table!");
      return res.status(200).send("New columns added to tickets table");
    }
  );
});

app.post("/validate-ticket", (req, res) => {
  const { ticket_no } = req.body;
  if (ticket_no.length !== 11) {
    return res.status(400).send("Incorrect ticket length");
  }
});

app.post("/make-payment", async (req, res) => {
  const {
    ticket_no,
    surname,
    first_name,
    phone_number,
    phone_network,
    id_type,
    id_number,
    method,
  } = req.body;

  try {
    const isValid = await is_valid_winning_ticket(ticket_no);

    if (!isValid) {
      return res.status(404).send({
        status: "error🔴",
        ticket: ticket_no,
        message: "No valid winning ticket found",
      });
    }

    pool.query(
      "UPDATE tickets SET Surname = ?, FirstName = ?, PhoneNumber =  ?, PhoneNetwork = ?, IdType = ?, IdNumber = ?, method = ?, Paid = 1, Date_Modified = NOW()  WHERE TicketNumber = ?",
      [
        surname,
        first_name,
        phone_number,
        phone_network,
        id_type,
        id_number,
        method,
        ticket_no,
      ],
      (error, results, fields) => {
        res.status(200).send({
          status: "success🟢",
          ticket: ticket_no,
          message: "Ticket paid✔️",
        });
      }
    );
  } catch (error) {
    res.status(500).send({
      status: "error🔴",
      ticket: ticket_no,
      message: "An error occurred during payment",
    });
  }
});

// function is_valid_winning_ticket(ticket_no, res) {
//   pool.query(
//     "SELECT * FROM winning_tickets WHERE Ticket_Code = ?",
//     [ticket_no],
//     (error, results, fields) => {
//       if (error) throw error;

//       if (results.length === 0) {
//         res.status(404).send("Ticket valid but not a winning ticket.");
//       } else {
//         if (results[0].Paid == 1) {
//           console.log("This winning ticket has already being paid.");
//           res.status(200).send("This winning ticket has already being paid.");
//         } else if (results[0].Paid == 0) {
//           // res.status(200).send("Valid winning Ticket🚀, yet to be paid.");
//           console.log("Valid winning Ticket🚀, yet to be paid.");
//           make_payment(ticket_no);
//         } else {
//           res.status(200).send("Winning ticket, null paid field.");
//           console.log("Winning ticket, null paid field.");
//         }
//       }
//     }
//   );
// }

// async function make_payment(ticket_no) {
//   try {
//     pool.query("START TRANSACTION");

//     pool.query(
//       "UPDATE winning_tickets SET Paid = 1, PaidDate_Time = NOW() WHERE Ticket_Code = ?",
//       [ticket_no]
//     );

//     pool.query(
//       "UPDATE tickets SET Paid = 1, PaidDate_Time = NOW() WHERE TicketNumber = ?",
//       [ticket_no]
//     );

//     pool.query("COMMIT");

//     console.log("Paid column updated successfully");
//     res.status(404).send("Paid column updated successfully✔️");
//   } catch (error) {
//     pool.query("ROLLBACK");
//     console.log("Error occurred while updating Paid column:", error.message);
//   }
// }

app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});

function is_valid_winning_ticket(ticket_no) {
  return new Promise((resolve, reject) => {
    pool.query(
      "SELECT * FROM tickets WHERE TicketNumber = ? and Winner = 1 and Paid =0",
      [ticket_no],
      (error, results, fields) => {
        if (error) {
          reject(error);
        } else if (results.length === 0) {
          resolve(false);
        } else {
          resolve(true);
        }
      }
    );
  });
}
