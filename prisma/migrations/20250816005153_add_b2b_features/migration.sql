-- CreateTable
CREATE TABLE "CompanyUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'buyer',
    "spendingLimit" REAL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CompanyUser_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "B2BCustomer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SalesRep" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "commissionRate" REAL NOT NULL DEFAULT 0.05,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SalesActivity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "salesRepId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "customerId" TEXT,
    "orderValue" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SalesActivity_salesRepId_fkey" FOREIGN KEY ("salesRepId") REFERENCES "SalesRep" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FavoriteList" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'My Favorites',
    "items" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FavoriteList_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "B2BCustomer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "items" JSONB NOT NULL,
    "subtotal" REAL NOT NULL,
    "tax" REAL NOT NULL DEFAULT 0,
    "shipping" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
    "shippingAddress" JSONB NOT NULL,
    "billingAddress" JSONB NOT NULL,
    "notes" TEXT,
    "poNumber" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "B2BCustomer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_B2BCustomer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "taxId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "customerGroupId" INTEGER NOT NULL DEFAULT 1,
    "bigcommerceId" INTEGER,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "creditLimit" REAL NOT NULL DEFAULT 0,
    "paymentTerms" TEXT NOT NULL DEFAULT 'NET30',
    "salesRepId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "B2BCustomer_salesRepId_fkey" FOREIGN KEY ("salesRepId") REFERENCES "SalesRep" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_B2BCustomer" ("bigcommerceId", "companyName", "createdAt", "creditLimit", "customerGroupId", "email", "firstName", "id", "isApproved", "lastName", "password", "paymentTerms", "phone", "taxId", "updatedAt") SELECT "bigcommerceId", "companyName", "createdAt", "creditLimit", "customerGroupId", "email", "firstName", "id", "isApproved", "lastName", "password", "paymentTerms", "phone", "taxId", "updatedAt" FROM "B2BCustomer";
DROP TABLE "B2BCustomer";
ALTER TABLE "new_B2BCustomer" RENAME TO "B2BCustomer";
CREATE UNIQUE INDEX "B2BCustomer_email_key" ON "B2BCustomer"("email");
CREATE UNIQUE INDEX "B2BCustomer_bigcommerceId_key" ON "B2BCustomer"("bigcommerceId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "CompanyUser_email_key" ON "CompanyUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "SalesRep_email_key" ON "SalesRep"("email");

-- CreateIndex
CREATE UNIQUE INDEX "FavoriteList_customerId_name_key" ON "FavoriteList"("customerId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
