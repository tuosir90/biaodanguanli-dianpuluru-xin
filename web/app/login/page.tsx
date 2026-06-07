"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LockOutlined, RightOutlined, ShopOutlined } from "@ant-design/icons";
import { Alert, Button, Form, Input, Typography, theme as antdTheme } from "antd";
import {
  FRONTEND_LOGIN_PASSWORD,
  getFrontendAuthStatus,
  setFrontendAuthStatus,
} from "@/lib/frontend-auth";

const { Title, Text, Paragraph } = Typography;

export default function LoginPage() {
  const router = useRouter();
  const { token } = antdTheme.useToken();
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (getFrontendAuthStatus()) {
      router.replace("/shops");
    }
  }, [router]);

  function handleSubmit(values: { password: string }) {
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const normalizedPassword = (values.password ?? "").trim();
      if (normalizedPassword !== FRONTEND_LOGIN_PASSWORD) {
        setErrorMessage("密码错误");
        return;
      }

      setFrontendAuthStatus(true);
      router.replace("/shops");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="flex min-h-screen w-full flex-col lg:flex-row"
      style={{ background: token.colorBgContainer }}
    >
      {/* 左侧品牌区 */}
      <div
        className="relative flex w-full flex-col items-center justify-center overflow-hidden p-8 lg:w-1/2 lg:p-12"
        style={{ background: token.colorFillTertiary }}
      >
        <div className="relative z-10 flex max-w-md flex-col items-center space-y-6 text-center">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-2xl"
            style={{
              background: token.colorPrimary,
              color: token.colorBgContainer,
            }}
          >
            <ShopOutlined style={{ fontSize: 36 }} />
          </div>

          <div className="space-y-2">
            <Title level={1} style={{ marginBottom: 0 }}>
              呈尚策划
            </Title>
            <Text type="secondary" style={{ fontSize: 20 }}>
              店铺管理系统（内部）
            </Text>
          </div>

          <div
            className="my-6 h-px w-24"
            style={{ background: token.colorBorder }}
          />

          <Text
            type="secondary"
            style={{ letterSpacing: 2, textTransform: "uppercase", fontSize: 13 }}
          >
            高效管理 · 智慧运营 · 数据驱动
          </Text>
        </div>

        <div className="absolute bottom-8">
          <Text type="secondary" style={{ fontSize: 12 }}>
            © {new Date().getFullYear()} 呈尚策划
          </Text>
        </div>
      </div>

      {/* 右侧登录表单 */}
      <div className="flex w-full items-center justify-center p-6 lg:w-1/2 lg:p-12">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2 text-center lg:text-left">
            <Title level={2} style={{ marginBottom: 4 }}>
              欢迎回来
            </Title>
            <Text type="secondary">请输入您的访问密码以进入呈尚策划内部系统</Text>
          </div>

          <Form layout="vertical" onFinish={handleSubmit} requiredMark={false} size="large">
            <Form.Item
              label="访问密码"
              name="password"
              rules={[{ required: true, message: "请输入系统密码" }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: token.colorTextTertiary }} />}
                placeholder="请输入系统密码"
                autoComplete="current-password"
              />
            </Form.Item>

            {errorMessage && (
              <Form.Item>
                <Alert type="error" showIcon message={errorMessage} />
              </Form.Item>
            )}

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={isSubmitting}
                icon={!isSubmitting ? <RightOutlined /> : undefined}
                iconPlacement="end"
              >
                {isSubmitting ? "登录中..." : "立即登录"}
              </Button>
            </Form.Item>
          </Form>

          <Paragraph type="secondary" style={{ fontSize: 12, textAlign: "center", marginBottom: 0 }}>
            如需重置密码或遇到登录问题，请联系系统管理员
          </Paragraph>
        </div>
      </div>
    </div>
  );
}
