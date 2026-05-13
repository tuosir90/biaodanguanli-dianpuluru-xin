"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, AlertCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  SHOP_OPERATION_MODE_OPTIONS,
  resolveSubmittedOperationMode,
} from "@/features/shops/operation-modes";
import { resolveSalesCity } from "@/lib/sales-city";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
    <section className="max-w-4xl mx-auto">
      <div className="rounded-2xl border border-border bg-card p-8 shadow-soft">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-text-100 tracking-tight">店铺录入</h2>
          <p className="mt-2 text-sm text-text-200 opacity-80">请填写以下信息以录入新店铺，所有带 * 的字段为必填项。</p>
        </div>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-text-200">录入日期 <span className="text-red-500">*</span></Label>
            <Input 
              className="bg-bg-200/50 text-text-200 cursor-not-allowed" 
              value={form.entryDate} 
              readOnly 
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-text-100">店铺名 <span className="text-red-500">*</span></Label>
            <Input 
              className="bg-bg-100 text-text-100 shadow-sm focus-ring transition-all duration-fast ease-apple" 
              required 
              placeholder="请输入店铺名称"
              value={form.shopName} 
              onChange={(e) => setForm({ ...form, shopName: e.target.value })} 
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-text-100">商家ID <span className="text-red-500">*</span></Label>
            <Input 
              className="bg-bg-100 text-text-100 shadow-sm focus-ring transition-all duration-fast ease-apple"
              required
              placeholder="请输入商家ID"
              value={form.merchantId} 
              onChange={(e) => setForm({ ...form, merchantId: e.target.value })} 
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-text-100">微信群全名 <span className="text-red-500">*</span></Label>
            <Input 
              className="bg-bg-100 text-text-100 shadow-sm focus-ring transition-all duration-fast ease-apple"
              required
              placeholder="请输入微信群全名"
              value={form.wechatGroupName} 
              onChange={(e) => setForm({ ...form, wechatGroupName: e.target.value })} 
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-text-100">店铺城市 <span className="text-red-500">*</span></Label>
            <Input 
              className="bg-bg-100 text-text-100 shadow-sm focus-ring transition-all duration-fast ease-apple"
              required
              placeholder="请输入城市"
              value={form.city} 
              onChange={(e) => setForm({ ...form, city: e.target.value })} 
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-text-100">开单销售 <span className="text-red-500">*</span></Label>
            <Select 
              value={form.salesName} 
              onValueChange={applySalesName}
            >
              <SelectTrigger className="bg-bg-100 text-text-100 shadow-sm focus-ring transition-all duration-fast ease-apple">
                <SelectValue placeholder="请选择销售人员" />
              </SelectTrigger>
              <SelectContent>
                {dropdowns.salesName.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Input
                className="bg-bg-100 text-text-100 shadow-sm focus-ring transition-all duration-fast ease-apple"
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
              <Select value={newSalesCity} onValueChange={setNewSalesCity}>
                <SelectTrigger className="w-[140px] bg-bg-100 text-text-100 shadow-sm focus-ring transition-all duration-fast ease-apple">
                  <SelectValue placeholder="所属城市" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="武汉">武汉</SelectItem>
                  <SelectItem value="宜昌">宜昌</SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                className="shrink-0"
                onClick={handleAddSalesName}
              >
                <Plus className="h-4 w-4" />
                添加
              </Button>
            </div>
            <input className="sr-only" tabIndex={-1} required value={form.salesName} onChange={() => undefined} />
          </div>

          <div className="space-y-2">
            <Label className="text-text-100">销售所属城市</Label>
            <Input
              className="bg-bg-200/50 text-text-200 cursor-not-allowed"
              value={form.salesCity}
              placeholder="选择开单销售后自动带出"
              readOnly
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-text-100">合同签订日期 <span className="text-red-500">*</span></Label>
            <Input 
              type="date" 
              className="bg-bg-100 text-text-100 shadow-sm focus-ring transition-all duration-fast ease-apple"
              required 
              value={form.contractSignedDate} 
              onChange={(e) => setForm({ ...form, contractSignedDate: e.target.value })} 
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-text-100">运营模式 <span className="text-red-500">*</span></Label>
            <Select 
              value={form.operationMode} 
              onValueChange={(value) => {
                setForm({ ...form, operationMode: value });
                setManualOperationMode("");
              }}
            >
              <SelectTrigger className="bg-bg-100 text-text-100 shadow-sm focus-ring transition-all duration-fast ease-apple">
                <SelectValue placeholder="请选择运营模式" />
              </SelectTrigger>
              <SelectContent>
                {SHOP_OPERATION_MODE_OPTIONS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input
              className="bg-bg-100 text-text-100 shadow-sm focus-ring transition-all duration-fast ease-apple"
              placeholder="手动填写临时运营模式"
              value={manualOperationMode}
              onChange={(event) => setManualOperationMode(event.target.value)}
            />
            <input
              className="sr-only"
              tabIndex={-1}
              required
              value={resolveSubmittedOperationMode(form.operationMode, manualOperationMode)}
              onChange={() => undefined}
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-text-100">负责运营 <span className="text-red-500">*</span></Label>
            <Select 
              value={form.operatorName} 
              onValueChange={(value) => setForm({ ...form, operatorName: value })}
            >
              <SelectTrigger className="bg-bg-100 text-text-100 shadow-sm focus-ring transition-all duration-fast ease-apple">
                <SelectValue placeholder="请选择负责运营" />
              </SelectTrigger>
              <SelectContent>
                {dropdowns.operatorName.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Input
                className="bg-bg-100 text-text-100 shadow-sm focus-ring transition-all duration-fast ease-apple"
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
                type="button"
                variant="outline"
                className="shrink-0"
                onClick={handleAddOperatorName}
              >
                <Plus className="h-4 w-4" />
                添加
              </Button>
            </div>
            <input className="sr-only" tabIndex={-1} required value={form.operatorName} onChange={() => undefined} />
          </div>
          
          <div className="space-y-2">
            <Label className="text-text-100">外卖平台 <span className="text-red-500">*</span></Label>
            <Select 
              value={form.deliveryPlatform} 
              onValueChange={(value) => setForm({ ...form, deliveryPlatform: value })}
            >
              <SelectTrigger className="bg-bg-100 text-text-100 shadow-sm focus-ring transition-all duration-fast ease-apple">
                <SelectValue placeholder="请选择外卖平台" />
              </SelectTrigger>
              <SelectContent>
                {dropdowns.deliveryPlatform.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
              </SelectContent>
            </Select>
            <input className="sr-only" tabIndex={-1} required value={form.deliveryPlatform} onChange={() => undefined} />
          </div>
          
          <div className="md:col-span-2 pt-4 flex items-center gap-4">
            <Button 
              disabled={submitting} 
              className="flex items-center gap-2 rounded-lg bg-accent-200 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-accent-200/30 hover:bg-accent-200/90 hover:shadow-accent-200/40 disabled:opacity-50 disabled:shadow-none transition-all duration-base ease-apple hover-lift active-press"
              type="submit"
            >
              <Save className="h-4 w-4" />
              {submitting ? "提交中..." : "提交店铺"}
            </Button>
            
            {error ? (
              <div className="flex items-center gap-2 text-sm text-destructive animate-in fade-in slide-in-from-left-2">
                <AlertCircle className="h-4 w-4" />
                <p>{error}</p>
              </div>
            ) : null}
          </div>
        </form>
      </div>
    </section>
  );
}
