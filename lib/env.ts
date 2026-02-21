export const env = {
  adminLogin: process.env.ADMIN_LOGIN ?? "admin",
  adminPasswordHash: process.env.ADMIN_PASSWORD_HASH ?? "$2a$10$zM6YPD6A8CqQwJ4q4vTd..M2pfIxVnWf9mRDopnCZ.26VylwRsV8W", // admin123
  sessionSecret: process.env.SESSION_SECRET ?? "dev-secret",
  databaseUrl: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/kr_store",
  googleSheetId: process.env.GOOGLE_SHEET_ID ?? "",
  googleClientEmail: process.env.GOOGLE_CLIENT_EMAIL ?? "",
  googlePrivateKey: (process.env.GOOGLE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n"),
  avitoClientId: process.env.AVITO_CLIENT_ID ?? "",
  avitoClientSecret: process.env.AVITO_CLIENT_SECRET ?? ""
};
