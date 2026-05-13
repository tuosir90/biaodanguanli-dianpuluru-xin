import { NextResponse } from "next/server";
import { buildSalesCityMap } from "@/lib/sales-city";
import { connectMongo } from "@/lib/mongodb";
import {
  buildEmployeeStatusMap,
  filterActiveSalesNameOptions,
} from "@/features/shops/filter-options";
import { getShopOperationModeOptions } from "@/features/shops/operation-modes";
import { DropdownOption } from "@/models/dropdown-option";
import { Shop } from "@/models/shop";

export const maxDuration = 30;
const DROPDOWNS_RESPONSE_HEADERS = {
  "Cache-Control": "no-store",
};

const defaultKeys = [
  "salesName",
  "operationMode",
  "operatorName",
  "deliveryPlatform",
] as const;

type DropdownKey = (typeof defaultKeys)[number];

const preferredDeliveryPlatforms = ["美团餐饮", "饿了么餐饮"];

type EmployeeStatusSummary = {
  _id?: {
    name?: string;
    status?: string;
  };
  count?: number;
};

function prioritizeDeliveryPlatforms(options: string[]) {
  const seen = new Set<string>();
  const preferred = preferredDeliveryPlatforms.filter((item) => options.includes(item));
  const others = options.filter((item) => !preferredDeliveryPlatforms.includes(item));
  const ordered = [...preferred, ...others];
  return ordered.filter((item) => {
    if (seen.has(item)) return false;
    seen.add(item);
    return true;
  });
}

function toEmployeeStatusRecords(rows: EmployeeStatusSummary[]) {
  return rows.map((row) => ({
    name: row._id?.name,
    status: row._id?.status,
    count: row.count,
  }));
}

export async function GET() {
  try {
    await connectMongo();

    const [docs, salesCityDocs, salesStatusRows] = await Promise.all([
      DropdownOption.find({ key: { $in: defaultKeys } }).lean(),
      Shop.find({ salesName: { $ne: "" } })
        .sort({ updatedAt: -1, _id: -1 })
        .select({ _id: 0, salesName: 1, salesCity: 1 })
        .lean(),
      Shop.aggregate<EmployeeStatusSummary>([
        { $match: { salesName: { $ne: "" } } },
        {
          $group: {
            _id: { name: "$salesName", status: "$salesEmploymentStatus" },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const salesStatusMap = buildEmployeeStatusMap(
      toEmployeeStatusRecords(salesStatusRows)
    );
    const payload = defaultKeys.reduce<Record<DropdownKey, string[]>>(
      (accumulator, key) => {
        const matched = docs.find((item) => item.key === key);
        const options = matched?.options ?? [];
        accumulator[key] =
          key === "salesName"
            ? filterActiveSalesNameOptions(options, salesStatusMap)
            : key === "operationMode"
              ? getShopOperationModeOptions()
            : key === "deliveryPlatform"
              ? prioritizeDeliveryPlatforms(options)
              : options;
        return accumulator;
      },
      {
        salesName: [],
        operationMode: [],
        operatorName: [],
        deliveryPlatform: [],
      }
    );

    return NextResponse.json(
      {
        ...payload,
        salesCityMap: buildSalesCityMap(salesCityDocs),
      },
      {
      headers: DROPDOWNS_RESPONSE_HEADERS,
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: "获取下拉选项失败",
        error: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 500 }
    );
  }
}
