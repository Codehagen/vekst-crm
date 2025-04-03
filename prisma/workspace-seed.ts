const {
  PrismaClient,
  BusinessStatus,
  CustomerStage,
  ActivityType,
  WorkspaceRole,
  JobApplicationStatus,
  TicketStatus,
  Priority,
} = require("@prisma/client");

const prisma = new PrismaClient();

// Test user ID - this would be the ID of your authenticated user
// Replace with your actual user ID when testing
const TEST_USER_ID = "test_user_1";

async function main() {
  console.log("Start seeding workspaces...");

  // Check if workspaces already exist
  let workspace1 = await prisma.workspace.findFirst({
    where: { orgNumber: "123456789" },
  });

  let workspace2 = await prisma.workspace.findFirst({
    where: { orgNumber: "987654321" },
  });

  // Create workspaces if they don't exist
  if (!workspace1) {
    workspace1 = await prisma.workspace.create({
      data: {
        name: "Finance Hub AS",
        orgNumber: "123456789",
        address: "Finansveien 10",
        postalCode: "0151",
        city: "Oslo",
        country: "Norway",
        email: "contact@financehub.no",
        phone: "22112233",
        website: "https://financehub.no",
        plan: "premium",
        maxUsers: 10,
      },
    });
    console.log("Created workspace:", workspace1.name);
  } else {
    console.log("Using existing workspace:", workspace1.name);
  }

  if (!workspace2) {
    workspace2 = await prisma.workspace.create({
      data: {
        name: "Tech Innovators AS",
        orgNumber: "987654321",
        address: "Teknologigata 5",
        postalCode: "0362",
        city: "Oslo",
        country: "Norway",
        email: "info@techinnovators.no",
        phone: "23456789",
        website: "https://techinnovators.no",
        plan: "basic",
        maxUsers: 5,
      },
    });
    console.log("Created workspace:", workspace2.name);
  } else {
    console.log("Using existing workspace:", workspace2.name);
  }

  // Create a test user if it doesn't exist
  const existingUser = await prisma.user.findUnique({
    where: { id: TEST_USER_ID },
  });

  if (!existingUser) {
    await prisma.user.create({
      data: {
        id: TEST_USER_ID,
        name: "Test User",
        email: "test@example.com",
        emailVerified: true,
        workspaceId: workspace1.id, // Initially assign to workspace1
        workspaceRole: WorkspaceRole.admin,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log("Created test user with ID:", TEST_USER_ID);
  } else {
    // Update existing user to point to workspace1
    await prisma.user.update({
      where: { id: TEST_USER_ID },
      data: {
        workspaceId: workspace1.id,
        workspaceRole: WorkspaceRole.admin,
      },
    });
    console.log("Updated existing user to workspace1");
  }

  // Create additional users for workspace1
  const existingUser2 = await prisma.user.findUnique({
    where: { id: "test_user_2" },
  });

  if (!existingUser2) {
    await prisma.user.create({
      data: {
        id: "test_user_2",
        name: "Jane Smith",
        email: "jane@financehub.no",
        emailVerified: true,
        workspaceId: workspace1.id,
        workspaceRole: WorkspaceRole.member,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log("Created second test user");
  }

  // Create businesses for workspace1
  const businesses1 = await Promise.all([
    prisma.business.create({
      data: {
        name: "Oslo Finans AS",
        email: "kontakt@oslofinans.no",
        phone: "22334455",
        status: BusinessStatus.active,
        stage: CustomerStage.customer,
        workspaceId: workspace1.id,
        contactPerson: "Kari Nordmann",
        industry: "Finance",
        bilagCount: 12,
      },
    }),
    prisma.business.create({
      data: {
        name: "Bergen Invest AS",
        email: "post@bergeninvest.no",
        phone: "55667788",
        status: BusinessStatus.active,
        stage: CustomerStage.lead,
        workspaceId: workspace1.id,
        contactPerson: "Per Hansen",
        industry: "Investment",
        potensiellVerdi: 500000,
      },
    }),
  ]);

  // Create businesses for workspace2
  const businesses2 = await Promise.all([
    prisma.business.create({
      data: {
        name: "CodeMasters AS",
        email: "hello@codemasters.no",
        phone: "22998877",
        status: BusinessStatus.active,
        stage: CustomerStage.customer,
        workspaceId: workspace2.id,
        contactPerson: "Lisa Olsen",
        industry: "Software Development",
        bilagCount: 8,
      },
    }),
    prisma.business.create({
      data: {
        name: "Digital Solutions AS",
        email: "contact@digitalsolutions.no",
        phone: "23456543",
        status: BusinessStatus.active,
        stage: CustomerStage.prospect,
        workspaceId: workspace2.id,
        contactPerson: "Erik Johnson",
        industry: "IT Consulting",
        potensiellVerdi: 350000,
      },
    }),
  ]);

  console.log(`Created ${businesses1.length} businesses for workspace1`);
  console.log(`Created ${businesses2.length} businesses for workspace2`);

  // Create contacts for businesses
  const contacts = [];
  for (const business of [...businesses1, ...businesses2]) {
    const contact = await prisma.contact.create({
      data: {
        name: business.contactPerson || "Contact Person",
        email: `contact@${business.name.toLowerCase().replace(/\s/g, "")}.no`,
        phone: business.phone,
        position: "Manager",
        isPrimary: true,
        businessId: business.id,
      },
    });
    contacts.push(contact);
  }

  console.log("Created contacts for all businesses");

  // Create tickets for workspace1
  console.log("Creating tickets for workspace1...");

  // Create tickets for first business in workspace1
  await Promise.all([
    prisma.ticket.create({
      data: {
        title: "Invoice discrepancy question",
        description:
          "We have a question about our last invoice. The total amount doesn't match our records.",
        status: TicketStatus.open,
        priority: Priority.medium,
        businessId: businesses1[0].id,
        assigneeId: TEST_USER_ID,
        creatorId: TEST_USER_ID,
        submitterName: contacts[0].name,
        submitterEmail: contacts[0].email,
      },
    }),
    prisma.ticket.create({
      data: {
        title: "Need access to financial reports",
        description:
          "I cannot access the Q2 financial reports in the customer portal. Please help.",
        status: TicketStatus.in_progress,
        priority: Priority.high,
        businessId: businesses1[0].id,
        assigneeId: TEST_USER_ID,
        creatorId: TEST_USER_ID,
        submitterName: contacts[0].name,
        submitterEmail: contacts[0].email,
      },
    }),
    prisma.ticket.create({
      data: {
        title: "Request for additional services",
        description:
          "We're interested in adding tax advisory services to our current package.",
        status: TicketStatus.unassigned,
        priority: Priority.low,
        businessId: businesses1[0].id,
        creatorId: TEST_USER_ID,
        submitterName: contacts[0].name,
        submitterEmail: contacts[0].email,
      },
    }),
  ]);

  // Create tickets for second business in workspace1
  await Promise.all([
    prisma.ticket.create({
      data: {
        title: "Integration with banking system",
        description:
          "Need help setting up the integration with our DnB banking system.",
        status: TicketStatus.open,
        priority: Priority.urgent,
        businessId: businesses1[1].id,
        assigneeId: "test_user_2", // Assigned to second user
        creatorId: TEST_USER_ID,
        submitterName: contacts[1].name,
        submitterEmail: contacts[1].email,
      },
    }),
    prisma.ticket.create({
      data: {
        title: "Issue with expense reporting",
        description:
          "Our team is having trouble categorizing expenses in the new system.",
        status: TicketStatus.waiting_on_customer,
        priority: Priority.medium,
        businessId: businesses1[1].id,
        assigneeId: "test_user_2", // Assigned to second user
        creatorId: TEST_USER_ID,
        submitterName: contacts[1].name,
        submitterEmail: contacts[1].email,
      },
    }),
  ]);

  // Create unassigned ticket for workspace1
  await prisma.ticket.create({
    data: {
      title: "New business inquiry",
      description:
        "I would like to learn more about your services for my startup.",
      status: TicketStatus.unassigned,
      priority: Priority.medium,
      submitterName: "Potential Customer",
      submitterEmail: "potential@example.com",
      submittedCompanyName: "Startup Inc",
      creatorId: "system",
    },
  });

  // Create tickets for workspace2
  console.log("Creating tickets for workspace2...");

  // Create tickets for first business in workspace2
  await Promise.all([
    prisma.ticket.create({
      data: {
        title: "Website performance issue",
        description:
          "Our website is loading very slowly. We need technical support.",
        status: TicketStatus.open,
        priority: Priority.high,
        businessId: businesses2[0].id,
        creatorId: TEST_USER_ID,
        submitterName: contacts[2].name,
        submitterEmail: contacts[2].email,
      },
    }),
    prisma.ticket.create({
      data: {
        title: "API documentation request",
        description: "Need updated documentation for your REST API endpoints.",
        status: TicketStatus.resolved,
        priority: Priority.medium,
        businessId: businesses2[0].id,
        creatorId: TEST_USER_ID,
        resolvedAt: new Date(),
        submitterName: contacts[2].name,
        submitterEmail: contacts[2].email,
      },
    }),
  ]);

  // Create tickets for second business in workspace2
  await prisma.ticket.create({
    data: {
      title: "UX/UI design consultation",
      description:
        "We'd like to schedule a design review session for our new application.",
      status: TicketStatus.in_progress,
      priority: Priority.medium,
      businessId: businesses2[1].id,
      creatorId: TEST_USER_ID,
      submitterName: contacts[3].name,
      submitterEmail: contacts[3].email,
    },
  });

  console.log("Created tickets for both workspaces");

  // Add ticket comments
  await prisma.ticketComment.create({
    data: {
      content:
        "I've checked the invoice and see the discrepancy. Will fix and send an updated version.",
      authorId: TEST_USER_ID,
      ticketId:
        (
          await prisma.ticket.findFirst({
            where: { title: "Invoice discrepancy question" },
          })
        )?.id || "",
      isInternal: false,
    },
  });

  await prisma.ticketComment.create({
    data: {
      content:
        "Customer has a history of payment delays. Keep this in mind when responding.",
      authorId: TEST_USER_ID,
      ticketId:
        (
          await prisma.ticket.findFirst({
            where: { title: "Invoice discrepancy question" },
          })
        )?.id || "",
      isInternal: true, // Internal note
    },
  });

  console.log("Added comments to tickets");

  // Create or update job applications for workspace1
  try {
    // Check if applications already exist for workspace1
    const existingApp1 = await prisma.jobApplication.findFirst({
      where: {
        email: "anders@example.com",
      },
    });

    const existingApp2 = await prisma.jobApplication.findFirst({
      where: {
        email: "lise@example.com",
      },
    });

    // Create or update applications
    if (!existingApp1) {
      await prisma.jobApplication.create({
        data: {
          firstName: "Anders",
          lastName: "Andersen",
          email: "anders@example.com",
          phone: "98765432",
          desiredPosition: "Financial Advisor",
          status: JobApplicationStatus.new,
          skills: ["Finance", "Advisory", "Excel"],
          applicationDate: new Date(),
          updatedAt: new Date(),
          workspaceId: workspace1.id, // Associate with workspace1
        },
      });
      console.log("Created job application for Anders Andersen in workspace1");
    } else {
      // Try to update with workspace ID
      try {
        await prisma.jobApplication.update({
          where: { id: existingApp1.id },
          data: {
            workspaceId: workspace1.id,
            updatedAt: new Date(),
          },
        });
        console.log(
          "Updated job application for Anders Andersen with workspace1"
        );
      } catch (error: any) {
        console.warn(
          "Could not update application with workspace:",
          error.message
        );
      }
    }

    if (!existingApp2) {
      await prisma.jobApplication.create({
        data: {
          firstName: "Lise",
          lastName: "Johansen",
          email: "lise@example.com",
          phone: "87654321",
          desiredPosition: "Investment Manager",
          status: JobApplicationStatus.reviewing,
          skills: ["Investment", "Portfolio Management", "Analysis"],
          applicationDate: new Date(),
          updatedAt: new Date(),
          workspaceId: workspace1.id, // Associate with workspace1
        },
      });
      console.log("Created job application for Lise Johansen in workspace1");
    } else {
      // Try to update with workspace ID
      try {
        await prisma.jobApplication.update({
          where: { id: existingApp2.id },
          data: {
            workspaceId: workspace1.id,
            updatedAt: new Date(),
          },
        });
        console.log(
          "Updated job application for Lise Johansen with workspace1"
        );
      } catch (error: any) {
        console.warn(
          "Could not update application with workspace:",
          error.message
        );
      }
    }
  } catch (error: any) {
    console.warn(
      "Could not handle applications for workspace1:",
      error.message
    );
  }

  // Create or update job applications for workspace2
  try {
    // Check if applications already exist for workspace2
    const existingApp1 = await prisma.jobApplication.findFirst({
      where: {
        email: "thomas@example.com",
      },
    });

    const existingApp2 = await prisma.jobApplication.findFirst({
      where: {
        email: "maria@example.com",
      },
    });

    // Create or update applications
    if (!existingApp1) {
      await prisma.jobApplication.create({
        data: {
          firstName: "Thomas",
          lastName: "Hansen",
          email: "thomas@example.com",
          phone: "76543210",
          desiredPosition: "Full Stack Developer",
          status: JobApplicationStatus.new,
          skills: ["JavaScript", "React", "Node.js", "TypeScript"],
          applicationDate: new Date(),
          updatedAt: new Date(),
          workspaceId: workspace2.id, // Associate with workspace2
        },
      });
      console.log("Created job application for Thomas Hansen in workspace2");
    } else {
      // Try to update with workspace ID
      try {
        await prisma.jobApplication.update({
          where: { id: existingApp1.id },
          data: {
            workspaceId: workspace2.id,
            updatedAt: new Date(),
          },
        });
        console.log(
          "Updated job application for Thomas Hansen with workspace2"
        );
      } catch (error: any) {
        console.warn(
          "Could not update application with workspace:",
          error.message
        );
      }
    }

    if (!existingApp2) {
      await prisma.jobApplication.create({
        data: {
          firstName: "Maria",
          lastName: "Larsen",
          email: "maria@example.com",
          phone: "65432109",
          desiredPosition: "UX Designer",
          status: JobApplicationStatus.interviewed,
          skills: ["UI/UX", "Figma", "User Research"],
          applicationDate: new Date(),
          updatedAt: new Date(),
          workspaceId: workspace2.id, // Associate with workspace2
        },
      });
      console.log("Created job application for Maria Larsen in workspace2");
    } else {
      // Try to update with workspace ID
      try {
        await prisma.jobApplication.update({
          where: { id: existingApp2.id },
          data: {
            workspaceId: workspace2.id,
            updatedAt: new Date(),
          },
        });
        console.log("Updated job application for Maria Larsen with workspace2");
      } catch (error: any) {
        console.warn(
          "Could not update application with workspace:",
          error.message
        );
      }
    }
  } catch (error: any) {
    console.warn(
      "Could not handle applications for workspace2:",
      error.message
    );
  }

  // Add activities to businesses
  for (const business of businesses1) {
    await prisma.activity.create({
      data: {
        type: ActivityType.meeting,
        date: new Date(),
        description: `Initial meeting with ${business.name}`,
        completed: true,
        businessId: business.id,
        userId: TEST_USER_ID,
      },
    });
  }

  for (const business of businesses2) {
    await prisma.activity.create({
      data: {
        type: ActivityType.call,
        date: new Date(),
        description: `Phone call with ${business.name}`,
        completed: true,
        businessId: business.id,
        userId: TEST_USER_ID,
      },
    });
  }

  console.log("Created activities for businesses in both workspaces");
  console.log("Workspace seeding completed");
}

main()
  .catch((e) => {
    console.error("Error during workspace seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
