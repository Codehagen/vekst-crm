const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Starting ticket update process...");

  try {
    // First, get all tickets without workspaceId
    const ticketsWithoutWorkspace = await prisma.ticket.findMany({
      include: {
        business: true,
      },
    });

    console.log(`Found ${ticketsWithoutWorkspace.length} tickets total`);

    // Get default workspace if we need it
    const defaultWorkspace = await prisma.workspace.findFirst({
      orderBy: { createdAt: "asc" },
    });

    if (!defaultWorkspace) {
      throw new Error(
        "No default workspace found. Please create at least one workspace first."
      );
    }

    console.log(
      `Using default workspace: ${defaultWorkspace.name} (${defaultWorkspace.id})`
    );

    // Keep track of updates
    let updatedCount = 0;

    // Process each ticket
    for (const ticket of ticketsWithoutWorkspace) {
      // Skip tickets that already have a workspaceId
      if (ticket.workspaceId) {
        continue;
      }

      let workspaceId = defaultWorkspace.id;

      // If ticket has a business, use that business's workspaceId
      if (ticket.business && ticket.business.workspaceId) {
        workspaceId = ticket.business.workspaceId;
        console.log(`Using business's workspace for ticket: ${ticket.id}`);
      }
      // If ticket has a creatorId, find that user's workspaceId
      else if (ticket.creatorId && ticket.creatorId !== "system") {
        const creator = await prisma.user.findUnique({
          where: { id: ticket.creatorId },
          select: { workspaceId: true },
        });

        if (creator?.workspaceId) {
          workspaceId = creator.workspaceId;
          console.log(`Using creator's workspace for ticket: ${ticket.id}`);
        } else {
          console.log(
            `Using default workspace for ticket: ${ticket.id} (creator has no workspace)`
          );
        }
      }
      // If ticket has an assigneeId, find that user's workspaceId
      else if (ticket.assigneeId) {
        const assignee = await prisma.user.findUnique({
          where: { id: ticket.assigneeId },
          select: { workspaceId: true },
        });

        if (assignee?.workspaceId) {
          workspaceId = assignee.workspaceId;
          console.log(`Using assignee's workspace for ticket: ${ticket.id}`);
        } else {
          console.log(
            `Using default workspace for ticket: ${ticket.id} (assignee has no workspace)`
          );
        }
      }
      // Default case
      else {
        console.log(
          `Using default workspace for ticket: ${ticket.id} (no relations found)`
        );
      }

      // Update the ticket with the determined workspaceId
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: {
          workspaceId,
        },
      });

      updatedCount++;
    }

    console.log(
      `Successfully updated ${updatedCount} tickets with workspace IDs`
    );
  } catch (error) {
    console.error("Error updating tickets:", error);
  }
}

main()
  .catch((e) => {
    console.error("Script execution error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
