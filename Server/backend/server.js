import express from "express";
import neo4j from "neo4j-driver";
import cors from "cors";

// Initialize express app
const app = express();
const port = 4000;

// Connect to Neo4j database
const driver = neo4j.driver(
  "bolt://localhost:7687", // Neo4j connection URL
  neo4j.auth.basic("neo4j", "123456789") // Neo4j credentials
);
const session = driver.session();

// Middleware to handle CORS
app.use(cors());

// Endpoint to get optimized delivery route
app.get("/api/getOptimizedRoute", async (req, res) => {
  const { start, end } = req.query;
  
  console.log(`Received request for route from ${start} to ${end}`);
  
  try {
    const result = await session.run(
      `MATCH (start:Supplier {name: $start})-[:ROUTE*]->(end:DeliveryPoint {name: $end})
       RETURN start, end, SUM(r.distance) AS totalDistance
       ORDER BY totalDistance ASC LIMIT 1`,
      { start, end }
    );

    console.log(result.records);

    if (result.records.length === 0) {
      res.status(404).send("No route found");
      return;
    }

    const optimizedNodes = result.records.map((record) => ({
      id: record.get("start").properties.name,
      label: record.get("start").properties.name,
    }));

    const optimizedEdges = result.records.map((record) => ({
      id: `e-${record.get("start").properties.name}-${record.get("end").properties.name}`,
      source: record.get("start").properties.name,
      target: record.get("end").properties.name,
      label: `Distance: ${record.get("totalDistance")} km`,
    }));

    res.json({ optimizedNodes, optimizedEdges });
  } catch (err) {
    console.error("Error fetching optimized route:", err);
    res.status(500).send("Error fetching optimized route.");
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
