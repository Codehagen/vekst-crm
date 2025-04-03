# Server Actions Guide

This guide explains how to properly implement server actions that respect workspace boundaries in our CRM system.

## Understanding Workspaces

Our CRM system uses a multi-tenant architecture based on workspaces:

- A **Workspace** represents the main business that pays for the service
- Each **User** belongs to a workspace
- All **Business**, **Contact**, and other data belongs to a workspace
- Users can only access data that belongs to their workspace

## Workspace-Aware Server Actions Pattern

When implementing server actions, follow these patterns to ensure proper workspace isolation:

### 1. Getting the Current Workspace ID

```typescript
async function getCurrentUserWorkspaceId(): Promise<string> {
  const session = await getSession({
    headers: headers(),
  });

  if (!session?.user?.id) {
    throw new Error("Authentication required");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { workspaceId: true },
  });

  if (!user?.workspaceId) {
    throw new Error("No workspace found for user");
  }

  return user.workspaceId;
}
```

### 2. Filtering Data by Workspace

When fetching data, always include the workspace filter:

```typescript
export async function getAllItems() {
  try {
    const workspaceId = await getCurrentUserWorkspaceId();

    return prisma.item.findMany({
      where: { workspaceId },
      // ... other query options
    });
  } catch (error) {
    console.error("Error fetching items:", error);
    return [];
  }
}
```

### 3. Verifying Resource Ownership

When accessing a specific resource by ID, verify it belongs to the user's workspace:

```typescript
export async function getItemById(id: string) {
  try {
    const workspaceId = await getCurrentUserWorkspaceId();

    return prisma.item.findFirst({
      where: { 
        id,
        workspaceId 
      },
      // ... include related data
    });
  } catch (error) {
    console.error(`Error fetching item ${id}:`, error);
    return null;
  }
}
```

### 4. Creating Resources within a Workspace

When creating new data, associate it with the user's workspace:

```typescript
export async function createItem(data: Prisma.ItemCreateInput) {
  try {
    const workspaceId = await getCurrentUserWorkspaceId();
    
    return prisma.item.create({
      data: {
        ...data,
        workspace: {
          connect: { id: workspaceId }
        }
      }
    });
  } catch (error) {
    console.error("Error creating item:", error);
    throw new Error("Failed to create item");
  }
}
```

### 5. Updating Resources with Workspace Verification

When updating data, verify the resource belongs to the user's workspace:

```typescript
export async function updateItem(id: string, data: Prisma.ItemUpdateInput) {
  try {
    const workspaceId = await getCurrentUserWorkspaceId();
    
    // Verify item belongs to workspace
    const item = await prisma.item.findFirst({
      where: { 
        id,
        workspaceId 
      },
      select: { id: true }
    });

    if (!item) {
      throw new Error("Item not found in workspace");
    }

    return prisma.item.update({
      where: { id },
      data,
    });
  } catch (error) {
    console.error(`Error updating item ${id}:`, error);
    throw new Error("Failed to update item");
  }
}
```

## Best Practices

1. **Always filter by workspace**: Every query should filter by the user's workspace
2. **Verify resource ownership**: Before updating or deleting, check that the resource belongs to the user's workspace
3. **Handle errors gracefully**: Catch errors and provide meaningful feedback
4. **Use proper typing**: Define interfaces for input data
5. **Limit exposed data**: Only return the data that's necessary
6. **Check permissions**: For critical operations, verify the user's role within the workspace

## Example Usage Pattern

A typical pattern for implementing workspace-aware server actions:

```typescript
"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

// Helper function to get current workspace ID
async function getCurrentUserWorkspaceId(): Promise<string> {
  const session = await getSession({ headers: headers() });
  if (!session?.user?.id) throw new Error("Authentication required");
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { workspaceId: true },
  });
  
  if (!user?.workspaceId) throw new Error("No workspace found");
  return user.workspaceId;
}

// List all items for current workspace
export async function getAllItems() {
  try {
    const workspaceId = await getCurrentUserWorkspaceId();
    return prisma.item.findMany({ where: { workspaceId } });
  } catch (error) {
    console.error("Error:", error);
    return [];
  }
}

// Create item in current workspace
export async function createItem(data: any) {
  try {
    const workspaceId = await getCurrentUserWorkspaceId();
    const item = await prisma.item.create({
      data: {
        ...data,
        workspace: { connect: { id: workspaceId } }
      }
    });
    revalidatePath("/items");
    return { success: true, item };
  } catch (error) {
    console.error("Error:", error);
    return { success: false, error: "Failed to create item" };
  }
}
```

By following these patterns, you'll ensure proper data isolation between workspaces and maintain security in our multi-tenant CRM system. 