import mongoose from "mongoose";

const EXPECTED_URI =
  "mongodb://root:6scldk9f@dbconn.sealosbja.site:39056/test?authSource=admin&directConnection=true";
const uri = (process.env.MONGODB_URI ?? "").trim() || EXPECTED_URI;

if (uri !== EXPECTED_URI) {
  console.error("数据库连接不一致，已中止执行。");
  console.error(`当前连接: ${uri}`);
  console.error(`正确连接: ${EXPECTED_URI}`);
  process.exit(1);
}

console.log("数据库连接校验通过，开始检查库信息。");
const m = await mongoose.connect(uri, { bufferCommands: false });
const admin = m.connection.db.admin();
const dbs = await admin.listDatabases();

for (const db of dbs.databases) {
  console.log("DB:", db.name, "- size:", db.sizeOnDisk);
  if (db.name !== "admin" && db.name !== "local" && db.name !== "config") {
    const dbConn = m.connection.client.db(db.name);
    const cols = await dbConn.listCollections().toArray();
    for (const col of cols) {
      const count = await dbConn.collection(col.name).countDocuments();
      console.log("  ", col.name, ":", count, "docs");
    }
  }
}

await m.disconnect();
