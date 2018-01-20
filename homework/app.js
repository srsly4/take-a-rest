//File 04_RestDatabase/app.js
const express = require("express");
const app = express();
const moment = require('moment');


// MySQL connection
const Promise = require('bluebird');
const mysql = require('promise-mysql');
let connection = null;
mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'admin',
  database : 'rest'
}).then((conn) => {
  console.log('MySQL connection created.');
  connection = conn;
});

// >>> Helper functions
function printReqSummary(request) {
  console.log(`Handling ${request.method} ${request.originalUrl}`);
}

// Get patient from database with given id
async function getPatient(id) {
  const res = await connection.query("SELECT * FROM patients WHERE id = ?", [id]);
  return (res || [])[0];
}

async function getPatients() {
  const res = await connection.query("SELECT * FROM patients");
  return (res || []);
}

// Check if database contains any patients
async function hasPatients() {
  const res = await connection.query("SELECT COUNT(*) AS count FROM patients");
  return res && res[0] && res[0].count > 0;
}

async function insertPatient(patient) {
  await connection.query("INSERT INTO patients (name, surname) VALUES ( ? , ? )", [patient.name, patient.surname]);
}

async function updatePatient(patient) {
  await connection.query("UPDATE patients SET name = ?, surname = ? WHERE id = ?", [
    patient.name,
    patient.surname,
    patient.id,
  ]);
}

async function deletePatient(id) {
  await connection.query("DELETE FROM appointments WHERE patientId = ?", [id]);
  await connection.query("DELETE FROM patients WHERE id = ?", [id]);
}

async function getAppointment(id) {
  const res = await connection.query("SELECT * FROM appointments WHERE id = ?", [id]);
  return (res || [])[0];
}

async function getAppointments(date) {
  if (!date) {
    const res = await connection.query("SELECT * FROM appointments");
    return (res || []);
  } else {
    const res = await connection.query("SELECT * FROM appointments WHERE timestamp BETWEEN ? AND ?", [
      moment(date)
        .startOf('day').toDate(),
      moment(date)
        .endOf('day').toDate(),
    ]);
    return (res || []);
  }
}

async function insertAppointment(appointment) {
  await connection.query("INSERT INTO appointments (type, timestamp, patientId) VALUES (?, ?, ?)", [
    appointment.type,
    moment(appointment.timestamp).toDate(),
    appointment.patient,
  ]);
}
async function updateAppointment(appointment) {
  await connection.query("UPDATE appointments SET type = ?, timestamp = ?, patientId = ? WHERE id = ?", [
    appointment.type,
    moment(appointment.timestamp).toDate(),
    appointment.patient,
    appointment.id,
  ]);
}

async function deleteAppointment(id) {
  await connection.query("DELETE FROM appointments WHERE id = ?", [id]);
}

async function hasAppointments() {
  const res = await connection.query("SELECT COUNT(*) AS count FROM appointments");
  return res && res[0] && res[0].count > 0;
}

// GET / -- Show main page
app.get("/", function(request, response) {
  printReqSummary(request);
  response.status(200).send(
    `<h1>REST + Database</h1><ul>
        <li>Show all patients (GET /patient )</li>
        <li>Show specific patient (GET /patient/:id)</li>
        <li>Add new patient (POST /patient?name=:NAME&surname=:SURNAME)</li>
        <li>Modify existing patient (PUT /patient/:id?name=:NAME&surname=:SURNAME)</li>
        <li>Remove patient (DELETE /patient/:id)</li>
        <li>Show all appointments (with date filter) (GET /appointment?date=2018-01-01)</li>
        <li>Show specific appointment (GET /appointment/:id)</li>
        <li>Add new appointment (POST /appointment?patient=:PATIENT_ID&timestamp=:TIMESTAMP&type=:TYPE)</li>
        <li>Modify existing appointment (PUT /appointment/:id?patient=:PATIENT_ID&timestamp=:TIMESTAMP&type=:TYPE)</li>
        <li>Remove appointment (DELETE /appointment/:id)</li></ul>`
  );
});

// GET /patient -- Show all patients
app.get("/patient", async function(request, response) {
  printReqSummary(request);
  if (await hasPatients()) {
    const patients = await getPatients();
    response.status(200).send(JSON.stringify(patients));
  } else {
    response.status(404).send({ error: "No patients are registered" });
  }
});

// GET /patient/:id -- Show patient with :id
app.get("/patient/:id", async function(request, response) {
  printReqSummary(request);
  if (await hasPatients()) {
    const id = Number(request.params.id);
    const patient = await getPatient(id);
    if (patient !== undefined) {
      response.status(200).send(JSON.stringify(patient));
    } else {
      response.status(404).send({ error: "No patient with given id" });
    }
  } else {
    response.status(404).send({ error: "No patients are registered" });
  }
});

