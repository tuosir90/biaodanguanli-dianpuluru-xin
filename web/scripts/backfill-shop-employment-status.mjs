import mongoose from "mongoose";
import employeeStatusConfig from "../features/shops/employee-status-config.json" with { type: "json" };

const MONGODB_URI = process.env.MONGODB_URI;
const BATCH_SIZE = 500;

if (!MONGODB_URI) {
  throw new Error("缺少 MONGODB_URI 环境变量");
}

function normalizeText(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function resolveEmploymentStatus(role, name) {
  const normalizedName = normalizeText(name);
  if (!normalizedName) return "";
  return employeeStatusConfig[role].resignedNames.includes(normalizedName) ? "离职" : "在职";
}

async function backfillShopEmploymentStatus() {
  await mongoose.connect(MONGODB_URI, { bufferCommands: false });

  const shopSchema = new mongoose.Schema({}, { collection: "shops", strict: false });
  const Shop = mongoose.models.Shop || mongoose.model("Shop", shopSchema);

  const shops = await Shop.find({})
    .select({ _id: 1, salesName: 1, operatorName: 1, salesEmploymentStatus: 1, operatorEmploymentStatus: 1 })
    .lean();

  const operations = [];

  for (const shop of shops) {
    const salesEmploymentStatus = resolveEmploymentStatus("sales", shop.salesName);
    const operatorEmploymentStatus = resolveEmploymentStatus("operator", shop.operatorName);

    if (
      normalizeText(shop.salesEmploymentStatus) === salesEmploymentStatus &&
      normalizeText(shop.operatorEmploymentStatus) === operatorEmploymentStatus
    ) {
      continue;
    }

    operations.push({
      updateOne: {
        filter: { _id: shop._id },
        update: {
          $set: {
            salesEmploymentStatus,
            operatorEmploymentStatus,
          },
        },
      },
    });
  }

  let modifiedCount = 0;
  for (let index = 0; index < operations.length; index += BATCH_SIZE) {
    const chunk = operations.slice(index, index + BATCH_SIZE);
    const result = await Shop.bulkWrite(chunk, { ordered: false });
    modifiedCount += result.modifiedCount;
  }

  console.log(
    JSON.stringify(
      {
        totalShops: shops.length,
        updatedShops: operations.length,
        modifiedCount,
      },
      null,
      2
    )
  );
}

backfillShopEmploymentStatus()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
