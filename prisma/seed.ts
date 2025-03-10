import {
  PrismaClient,
  BusinessStatus,
  CustomerStage,
  ActivityType,
  OfferStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Start seeding the database...");

  // Clear existing data
  await prisma.offerItem.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.business.deleteMany();

  console.log("Deleted existing data");

  // Create businesses at lead stage (previously leads)
  const leads = await Promise.all([
    prisma.business.create({
      data: {
        name: "Ola Nordmann",
        email: "ola@example.no",
        phone: "99887766",
        contactPerson: "Ola Nordmann",
        stage: CustomerStage.lead,
        status: BusinessStatus.active,
        potensiellVerdi: 75000,
      },
    }),
    prisma.business.create({
      data: {
        name: "Hansen Konsult",
        email: "kari@bedrift.no",
        phone: "45678901",
        contactPerson: "Kari Hansen",
        stage: CustomerStage.lead,
        status: BusinessStatus.active,
        potensiellVerdi: 120000,
      },
    }),
    prisma.business.create({
      data: {
        name: "Johansen og Sønner",
        email: "lars@firma.no",
        phone: "91234567",
        contactPerson: "Lars Johansen",
        stage: CustomerStage.lead,
        status: BusinessStatus.active,
        potensiellVerdi: 250000,
      },
    }),
    prisma.business.create({
      data: {
        name: "Olsen Digital",
        email: "ingrid@selskap.no",
        phone: "92345678",
        contactPerson: "Ingrid Olsen",
        stage: CustomerStage.prospect,
        status: BusinessStatus.active,
        potensiellVerdi: 180000,
      },
    }),
    prisma.business.create({
      data: {
        name: "Konsulent Berg",
        email: "erik@konsulent.no",
        phone: "93456789",
        contactPerson: "Erik Berg",
        stage: CustomerStage.lead,
        status: BusinessStatus.active,
        potensiellVerdi: 50000,
      },
    }),
  ]);

  console.log(`Created ${leads.length} leads (businesses at lead stage)`);

  // Create a full customer record
  const norskTeknologi = await prisma.business.create({
    data: {
      name: "Norsk Teknologi AS",
      orgNumber: "912345678",
      address: "Teknologiveien 1",
      postalCode: "0371",
      city: "Oslo",
      country: "Norge",
      contactPerson: "Ola Nordmann",
      email: "kontakt@norskteknologi.no",
      phone: "22334455",
      website: "https://www.norskteknologi.no",
      industry: "IT og Teknologi",
      numberOfEmployees: 25,
      revenue: 15000000,
      notes: "Ledende teknologibedrift innen software utvikling.",
      bilagCount: 12,
      status: BusinessStatus.active,
      stage: CustomerStage.customer,
      tags: {
        create: [
          { name: "tech" },
          { name: "software" },
          { name: "consulting" },
        ],
      },
      contacts: {
        create: [
          {
            name: "Ola Nordmann",
            email: "ola@norskteknologi.no",
            phone: "99887766",
            position: "Daglig leder",
            isPrimary: true,
            notes: "Primær kontaktperson",
          },
          {
            name: "Kari Olsen",
            email: "kari@norskteknologi.no",
            phone: "99887755",
            position: "Økonomisjef",
            isPrimary: false,
          },
        ],
      },
    },
  });

  console.log("Created Norsk Teknologi AS as a customer");

  // Get the contacts for activities
  const contacts = await prisma.contact.findMany({
    where: {
      businessId: norskTeknologi.id,
    },
  });

  // Create activities for the business
  await prisma.activity.createMany({
    data: [
      {
        type: ActivityType.meeting,
        date: new Date("2023-08-15"),
        description: "Innledende møte om prosjektmuligheter",
        businessId: norskTeknologi.id,
        contactId: contacts[0].id,
        userId: "u001", // Would typically use a real user ID
        completed: true,
        outcome: "Positiv respons, ønsker tilbud",
      },
      {
        type: ActivityType.call,
        date: new Date("2023-09-05"),
        description: "Oppfølgingssamtale",
        businessId: norskTeknologi.id,
        contactId: contacts[0].id,
        userId: "u001",
        completed: true,
        outcome: "Diskuterte spesifikke behov",
      },
    ],
  });

  console.log("Created activities for Norsk Teknologi AS");

  // Create an offer
  const offer = await prisma.offer.create({
    data: {
      title: "Programvareutvikling 2023",
      description: "Tilbud på utvikling av kundeportal",
      businessId: norskTeknologi.id,
      contactId: contacts[0].id,
      expiresAt: new Date("2023-10-10"),
      status: OfferStatus.sent,
      totalAmount: 450000,
      currency: "NOK",
      notes: "Tilbudet inkluderer 3 måneders support etter leveranse",
    },
  });

  // Create offer items
  await prisma.offerItem.createMany({
    data: [
      {
        description: "Frontend utvikling",
        quantity: 1,
        unitPrice: 250000,
        discount: 10,
        tax: 25,
        total: 225000,
        offerId: offer.id,
      },
      {
        description: "Backend utvikling",
        quantity: 1,
        unitPrice: 225000,
        tax: 25,
        total: 225000,
        offerId: offer.id,
      },
    ],
  });

  console.log("Created offer with items for Norsk Teknologi AS");

  // Create businesses at prospect stage with complete details
  const hansenKonsult = await prisma.business.create({
    data: {
      name: "Hansen Konsult AS",
      orgNumber: "923456789",
      address: "Konsulentveien 5",
      postalCode: "5008",
      city: "Bergen",
      country: "Norge",
      contactPerson: "Kari Hansen",
      email: "post@hansenkonsult.no",
      phone: "55334455",
      industry: "Konsulentvirksomhet",
      numberOfEmployees: 10,
      bilagCount: 8,
      status: BusinessStatus.active,
      stage: CustomerStage.qualified,
      potensiellVerdi: 350000,
    },
  });

  const johansenOgSonner = await prisma.business.create({
    data: {
      name: "Johansen og Sønner AS",
      orgNumber: "934567890",
      address: "Håndverksgata 12",
      postalCode: "7010",
      city: "Trondheim",
      country: "Norge",
      contactPerson: "Lars Johansen",
      email: "post@johansensønner.no",
      phone: "73557788",
      website: "https://www.johansensønner.no",
      industry: "Håndverk",
      numberOfEmployees: 15,
      bilagCount: 24,
      status: BusinessStatus.active,
      stage: CustomerStage.prospect,
      potensiellVerdi: 280000,
    },
  });

  console.log("Added qualified and prospect businesses");
  console.log("Database seeding completed");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