// POST /patient?name=:NAME&surname=:SURNAME -- Add new patient
app.post("/patient", async function(request, response) {
  printReqSummary(request);
  const name = request.query.name;
  const surname = request.query.surname;
  if (name === undefined || surname === undefined) {
    response.status(400).send({
      error: "Invalid request - missing queries (name and/or surname)"
    });
  } else {
    const newPatient = { name: name, surname: surname };
    await insertPatient(newPatient);
    response.status(200).send(newPatient);
  }
});

// PUT /patient/:id?name=:NAME&surname=:SURNAME -- modify patient with :id
app.put("/patient/:id", async function(request, response) {
  const id = Number(request.params.id);
  const patient = getPatient(id);
  if (patient === undefined) {
    response.status(404).send({ error: "No patient with given id" });
  } else {
    const name = request.query.name;
    const surname = request.query.surname;
    if (name === undefined || surname === undefined) {
      response.status(400).send({
        error: "Invalid request - missing queries (name and/or surname)"
      });
    } else {
      const updatedPatient = { id: patient.id, name: name, surname: surname };
      await updatePatient(updatedPatient);
      response.status(200).send(updatedPatient);
    }
  }
});

// DELETE /patient/:id -- Remove patient with :id and his assignments
app.delete("/patient/:id", async function(request, response) {
  printReqSummary(request);
  const id = Number(request.params.id);
  const patient = getPatient(id);
  if (patient === undefined) {
    response.status(404).send({ error: "No patient with given id" });
  } else {
    await deletePatient(id);
    response.status(200).send({ message: "Patient removed successfully" });
  }
});

// GET /appointment?date=2018-01-01 -- Show all appointments with optional filter
app.get("/appointment", async (req, res) => {
  printReqSummary(req);
  if (await hasAppointments()) {
    const appointments = await getAppointments(req.query.date);
    res.status(200).send(appointments || []);
  } else {
    res.status(404).send({error: "No appointments are created"});
  }
});

// GET /appointment/:id -- Show appointment with :id
app.get("/appointment/:id", async (req, res) => {
  printReqSummary(req);
  const appointment = await getAppointment(parseInt(req.params.id));
  return appointment ?
         res.status(200).send(appointment)
         : res.status(404).send({error: "Appointment not found"});
});

// POST /appointment?patient=:PATIENT_ID&timestamp=:TIMESTAMP&type=:TYPE -- Add new appointment
app.post("/appointment", async (req, res) => {
  printReqSummary(req);
  if (!req.query.patient || !req.query.timestamp || !req.query.type) {
    return res.status(400).send({error: "Validation errors. Not all field are provided"});
  }
  if (req.query.type < 1 || req.query.type > 3) {
    return res.status(400).send({error: "Incorrect type parameter"});
  }
  if (!(await getPatient(Number(req.query.patient)))) {
    return res.status(400).send({error: "Patient doesn't exist"});
  }
  const appointment = {
    patient: parseInt(req.query.patient),
    timestamp: moment.unix(parseInt(req.query.timestamp)),
    type: parseInt(req.query.type),
  };
  await insertAppointment(appointment);
  return res.status(200).send(appointment);
});

// PUT /appointment/:id?patient=:PATIENT_ID&timestamp=:TIMESTAMP&type=:TYPE -- Modify appointment with :id
app.put("/appointment/:id", async (req, res) => {
  printReqSummary(req);
  const id = Number(req.params.id);
  const appointment = await getAppointment(id);
  if (!appointment) {
    return res.status(404).send({error: "Not found"});
  }

  if (req.query.patient && await getPatient(Number(req.query.patient))) {
    appointment.patient = parseInt(req.query.patient);
  }
  if (req.query.timestamp) {
    appointment.timestamp = moment.unix(parseInt(req.query.timestamp));
  }
  if (req.query.type && req.query.type >= 1 && req.query.type <= 3) {
    appointment.type = parseInt(req.query.type);
  }

  await updateAppointment(appointment);

  return res.status(200).send(appointment);
});

// DELETE /appointment/:id - Remove appointment with :id
app.delete("/appointment/:id", async (req, res) => {
  printReqSummary(req);
  const id = Number(req.params.id);
  const appointment = await getAppointment(id);
  if (!appointment) {
    return res.status(404).send({error: "Not found"});
  }
  await deleteAppointment(id);
  return res.status(200).send({ message: "Appointment removed successfully" });
});

app.listen(3000);
