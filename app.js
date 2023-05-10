const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

dbPath = path.join(__dirname, "covid19India.db");
let db = null;

const districtSnakeToCamelCase = (newObject) => {
  return {
    districtId: newObject.district_id,
    districtName: newObject.district_name,
    stateId: newObject.state_id,
    cases: newObject.cases,
    cured: newObject.cured,
    active: newObject.active,
    deaths: newObject.deaths,
  };
};

const stateSnakeToCamelCase = (newObject) => {
  return {
    stateId: newObject.state_id,
    stateName: newObject.state_name,
    population: newObject.population,
  };
};

const reportSnakeToCamelCase = (newObject) => {
  return {
    totalCase: newObject.cases,
    totalCured: newObject.cured,
    totalActive: newObject.active,
    totalDeaths: newObject.deaths,
  };
};

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

app.get("/states/", async (request, response) => {
  const getAllStates = `
    SELECT 
        * 
    FROM 
        state
    ORDER BY 
        state_id
    `;
  const allStates = await db.all(getAllStates);
  const resultState = allStates.map((eachStates) => {
    return stateSnakeToCamelCase(eachStates);
  });
  response.send(resultState);
});

//API get state based on stateId

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
    SELECT 
        *
    FROM 
        state 
    WHERE 
        state_id = ${stateId}
    `;
  const stateQuery = await db.get(getStateQuery);
  const result = stateSnakeToCamelCase(stateQuery);
  response.send(result);
});
