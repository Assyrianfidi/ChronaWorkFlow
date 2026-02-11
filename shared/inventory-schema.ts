// Inventory Tables - Missing from schema.ts
import { pgTable, varchar, integer, numeric, timestamp, boolean } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

export const inventoryItems = pgTable("inventory_items", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id", { length: 36 }).notNull(),
  sku: varchar("sku", { length: 100 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: varchar("description", { length: 1000 }),
  categoryId: varchar("category_id", { length: 36 }),
  unitOfMeasure: varchar("unit_of_measure", { length: 50 }).notNull(),
  costMethod: varchar("cost_method", { length: 20 }).default("fifo").notNull(),
  reorderPoint: integer("reorder_point").default(0),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const inventoryTransactions = pgTable("inventory_transactions", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id", { length: 36 }).notNull(),
  itemId: varchar("item_id", { length: 36 }).notNull(),
  locationId: varchar("location_id", { length: 36 }).notNull(),
  transactionType: varchar("transaction_type", { length: 20 }).notNull(), // purchase, sale, adjustment, transfer
  quantity: integer("quantity").notNull(),
  unitCost: numeric("unit_cost", { precision: 10, scale: 2 }),
  referenceId: varchar("reference_id", { length: 36 }), // Links to bill/invoice
  referenceType: varchar("reference_type", { length: 20 }),
  notes: varchar("notes", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const inventoryBalances = pgTable("inventory_balances", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id", { length: 36 }).notNull(),
  itemId: varchar("item_id", { length: 36 }).notNull(),
  locationId: varchar("location_id", { length: 36 }).notNull(),
  quantityOnHand: integer("quantity_on_hand").default(0).notNull(),
  unitCost: numeric("unit_cost", { precision: 10, scale: 2 }),
  totalValue: numeric("total_value", { precision: 15, scale: 2 }).default("0").notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export const inventoryLocations = pgTable("inventory_locations", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id", { length: 36 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  address: varchar("address", { length: 500 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const inventoryItemsRelations = relations(inventoryItems, ({ many }) => ({
  transactions: many(inventoryTransactions),
  balances: many(inventoryBalances),
}));

export const inventoryTransactionsRelations = relations(inventoryTransactions, ({ one }) => ({
  item: one(inventoryItems, {
    fields: [inventoryTransactions.itemId],
    references: [inventoryItems.id],
  }),
}));

export const inventoryBalancesRelations = relations(inventoryBalances, ({ one }) => ({
  item: one(inventoryItems, {
    fields: [inventoryBalances.itemId],
    references: [inventoryItems.id],
  }),
}));
