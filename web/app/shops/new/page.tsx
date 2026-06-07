"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Card, Col, Input, Row, Select, Space, Typography } from "antd";
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

type FormState = {
  entryDate: string;
  shopName: string;
  merchantId: string;
  wechatGroupName: string;
  city: string;
  salesName: string;
  salesCity: string;
  contractSignedDate: string;
  operationMode: string;
  operatorName: string;
  deliveryPlatform: string;
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

// 必填项标记
function RequiredMark() {
  return <span style={{ color: "var(--destructive)" }}> *</span>;
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <Typography.Text strong style={{ display: "block", marginBottom: 8 }}>
      {children}
    </Typography.Text>
  );
}

export default function NewShopPage() {
  const router = useRouter();
  const initialDate = useMemo(() => today(), []);
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
  const [form, setForm] = useState<FormState>({
    entryDate: initialDate,
    shopName: "",
    merchantId: "",
    wechatGroupName: "",
    city: "",
    salesName: "",
    salesCity: "",
    contractSignedDate: initialDate,
    operationMode: "",
    operatorName: "",
    deliveryPlatform: "",
  });

  function applySalesName(nextSalesName: string) {
    const resolvedSalesCity =
      dropdowns.salesCityMap[nextSalesName] || resolveSalesCity(nextSalesName);

    setForm((previous) => ({
      ...previous,
      salesName: nextSalesName,
      salesCity: resolvedSalesCity,
    }));
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
    applySalesName(value);
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

    setForm((previous) => ({ ...previous, operatorName: value }));
    setNewOperatorName("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const operationMode = resolveSubmittedOperationMode(
      form.operationMode,
      manualOperationMode
    );
    const requiredValues = [
      form.entryDate,
      form.shopName,
      form.merchantId,
      form.wechatGroupName,
      form.city,
      form.salesName,
      form.contractSignedDate,
      operationMode,
      form.operatorName,
      form.deliveryPlatform,
    ];

    if (requiredValues.some((value) => !String(value ?? "").trim())) {
      setError("请完整填写所有必填项");
      setSubmitting(false);
      return;
    }

    const response = await fetch("/api/shops", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, operationMode }),
    });

    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      setError(result.message ?? "提交失败");
      setSubmitting(false);
      return;
    }

    router.push("/shops");
    router.refresh();
  }

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

        <form onSubmit={handleSubmit}>
          <Row gutter={[24, 20]}>
            <Col xs={24} md={12}>
              <FieldLabel>
                录入日期 <RequiredMark />
              </FieldLabel>
              <Input value={form.entryDate} readOnly required />
            </Col>

            <Col xs={24} md={12}>
              <FieldLabel>
                店铺名 <RequiredMark />
              </FieldLabel>
              <Input
                required
                placeholder="请输入店铺名称"
                value={form.shopName}
                onChange={(e) => setForm({ ...form, shopName: e.target.value })}
              />
            </Col>

            <Col xs={24} md={12}>
              <FieldLabel>
                商家ID <RequiredMark />
              </FieldLabel>
              <Input
                required
                placeholder="请输入商家ID"
                value={form.merchantId}
                onChange={(e) =>
                  setForm({ ...form, merchantId: e.target.value })
                }
              />
            </Col>

            <Col xs={24} md={12}>
              <FieldLabel>
                微信群全名 <RequiredMark />
              </FieldLabel>
              <Input
                required
                placeholder="请输入微信群全名"
                value={form.wechatGroupName}
                onChange={(e) =>
                  setForm({ ...form, wechatGroupName: e.target.value })
                }
              />
            </Col>

            <Col xs={24} md={12}>
              <FieldLabel>
                店铺城市 <RequiredMark />
              </FieldLabel>
              <Input
                required
                placeholder="请输入城市"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </Col>

            <Col xs={24} md={12}>
              <FieldLabel>
                开单销售 <RequiredMark />
              </FieldLabel>
              <Select
                value={form.salesName || undefined}
                onChange={applySalesName}
                placeholder="请选择销售人员"
                options={dropdowns.salesName.map((item) => ({
                  value: item,
                  label: item,
                }))}
                style={{ width: "100%", marginTop: 8 }}
              />
              <Space.Compact style={{ display: "flex", marginTop: 8 }}>
                <Input
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
                <div style={{ width: 140, flexShrink: 0 }}>
                  <Select
                    value={newSalesCity || undefined}
                    onChange={setNewSalesCity}
                    placeholder="所属城市"
                    options={[
                      { value: "武汉", label: "武汉" },
                      { value: "宜昌", label: "宜昌" },
                    ]}
                    style={{ width: "100%" }}
                  />
                </div>
                <Button
                  htmlType="button"
                  icon={<PlusOutlined />}
                  onClick={handleAddSalesName}
                >
                  添加
                </Button>
              </Space.Compact>
            </Col>

            <Col xs={24} md={12}>
              <FieldLabel>销售所属城市</FieldLabel>
              <Input
                value={form.salesCity}
                placeholder="选择开单销售后自动带出"
                readOnly
              />
            </Col>

            <Col xs={24} md={12}>
              <FieldLabel>
                合同签订日期 <RequiredMark />
              </FieldLabel>
              <Input
                type="date"
                required
                value={form.contractSignedDate}
                onChange={(e) =>
                  setForm({ ...form, contractSignedDate: e.target.value })
                }
              />
            </Col>

            <Col xs={24} md={12}>
              <FieldLabel>
                运营模式 <RequiredMark />
              </FieldLabel>
              <Select
                value={form.operationMode || undefined}
                onChange={(value) => {
                  setForm({ ...form, operationMode: value });
                  setManualOperationMode("");
                }}
                placeholder="请选择运营模式"
                options={SHOP_OPERATION_MODE_OPTIONS.map((item) => ({
                  value: item,
                  label: item,
                }))}
                style={{ width: "100%", marginTop: 8 }}
              />
              <div style={{ marginTop: 8 }}>
                <Input
                  placeholder="手动填写临时运营模式"
                  value={manualOperationMode}
                  onChange={(event) =>
                    setManualOperationMode(event.target.value)
                  }
                />
              </div>
            </Col>

            <Col xs={24} md={12}>
              <FieldLabel>
                负责运营 <RequiredMark />
              </FieldLabel>
              <Select
                value={form.operatorName || undefined}
                onChange={(value) =>
                  setForm({ ...form, operatorName: value })
                }
                placeholder="请选择负责运营"
                options={dropdowns.operatorName.map((item) => ({
                  value: item,
                  label: item,
                }))}
                style={{ width: "100%", marginTop: 8 }}
              />
              <Space.Compact style={{ display: "flex", marginTop: 8 }}>
                <Input
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
                  icon={<PlusOutlined />}
                  onClick={handleAddOperatorName}
                >
                  添加
                </Button>
              </Space.Compact>
            </Col>

            <Col xs={24} md={12}>
              <FieldLabel>
                外卖平台 <RequiredMark />
              </FieldLabel>
              <Select
                value={form.deliveryPlatform || undefined}
                onChange={(value) =>
                  setForm({ ...form, deliveryPlatform: value })
                }
                placeholder="请选择外卖平台"
                options={dropdowns.deliveryPlatform.map((item) => ({
                  value: item,
                  label: item,
                }))}
                style={{ width: "100%", marginTop: 8 }}
              />
            </Col>

            <Col xs={24}>
              <Space align="center" size={16} style={{ paddingTop: 8 }}>
                <Button
                  disabled={submitting}
                  loading={submitting}
                  icon={<SaveOutlined />}
                  type="primary"
                  htmlType="submit"
                >
                  {submitting ? "提交中..." : "提交店铺"}
                </Button>
                {error ? (
                  <Alert type="error" showIcon title={error} banner />
                ) : null}
              </Space>
            </Col>
          </Row>
        </form>
      </Card>
    </section>
  );
}
