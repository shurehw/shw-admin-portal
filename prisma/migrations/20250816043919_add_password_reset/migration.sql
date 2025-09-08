-- CreateTable
CREATE TABLE "PasswordReset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "customerId" INTEGER NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "newPasswordHash" TEXT,
    "validationCode" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CompanyUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'buyer',
    "department" TEXT,
    "spendingLimit" REAL,
    "canCreateOrders" BOOLEAN NOT NULL DEFAULT true,
    "canApproveOrders" BOOLEAN NOT NULL DEFAULT false,
    "canViewPricing" BOOLEAN NOT NULL DEFAULT true,
    "canManageUsers" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CompanyUser_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "B2BCustomer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_CompanyUser" ("createdAt", "customerId", "email", "firstName", "id", "isActive", "lastName", "password", "role", "spendingLimit", "updatedAt") SELECT "createdAt", "customerId", "email", "firstName", "id", "isActive", "lastName", "password", "role", "spendingLimit", "updatedAt" FROM "CompanyUser";
DROP TABLE "CompanyUser";
ALTER TABLE "new_CompanyUser" RENAME TO "CompanyUser";
CREATE UNIQUE INDEX "CompanyUser_email_key" ON "CompanyUser"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "PasswordReset_token_key" ON "PasswordReset"("token");

-- CreateIndex
CREATE INDEX "PasswordReset_email_idx" ON "PasswordReset"("email");

-- CreateIndex
CREATE INDEX "PasswordReset_token_idx" ON "PasswordReset"("token");
