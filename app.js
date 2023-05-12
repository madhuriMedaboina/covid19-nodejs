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

///ApI create a district in district table

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const newDistrictQuery = `
    INSERT INTO 
        district(district_name,state_id,cases,cured,active,deaths)
    VALUES(
        '${districtName}',
        ${stateId},
        ${cases},
        ${cured},
        ${active},
        ${deaths}
    )
    ;`;
  await db.run(newDistrictQuery);
  response.send("District Successfully Added");
});

/// API get district based on districtId
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT 
        * 
    FROM 
        district 
    WHERE 
        district_id = ${districtId}
    ;`;
  const district = await db.get(getDistrictQuery);
  response.send(districtSnakeToCamelCase(district));
});
//// API delete district based on districtId

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;

  const deleteDistrictQuery = `
    DELETE FROM 
        district 
    WHERE 
        district_id = ${districtId}
   ;`;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

/// API update district based on districtId

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrictQuery = `
    UPDATE 
        district
    SET 
        district_name = '${districtName}',
        state_id = ${stateId},
        cases = ${cases},
        cured = ${cured},
        active = ${active},
        deaths = ${deaths}
    WHERE 
        district_id = ${districtId}
    ;`;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});
//// API get totalcase based on stateId

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const totalQuery = `
    SELECT 
        sum(cases) AS totalCases,
        sum(cured) AS totalCured,
        sum(active) AS totalActive,
        sum(deaths) AS totalDeaths
    FROM
        district
    WHERE 
        state_id = ${stateId}
    ;`;
  const data = await db.get(totalQuery);
  response.send(data);
});

/// API get stateName based on districtId

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateNamesQuery = `
    SELECT 
        state_name
    FROM 
        state JOIN district ON 
        state.state_id = district.state_id
    WHERE 
        district_id = ${districtId}
    ;`;
  const state = await db.get(getStateNamesQuery);
  response.send({ stateName: state.state_name });
});

module.exports = app;
