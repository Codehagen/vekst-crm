import {
  PrismaClient,
  BusinessStatus,
  CustomerStage,
  ActivityType,
  OfferStatus,
  JobApplicationStatus,
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
  await prisma.jobApplication.deleteMany();

  console.log("Deleted existing data");

  // Create businesses at lead stage (previously leads)
  const leads = await Promise.all([
    prisma.business.create({
      data: {
        name: "Ola Nordmann AS",
        email: "ola@example.no",
        phone: "99887766",
        contactPerson: "Ola Nordmann",
        stage: CustomerStage.lead,
        status: BusinessStatus.active,
        potensiellVerdi: 75000,
        orgNumber: "987654321",
        address: "Storgata 1",
        postalCode: "0182",
        city: "Oslo",
        country: "Norge",
        website: "https://www.olanordmann.no",
        industry: "Konsulent",
        numberOfEmployees: 5,
        revenue: 2500000,
        notes: "Interessert i regnskapstjenester",
      },
    }),
    prisma.business.create({
      data: {
        name: "Hansen Konsult AS",
        email: "kari@hansenkonsult.no",
        phone: "45678901",
        contactPerson: "Kari Hansen",
        stage: CustomerStage.lead,
        status: BusinessStatus.active,
        potensiellVerdi: 120000,
        orgNumber: "876543210",
        address: "Parkveien 15",
        postalCode: "0350",
        city: "Oslo",
        country: "Norge",
        website: "https://www.hansenkonsult.no",
        industry: "IT Rådgivning",
        numberOfEmployees: 12,
        revenue: 8500000,
        notes: "Trenger hjelp med regnskapsrapportering",
      },
    }),
    prisma.business.create({
      data: {
        name: "Johansen og Sønner AS",
        email: "lars@johansensønner.no",
        phone: "91234567",
        contactPerson: "Lars Johansen",
        stage: CustomerStage.lead,
        status: BusinessStatus.active,
        potensiellVerdi: 250000,
        orgNumber: "765432109",
        address: "Industrivegen 8",
        postalCode: "5258",
        city: "Bergen",
        country: "Norge",
        website: "https://www.johansenson.no",
        industry: "Bygg og Anlegg",
        numberOfEmployees: 45,
        revenue: 35000000,
        notes: "Potensielt stort prosjekt for nytt regnskapssystem",
      },
    }),
    prisma.business.create({
      data: {
        name: "Olsen Digital AS",
        email: "ingrid@olsendigital.no",
        phone: "92345678",
        contactPerson: "Ingrid Olsen",
        stage: CustomerStage.prospect,
        status: BusinessStatus.active,
        potensiellVerdi: 180000,
        orgNumber: "654321098",
        address: "Teknologiveien 22",
        postalCode: "7030",
        city: "Trondheim",
        country: "Norge",
        website: "https://www.olsendigital.no",
        industry: "Digital Markedsføring",
        numberOfEmployees: 18,
        revenue: 12000000,
        notes: "I dialog om potensielle regnskapstjenester",
      },
    }),
    prisma.business.create({
      data: {
        name: "Konsulent Berg AS",
        email: "erik@konsulentberg.no",
        phone: "93456789",
        contactPerson: "Erik Berg",
        stage: CustomerStage.lead,
        status: BusinessStatus.active,
        potensiellVerdi: 50000,
        orgNumber: "543210987",
        address: "Konsulentvegen 5",
        postalCode: "4021",
        city: "Stavanger",
        country: "Norge",
        website: "https://www.konsulentberg.no",
        industry: "Bedriftsrådgivning",
        numberOfEmployees: 3,
        revenue: 3500000,
        notes: "Kan være interessert i regnskapssystemer for små bedrifter",
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

  // Create job applications
  const jobApplications = await Promise.all([
    prisma.jobApplication.create({
      data: {
        firstName: "Marte",
        lastName: "Larsen",
        email: "marte.larsen@gmail.com",
        phone: "41234567",
        address: "Solveien 12",
        postalCode: "0283",
        city: "Oslo",
        country: "Norge",
        resume: "uploads/resumes/marte_larsen_cv.pdf",
        coverLetter:
          "Jeg har 8 års erfaring som regnskapsfører og ønsker å jobbe i et dynamisk team.",
        experience: 8,
        education: "Bachelor i Økonomi og Administrasjon, Handelshøyskolen BI",
        skills: ["Regnskap", "Skatt", "Visma", "Excel", "PowerBI"],
        desiredPosition: "Senior Regnskapsfører",
        currentEmployer: "Regnskapssentralen AS",
        expectedSalary: 650000,
        source: "LinkedIn",
        status: JobApplicationStatus.new,
        notes: "Solid kandidat med erfaring fra lignende bransje",
      },
    }),
    prisma.jobApplication.create({
      data: {
        firstName: "Jonas",
        lastName: "Berg",
        email: "jonas.berg@outlook.com",
        phone: "47890123",
        address: "Bjørkevegen 5",
        postalCode: "5003",
        city: "Bergen",
        country: "Norge",
        resume: "uploads/resumes/jonas_berg_cv.pdf",
        coverLetter:
          "Nyutdannet regnskapsfører som søker min første fulltidsstilling.",
        experience: 1,
        education: "Bachelor i Regnskap og Revisjon, NHH",
        skills: ["Regnskap", "SAP", "Excel", "PowerPoint"],
        desiredPosition: "Junior Regnskapsfører",
        currentEmployer: "Deltid hos Regnskap & Co",
        expectedSalary: 480000,
        source: "Finn.no",
        status: JobApplicationStatus.reviewing,
        notes: "Lovende kandidat med relevant utdanning",
      },
    }),
    prisma.jobApplication.create({
      data: {
        firstName: "Sofie",
        lastName: "Hansen",
        email: "sofie.hansen@yahoo.com",
        phone: "45678901",
        address: "Osloveien 45",
        postalCode: "7018",
        city: "Trondheim",
        country: "Norge",
        resume: "uploads/resumes/sofie_hansen_cv.pdf",
        coverLetter:
          "Jeg har 12 års erfaring som autorisert regnskapsfører og leder for en regnskapsavdeling.",
        experience: 12,
        education: "Master i Regnskap, NTNU",
        skills: [
          "Autorisert Regnskapsfører",
          "Xledger",
          "Tripletex",
          "Excel",
          "PowerBI",
          "Teamledelse",
        ],
        desiredPosition: "Regnskapsleder",
        currentEmployer: "Økonomipartner AS",
        expectedSalary: 750000,
        startDate: new Date("2023-09-01"),
        source: "Bedriftens nettside",
        status: JobApplicationStatus.interviewed,
        notes:
          "Erfaren kandidat, gjennomført førstegangsintervju med gode resultater",
      },
    }),
    prisma.jobApplication.create({
      data: {
        firstName: "Erik",
        lastName: "Olsen",
        email: "erik.olsen@gmail.com",
        phone: "92345678",
        address: "Industrigaten 12",
        postalCode: "0353",
        city: "Oslo",
        country: "Norge",
        resume: "uploads/resumes/erik_olsen_cv.pdf",
        coverLetter:
          "Ønsker å bruke min IT-bakgrunn kombinert med regnskapsforståelse i en ny rolle.",
        experience: 5,
        education: "Bachelor i Informasjonsteknologi, UiO",
        skills: ["Systemutvikling", "Regnskap", "SQL", "Python", "Excel"],
        desiredPosition: "Regnskapssystemutvikler",
        currentEmployer: "TechConsult AS",
        expectedSalary: 680000,
        source: "Rekrutteringsbyrå",
        status: JobApplicationStatus.offer_extended,
        notes: "Tilbud sendt, venter på svar",
      },
    }),
    prisma.jobApplication.create({
      data: {
        firstName: "Ida",
        lastName: "Johansen",
        email: "ida.johansen@hotmail.com",
        phone: "99887766",
        address: "Bjørnsonsvei 8",
        postalCode: "1337",
        city: "Sandvika",
        country: "Norge",
        resume: "uploads/resumes/ida_johansen_cv.pdf",
        coverLetter:
          "Jeg søker nye utfordringer etter 7 år i revisjonsbransjen.",
        experience: 7,
        education: "Master i Revisjon og Regnskap, BI",
        skills: ["Revisjon", "Regnskap", "IFRS", "Forretningsanalyse", "Excel"],
        desiredPosition: "Senior Regnskapskonsulent",
        currentEmployer: "BDO",
        expectedSalary: 700000,
        source: "LinkedIn",
        status: JobApplicationStatus.rejected,
        notes: "Ikke riktig match for stillingen på nåværende tidspunkt",
      },
    }),
  ]);

  console.log(`Created ${jobApplications.length} job applications`);

  // Create activities for job applications
  const jobApplicationActivities = await Promise.all([
    prisma.activity.create({
      data: {
        type: ActivityType.note,
        date: new Date(),
        description: "Vurdering av CV og søknadsbrev",
        completed: true,
        outcome: "Kandidaten har relevant erfaring og kompetanse",
        jobApplicationId: jobApplications[0].id,
        userId: "system",
      },
    }),
    prisma.activity.create({
      data: {
        type: ActivityType.call,
        date: new Date(),
        description: "Innledende telefonintervju",
        completed: true,
        outcome: "Positiv samtale, går videre til personlig intervju",
        jobApplicationId: jobApplications[2].id,
        userId: "system",
      },
    }),
    prisma.activity.create({
      data: {
        type: ActivityType.meeting,
        date: new Date(),
        description: "Førstegangsintervju",
        completed: true,
        outcome:
          "Kandidaten gjorde et godt inntrykk. Planlegger andregangsintervju.",
        jobApplicationId: jobApplications[2].id,
        userId: "system",
      },
    }),
    prisma.activity.create({
      data: {
        type: ActivityType.email,
        date: new Date(),
        description: "Sendt tilbud",
        completed: true,
        outcome: "Tilbud sendt med frist for tilbakemelding innen en uke",
        jobApplicationId: jobApplications[3].id,
        userId: "system",
      },
    }),
  ]);

  console.log(
    `Created ${jobApplicationActivities.length} job application activities`
  );

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
