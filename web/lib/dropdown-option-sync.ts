type ShopDropdownKey =
  | "salesName"
  | "operatorName"
  | "deliveryPlatform";

type ShopDropdownValues = Partial<Record<ShopDropdownKey | "operationMode", string>>;

type DropdownOptionBulkOperation = {
  updateOne: {
    filter: { key: ShopDropdownKey };
    update: { $addToSet: { options: string } };
    upsert: true;
  };
};

const shopDropdownKeys: ShopDropdownKey[] = [
  "salesName",
  "operatorName",
  "deliveryPlatform",
];

function normalizeDropdownOption(value: string | undefined) {
  return value?.trim() ?? "";
}

export function buildShopDropdownOptionBulkOperations(
  values: ShopDropdownValues
) {
  const operations: DropdownOptionBulkOperation[] = [];

  shopDropdownKeys.forEach((key) => {
    const option = normalizeDropdownOption(values[key]);

    if (!option) {
      return;
    }

    operations.push({
      updateOne: {
        filter: { key },
        update: { $addToSet: { options: option } },
        upsert: true,
      },
    });
  });

  return operations;
}
