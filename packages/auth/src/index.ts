import "dotenv/config"
import * as db from "@repo/db"

async function testDb() {
  console.log(db)
  try {
    const result = await db.query(`SELECT * FROM users;`);
    console.log('Connected to DB! Time:', result)
  }

  catch(error) {
    console.log("Failed to connect to DB", error);
    process.exit(1);
  }
}

testDb()