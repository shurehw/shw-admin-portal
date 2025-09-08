import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      companyName: string
      companyId: string
      customerGroupId: number
      bigcommerceId?: number
      customerId: string
      role: string
      isAdmin?: boolean
      canCreateOrders: boolean
      canApproveOrders: boolean
      canViewPricing: boolean
      canManageUsers: boolean
      spendingLimit: number | null
      isCompanyUser: boolean
      accessToken?: string
    }
  }

  interface User {
    id: string
    email: string
    name: string
    companyName: string
    companyId: string
    customerGroupId: number
    bigcommerceId?: number
    customerId: string
    role: string
    canCreateOrders: boolean
    canApproveOrders: boolean
    canViewPricing: boolean
    canManageUsers: boolean
    spendingLimit: number | null
    isCompanyUser: boolean
    accessToken?: string
  }
}