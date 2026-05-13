import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import {
  buildEmployeeStatusMap,
  filterSalesNameOptions,
} from "@/features/shops/filter-options";
import { Shop } from "@/models/shop";

export const maxDuration = 30;

const FILTER_OPTIONS_RESPONSE_HEADERS = {
  "Cache-Control": "no-store",
};

type EmployeeStatusSummary = {
  _id?: {
    name?: string;
    status?: string;
  };
  count?: number;
};

function toDateString(value: Date | string) {
  return new Date(value).toISOString().slice(0, 10);
}

function employeeStatusPipeline(nameField: string, statusField: string) {
  return [
    { $match: { [nameField]: { $ne: "" } } },
    {
      $group: {
        _id: { name: `$${nameField}`, status: `$${statusField}` },
        count: { $sum: 1 },
      },
    },
  ];
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

    const [
      operatorNames,
      salesNames,
      salesCities,
      platforms,
      entryDates,
      operatorStatusRows,
      salesStatusRows,
    ] = await Promise.all([
      Shop.distinct("operatorName", { operatorName: { $ne: "" } }),
      Shop.distinct("salesName", { salesName: { $ne: "" } }),
      Shop.distinct("salesCity", { salesCity: { $ne: "" } }),
      Shop.distinct("deliveryPlatform", { deliveryPlatform: { $ne: "" } }),
      Shop.distinct("entryDate"),
      Shop.aggregate<EmployeeStatusSummary>(
        employeeStatusPipeline("operatorName", "operatorEmploymentStatus")
      ),
      Shop.aggregate<EmployeeStatusSummary>(
        employeeStatusPipeline("salesName", "salesEmploymentStatus")
      ),
    ]);

    const payload = {
      operatorNames: operatorNames.sort(),
      salesNames: filterSalesNameOptions(salesNames),
      salesCities: salesCities.sort(),
      platforms: platforms.sort(),
      operatorStatusMap: buildEmployeeStatusMap(toEmployeeStatusRecords(operatorStatusRows)),
      salesStatusMap: buildEmployeeStatusMap(toEmployeeStatusRecords(salesStatusRows)),
      entryDates: entryDates
        .filter((item) => Boolean(item))
        .map((item) => toDateString(item as Date | string))
        .sort((a, b) => b.localeCompare(a)),
    };

    return NextResponse.json(payload, {
      headers: FILTER_OPTIONS_RESPONSE_HEADERS,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "获取筛选选项失败",
        error: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 500 }
    );
  }
}
