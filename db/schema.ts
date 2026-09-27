import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  numeric,
  timestamp,
  pgEnum,
  check,
  index,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

export const userRoleEnum = pgEnum("user_role", [
  "REPORTER",
  "STAFF",
  "ADMIN",
]);

export const ticketStatusEnum = pgEnum("ticket_status", [
  "OPEN",
  "IN_PROGRESS",
  "WAITING_INFO",
  "RESOLVED",
  "CLOSED",
]);

export const ticketPriorityEnum = pgEnum("ticket_priority", [
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
]);

export const ticketEventTypeEnum = pgEnum("ticket_event_type", [
  "TICKET_CREATED",
  "STATUS_CHANGED",
  "ASSIGNED",
  "UNASSIGNED",
  "PRIORITY_CHANGED",
  "CATEGORY_CHANGED",
  "TEAM_CHANGED",
  "COMMENT_ADDED",
  "ATTACHMENT_ADDED",
  "FEEDBACK_SUBMITTED",
  "TICKET_CLOSED",
]);

export const teams = pgTable("teams", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at", {mode: "date" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", {mode: "date" })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    googleId: varchar("google_id", { length: 255 }).unique(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    fullName: varchar("full_name", { length: 255 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }),
    avatarUrl: text("avatar_url"),
    role: userRoleEnum("role").default("REPORTER").notNull(),
    teamId: uuid("team_id").references(() => teams.id, { onDelete: "set null" }),
    lastLoginAt: timestamp("last_login_at", {mode: "date" }),
    createdAt: timestamp("created_at", {mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", {mode: "date" })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("users_role_idx").on(table.role),
    index("users_team_id_idx").on(table.teamId),
    check(
      "users_auth_method_check",
      sql`${table.googleId} IS NOT NULL OR ${table.passwordHash} IS NOT NULL`
    ),
  ]
);

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  description: text("description"),
  defaultTeamId: uuid("default_team_id").references(() => teams.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", {mode: "date" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", {mode: "date" })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const locations = pgTable("locations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  building: varchar("building", { length: 255 }).notNull(),
  floor: varchar("floor", { length: 50 }),
  room: varchar("room", { length: 50 }),
  latitude: numeric("latitude", { precision: 10, scale: 7 }),
  longitude: numeric("longitude", { precision: 10, scale: 7 }),
  createdAt: timestamp("created_at", { mode: "date" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", {mode: "date" })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const tickets = pgTable(
  "tickets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ticketNumber: varchar("ticket_number", { length: 50 }).notNull().unique(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),
    status: ticketStatusEnum("status").default("OPEN").notNull(),
    priority: ticketPriorityEnum("priority").default("MEDIUM").notNull(),
    reporterId: uuid("reporter_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    assigneeId: uuid("assignee_id").references(() => users.id, {
      onDelete: "set null",
    }),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "restrict" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    locationId: uuid("location_id")
      .notNull()
      .references(() => locations.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", {mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", {mode: "date" })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
    resolvedAt: timestamp("resolved_at", {mode: "date" }),
    closedAt: timestamp("closed_at", {mode: "date" }),
  },
  (table) => [
    index("tickets_status_idx").on(table.status),
    index("tickets_priority_idx").on(table.priority),
    index("tickets_reporter_id_idx").on(table.reporterId),
    index("tickets_assignee_id_idx").on(table.assigneeId),
    index("tickets_team_id_idx").on(table.teamId),
    index("tickets_category_id_idx").on(table.categoryId),
    index("tickets_location_id_idx").on(table.locationId),
    index("tickets_created_at_idx").on(table.createdAt),
  ]
);

export const ticketComments = pgTable(
  "ticket_comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ticketId: uuid("ticket_id")
      .notNull()
      .references(() => tickets.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    message: text("message").notNull(),
    createdAt: timestamp("created_at", {mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", {mode: "date" })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("ticket_comments_ticket_id_created_at_idx").on(
      table.ticketId,
      table.createdAt
    ),
  ]
);

export const ticketAttachments = pgTable(
  "ticket_attachments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ticketId: uuid("ticket_id")
      .notNull()
      .references(() => tickets.id, { onDelete: "cascade" }),
    uploadedById: uuid("uploaded_by_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    fileUrl: text("file_url").notNull(),
    mimeType: varchar("mime_type", { length: 100 }).notNull(),
    fileSize: integer("file_size").notNull(),
    createdAt: timestamp("created_at", {mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("ticket_attachments_ticket_id_created_at_idx").on(
      table.ticketId,
      table.createdAt
    ),
  ]
);

export const ticketEvents = pgTable(
  "ticket_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ticketId: uuid("ticket_id")
      .notNull()
      .references(() => tickets.id, { onDelete: "cascade" }),
    actorId: uuid("actor_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    eventType: ticketEventTypeEnum("event_type").notNull(),
    oldValue: text("old_value"),
    newValue: text("new_value"),
    note: text("note"),
    createdAt: timestamp("created_at", {mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("ticket_events_ticket_id_created_at_idx").on(
      table.ticketId,
      table.createdAt
    ),
  ]
);

export const feedback = pgTable(
  "feedback",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ticketId: uuid("ticket_id")
      .notNull()
      .unique()
      .references(() => tickets.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    comment: text("comment"),
    createdAt: timestamp("created_at", {mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", {mode: "date" })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    check(
      "feedback_rating_check",
      sql`${table.rating} >= 1 AND ${table.rating} <= 5`
    ),
  ]
);

export const teamsTable = teams;
export const usersTable = users;
export const categoriesTable = categories;
export const locationsTable = locations;
export const ticketsTable = tickets;
export const ticketCommentsTable = ticketComments;
export const ticketAttachmentsTable = ticketAttachments;
export const ticketEventsTable = ticketEvents;
export const feedbackTable = feedback;

export const teamsRelations = relations(teams, ({ many }) => ({
  users: many(users),
  defaultCategories: many(categories),
  tickets: many(tickets),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  team: one(teams, {
    fields: [users.teamId],
    references: [teams.id],
  }),
  reportedTickets: many(tickets, { relationName: "ticketReporter" }),
  assignedTickets: many(tickets, { relationName: "ticketAssignee" }),
  comments: many(ticketComments),
  attachments: many(ticketAttachments),
  ticketEvents: many(ticketEvents),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  defaultTeam: one(teams, {
    fields: [categories.defaultTeamId],
    references: [teams.id],
  }),
  tickets: many(tickets),
}));

export const locationsRelations = relations(locations, ({ many }) => ({
  tickets: many(tickets),
}));

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  reporter: one(users, {
    fields: [tickets.reporterId],
    references: [users.id],
    relationName: "ticketReporter",
  }),
  assignee: one(users, {
    fields: [tickets.assigneeId],
    references: [users.id],
    relationName: "ticketAssignee",
  }),
  team: one(teams, {
    fields: [tickets.teamId],
    references: [teams.id],
  }),
  category: one(categories, {
    fields: [tickets.categoryId],
    references: [categories.id],
  }),
  location: one(locations, {
    fields: [tickets.locationId],
    references: [locations.id],
  }),
  comments: many(ticketComments),
  attachments: many(ticketAttachments),
  events: many(ticketEvents),
  feedback: one(feedback),
}));

export const ticketCommentsRelations = relations(ticketComments, ({ one }) => ({
  ticket: one(tickets, {
    fields: [ticketComments.ticketId],
    references: [tickets.id],
  }),
  user: one(users, {
    fields: [ticketComments.userId],
    references: [users.id],
  }),
}));

export const ticketAttachmentsRelations = relations(
  ticketAttachments,
  ({ one }) => ({
    ticket: one(tickets, {
      fields: [ticketAttachments.ticketId],
      references: [tickets.id],
    }),
    uploadedBy: one(users, {
      fields: [ticketAttachments.uploadedById],
      references: [users.id],
    }),
  })
);

export const ticketEventsRelations = relations(ticketEvents, ({ one }) => ({
  ticket: one(tickets, {
    fields: [ticketEvents.ticketId],
    references: [tickets.id],
  }),
  actor: one(users, {
    fields: [ticketEvents.actorId],
    references: [users.id],
  }),
}));

export const feedbackRelations = relations(feedback, ({ one }) => ({
  ticket: one(tickets, {
    fields: [feedback.ticketId],
    references: [tickets.id],
  }),
}));
