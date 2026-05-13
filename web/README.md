This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## 关键提醒（数据库连接）

项目唯一正确的云数据库连接为：

```bash
mongodb://root:6scldk9f@dbconn.sealosbja.site:39056/test?authSource=admin&directConnection=true
```

- 每次读取、修改、导入、连接数据库前，必须先核对 `MONGODB_URI` 是否与上面完全一致。
- 禁止使用旧端口连接（如 `30289`）。
- 项目级规范见：`docs/云数据库连接强提醒.md`

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Authentication

This project uses a pure frontend password login page at `/login`.

### Frontend Login

Current frontend password:

```bash
csch903
```

> Login state is stored in browser `localStorage` and is only used for frontend route gating.

### Environment Variables

Create a `.env.local` file and set:

```bash
MONGODB_URI=mongodb://root:6scldk9f@dbconn.sealosbja.site:39056/test?authSource=admin&directConnection=true
```

### Vercel Deployment

In Vercel project settings, add:

- `MONGODB_URI`
