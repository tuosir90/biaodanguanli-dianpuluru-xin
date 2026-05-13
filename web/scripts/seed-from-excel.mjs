import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import xlsx from "xlsx";
import employeeStatusConfig from "../features/shops/employee-status-config.json" with { type: "json" };

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("缺少 MONGODB_URI 环境变量");
}

const currentFilePath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(currentFilePath), "..");
const excelPath = path.resolve(
  projectRoot,
  "..",
  "📋外卖店铺统计 待办事项统计 共享（实时更新） (8).xlsx"
);

const sheetNameIncludes = "外卖运营店铺数据统计";
const wuhanSalesNames = new Set(["屈维涛", "李帅", "向文强"]);

function normalizeText(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function parseExcelDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "number") {
    const parsed = xlsx.SSF.parse_date_code(value);
    if (!parsed) return null;
    return new Date(parsed.y, parsed.m - 1, parsed.d);
  }

  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

function toDayStart(dateValue) {
  const date = new Date(dateValue);
  date.setHours(0, 0, 0, 0);
  return date;
}

function resolveSalesCity(salesName) {
  const normalizedSalesName = normalizeText(salesName);
  if (!normalizedSalesName) return "";
  return wuhanSalesNames.has(normalizedSalesName) ? "武汉" : "宜昌";
}

function resolveEmploymentStatus(role, name) {
  const normalizedName = normalizeText(name);
  if (!normalizedName) return "";
  return employeeStatusConfig[role].resignedNames.includes(normalizedName) ? "离职" : "在职";
}

async function seed() {
  await mongoose.connect(MONGODB_URI, { bufferCommands: false });

  const shopSchema = new mongoose.Schema(
    {
      entryDate: Date,
      shopName: String,
      merchantId: String,
      wechatGroupName: String,
      city: String,
      salesName: String,
      salesEmploymentStatus: String,
      salesCity: String,
      contractSignedDate: Date,
      operationMode: String,
      operatorName: String,
      operatorEmploymentStatus: String,
      deliveryPlatform: String,
    },
    { collection: "shops", strict: false }
  );

  const dropdownSchema = new mongoose.Schema(
    {
      key: { type: String, unique: true },
      options: [String],
    },
    { collection: "dropdown_options", strict: false }
  );

  const Shop = mongoose.models.Shop || mongoose.model("Shop", shopSchema);
  const DropdownOption =
    mongoose.models.DropdownOption ||
    mongoose.model("DropdownOption", dropdownSchema);

  const workbook = xlsx.readFile(excelPath, { cellDates: true });
  const matchedSheetName = workbook.SheetNames.find((name) =>
    name.includes(sheetNameIncludes)
  );

  if (!matchedSheetName) {
    throw new Error(`找不到工作表: ${sheetNameIncludes}`);
  }

  const sheet = workbook.Sheets[matchedSheetName];

  const rows = xlsx.utils.sheet_to_json(sheet, { defval: "" });

  const salesSet = new Set();
  const modeSet = new Set();
  const operatorSet = new Set();
  const platformSet = new Set();

  const operations = [];

  for (const row of rows) {
    const shopName = normalizeText(row["店铺名"]);
    const merchantId = normalizeText(row["商家ID"]);
    const wechatGroupName = normalizeText(row["微信群全名"]);
    const city = normalizeText(row["城市"]);
    const salesName = normalizeText(row["开单销售"]);
    const salesCity = resolveSalesCity(salesName);
    const operationMode = normalizeText(row["运营模式"]);
    const operatorName = normalizeText(row["负责运营"]);
    const salesEmploymentStatus = resolveEmploymentStatus("sales", salesName);
    const operatorEmploymentStatus = resolveEmploymentStatus("operator", operatorName);
    const deliveryPlatform = normalizeText(row["外卖平台"]);
    const contractSignedDateRaw = row["合同签订日期"];
    const contractSignedDate = parseExcelDate(contractSignedDateRaw);

    if (!shopName || !contractSignedDate) {
      continue;
    }

    if (salesName) salesSet.add(salesName);
    if (operationMode) modeSet.add(operationMode);
    if (operatorName) operatorSet.add(operatorName);
    if (deliveryPlatform) platformSet.add(deliveryPlatform);

    const entryDate = toDayStart(contractSignedDate);

    operations.push({
      updateOne: {
        filter: {
          shopName,
          merchantId,
          contractSignedDate: entryDate,
        },
        update: {
          $set: {
            entryDate,
            shopName,
            merchantId,
            wechatGroupName,
            city,
            salesName,
            salesEmploymentStatus,
            salesCity,
            contractSignedDate: entryDate,
            operationMode,
            operatorName,
            operatorEmploymentStatus,
            deliveryPlatform,
          },
        },
        upsert: true,
      },
    });
  }

  if (operations.length > 0) {
    await Shop.bulkWrite(operations, { ordered: false });
  }

  const dropdowns = [
    { key: "salesName", options: Array.from(salesSet).sort() },
    { key: "operationMode", options: Array.from(modeSet).sort() },
    { key: "operatorName", options: Array.from(operatorSet).sort() },
    { key: "deliveryPlatform", options: Array.from(platformSet).sort() },
  ];

  for (const item of dropdowns) {
    await DropdownOption.updateOne(
      { key: item.key },
      { $set: { options: item.options } },
      { upsert: true }
    );
  }

  console.log(`seed success: shops=${operations.length}`);
}

seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
