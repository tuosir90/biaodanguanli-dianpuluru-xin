"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dayjs, { type Dayjs } from "dayjs";
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  Row,
  Select,
  Space,
  Typography,
} from "antd";
import type { FormProps } from "antd";
import { PlusOutlined, SaveOutlined } from "@ant-design/icons";
import {
  SHOP_OPERATION_MODE_OPTIONS,
  resolveSubmittedOperationMode,
} from "@/features/shops/operation-modes";
import { resolveSalesCity } from "@/lib/sales-city";

type Dropdowns = {
  salesName: string[];
  salesCityMap: Record<string, string>;
  operationMode: string[];
  operatorName: string[];
  deliveryPlatform: string[];
};

type ShopFormValues = {
  entryDate?: Dayjs;
  shopName?: string;
  merchantId?: string;
  wechatGroupName?: string;
  city?: string;
  salesName?: string;
  salesCity?: string;
  contractSignedDate?: Dayjs;
  operationMode?: string;
  operatorName?: string;
  deliveryPlatform?: string;
};

function requiredInputRule(label: string) {
  return [{ required: true, whitespace: true, message: `请输入${label}` }];
}

function requiredSelectRule(label: string) {
  return [{ required: true, message: `请选择${label}` }];
}

export default function NewShopPage() {
  const router = useRouter();
  const [shopForm] = Form.useForm<ShopFormValues>();
  const initialValues = useMemo<ShopFormValues>(
    () => ({
      entryDate: dayjs(),
      shopName: "",
      merchantId: "",
      wechatGroupName: "",
      city: "",
      salesName: "",
      salesCity: "",
      contractSignedDate: dayjs(),
      operationMode: "",
      operatorName: "",
      deliveryPlatform: "",
    }),
    []
  );
  const [dropdowns, setDropdowns] = useState<Dropdowns>({
    salesName: [],
    salesCityMap: {},
    operationMode: [...SHOP_OPERATION_MODE_OPTIONS],
    operatorName: [],
    deliveryPlatform: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [newSalesName, setNewSalesName] = useState("");
  const [newSalesCity, setNewSalesCity] = useState("");
  const [newOperatorName, setNewOperatorName] = useState("");
  const [manualOperationMode, setManualOperationMode] = useState("");

  function applySalesName(nextSalesName: string, salesCityOverride?: string) {
    const resolvedSalesCity =
      salesCityOverride ||
      dropdowns.salesCityMap[nextSalesName] ||
      resolveSalesCity(nextSalesName);

    shopForm.setFieldsValue({
      salesName: nextSalesName,
      salesCity: resolvedSalesCity,
    });
  }

  useEffect(() => {
    fetch("/api/dropdowns")
      .then((response) => response.json())
      .then((data: Dropdowns) =>
        setDropdowns({
          ...data,
          operationMode: [...SHOP_OPERATION_MODE_OPTIONS],
        })
      )
      .catch(() => setError("下拉选项加载失败"));
  }, []);

  function handleAddSalesName() {
    const value = newSalesName.trim();
    if (!value) return;
    const salesCity = newSalesCity.trim();
    if (!salesCity) {
      setError("请先选择手动新增销售的所属城市");
      return;
    }

    setDropdowns((previous) => {
      if (previous.salesName.includes(value)) {
        return {
          ...previous,
          salesCityMap: {
            ...previous.salesCityMap,
            [value]: salesCity,
          },
        };
      }
      return {
        ...previous,
        salesName: [value, ...previous.salesName],
        salesCityMap: {
          ...previous.salesCityMap,
          [value]: salesCity,
        },
      };
    });
    applySalesName(value, salesCity);
    setNewSalesName("");
    setNewSalesCity("");
    setError("");
  }

  function handleAddOperatorName() {
    const value = newOperatorName.trim();
    if (!value) return;

    setDropdowns((previous) => {
      if (previous.operatorName.includes(value)) {
        return previous;
      }
      return {
        ...previous,
        operatorName: [value, ...previous.operatorName],
      };
    });

    shopForm.setFieldsValue({ operatorName: value });
    setNewOperatorName("");
  }

  const handleSubmit: FormProps<ShopFormValues>["onFinish"] = async (values) => {
    setSubmitting(true);
    setError("");

    const operationMode = resolveSubmittedOperationMode(
      values.operationMode,
      manualOperationMode
    );
    const payload = {
      entryDate: values.entryDate?.format("YYYY-MM-DD") ?? "",
      shopName: values.shopName?.trim() ?? "",
      merchantId: values.merchantId?.trim() ?? "",
      wechatGroupName: values.wechatGroupName?.trim() ?? "",
      city: values.city?.trim() ?? "",
      salesName: values.salesName?.trim() ?? "",
      salesCity: values.salesCity?.trim() ?? "",
      contractSignedDate: values.contractSignedDate?.format("YYYY-MM-DD") ?? "",
      operationMode,
      operatorName: values.operatorName?.trim() ?? "",
      deliveryPlatform: values.deliveryPlatform?.trim() ?? "",
    };
    const requiredValues = [
      payload.entryDate,
      payload.shopName,
      payload.merchantId,
      payload.wechatGroupName,
      payload.city,
      payload.salesName,
      payload.contractSignedDate,
      payload.operationMode,
      payload.operatorName,
      payload.deliveryPlatform,
    ];

    if (requiredValues.some((value) => !String(value ?? "").trim())) {
      setError("请完整填写所有必填项");
      setSubmitting(false);
      return;
    }

    const response = await fetch("/api/shops", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      setError(result.message ?? "提交失败");
      setSubmitting(false);
      return;
    }

    router.push("/shops");
    router.refresh();
  };

  const handleSubmitFailed: FormProps<ShopFormValues>["onFinishFailed"] = () => {
    setError("请完整填写所有必填项");
  };

  return (
    <section className="mx-auto max-w-4xl">
      <Card variant="outlined" styles={{ body: { padding: 32 } }}>
        <div style={{ marginBottom: 28 }}>
          <Typography.Title level={3} style={{ marginBottom: 4 }}>
            店铺录入
          </Typography.Title>
          <Typography.Text type="secondary">
            请填写以下信息以录入新店铺，所有带 * 的字段为必填项。
          </Typography.Text>
        </div>

        <Form<ShopFormValues>
          form={shopForm}
          name="shop-entry-form"
          layout="vertical"
          variant="filled"
          size="large"
          initialValues={initialValues}
          requiredMark
          scrollToFirstError={{ focus: true }}
          autoComplete="off"
          onFinish={handleSubmit}
          onFinishFailed={handleSubmitFailed}
        >
          <Row gutter={[24, 8]}>
            <Col xs={24} md={12}>
              <Form.Item<ShopFormValues>
                name="entryDate"
                label="录入日期"
                rules={requiredSelectRule("录入日期")}
              >
                <DatePicker
                  allowClear={false}
                  disabled
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item<ShopFormValues>
                name="shopName"
                label="店铺名"
                rules={requiredInputRule("店铺名")}
              >
                <Input placeholder="请输入店铺名称" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item<ShopFormValues>
                name="merchantId"
                label="商家ID"
                extra="计算运营绩效都要使用商家ID，请务必仔细填写！"
                rules={requiredInputRule("商家ID")}
              >
                <Input placeholder="请输入商家ID" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item<ShopFormValues>
                name="wechatGroupName"
                label="微信群全名"
                rules={requiredInputRule("微信群全名")}
              >
                <Input placeholder="请输入微信群全名" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item<ShopFormValues>
                name="city"
                label="店铺城市"
                rules={requiredInputRule("店铺城市")}
              >
                <Input placeholder="请输入城市" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item<ShopFormValues>
                name="salesName"
                label="开单销售"
                rules={requiredSelectRule("开单销售")}
              >
                <Select
                  showSearch
                  optionFilterProp="label"
                  onChange={(value) => applySalesName(value)}
                  placeholder="请选择销售人员"
                  options={dropdowns.salesName.map((item) => ({
                    value: item,
                    label: item,
                  }))}
                />
              </Form.Item>
              <Space.Compact style={{ display: "flex", marginBottom: 24 }}>
                <Input
                  variant="filled"
                  placeholder="手动新增开单销售"
                  value={newSalesName}
                  onChange={(e) => setNewSalesName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSalesName();
                    }
                  }}
                />
                <Select
                  variant="filled"
                  value={newSalesCity || undefined}
                  onChange={setNewSalesCity}
                  placeholder="所属城市"
                  options={[
                    { value: "武汉", label: "武汉" },
                    { value: "宜昌", label: "宜昌" },
                  ]}
                  style={{ width: 140, flexShrink: 0 }}
                />
                <Button
                  htmlType="button"
                  color="default"
                  variant="filled"
                  icon={<PlusOutlined />}
                  onClick={handleAddSalesName}
                >
                  添加
                </Button>
              </Space.Compact>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item<ShopFormValues>
                name="salesCity"
                label="销售所属城市"
              >
                <Input placeholder="选择开单销售后自动带出" readOnly />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item<ShopFormValues>
                name="contractSignedDate"
                label="合同签订日期"
                rules={requiredSelectRule("合同签订日期")}
              >
                <DatePicker allowClear={false} style={{ width: "100%" }} />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item<ShopFormValues>
                name="operationMode"
                label="运营模式"
                required
              >
                <Select
                  onChange={() => setManualOperationMode("")}
                  placeholder="请选择运营模式"
                  options={SHOP_OPERATION_MODE_OPTIONS.map((item) => ({
                    value: item,
                    label: item,
                  }))}
                />
              </Form.Item>
              <div style={{ marginBottom: 24 }}>
                <Input
                  variant="filled"
                  placeholder="手动填写临时运营模式"
                  value={manualOperationMode}
                  onChange={(event) =>
                    setManualOperationMode(event.target.value)
                  }
                />
              </div>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item<ShopFormValues>
                name="operatorName"
                label="负责运营"
                rules={requiredSelectRule("负责运营")}
              >
                <Select
                  showSearch
                  optionFilterProp="label"
                  placeholder="请选择负责运营"
                  options={dropdowns.operatorName.map((item) => ({
                    value: item,
                    label: item,
                  }))}
                />
              </Form.Item>
              <Space.Compact style={{ display: "flex", marginBottom: 24 }}>
                <Input
                  variant="filled"
                  placeholder="手动新增负责运营"
                  value={newOperatorName}
                  onChange={(e) => setNewOperatorName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddOperatorName();
                    }
                  }}
                />
                <Button
                  htmlType="button"
                  color="default"
                  variant="filled"
                  icon={<PlusOutlined />}
                  onClick={handleAddOperatorName}
                >
                  添加
                </Button>
              </Space.Compact>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item<ShopFormValues>
                name="deliveryPlatform"
                label="外卖平台"
                rules={requiredSelectRule("外卖平台")}
              >
                <Select
                  placeholder="请选择外卖平台"
                  options={dropdowns.deliveryPlatform.map((item) => ({
                    value: item,
                    label: item,
                  }))}
                />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item style={{ marginBottom: 0 }}>
                <Space align="center" size={16} style={{ paddingTop: 8 }}>
                  <Button
                    disabled={submitting}
                    loading={submitting}
                    icon={<SaveOutlined />}
                    color="primary"
                    variant="solid"
                    htmlType="submit"
                  >
                    {submitting ? "提交中..." : "提交店铺"}
                  </Button>
                  {error ? (
                    <Alert type="error" showIcon message={error} banner />
                  ) : null}
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>
    </section>
  );
}
