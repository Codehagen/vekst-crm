import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { BusinessStatus, CustomerStage } from "@prisma/client";

// Define validation schema for incoming lead data
const leadSchema = z.object({
  name: z.string().min(1, "Navn er påkrevd"),
  email: z.string().email("Gyldig e-post er påkrevd"),
  phone: z.string().min(1, "Telefonnummer er påkrevd"),
  orgNumber: z.string().optional(),
  contactPerson: z.string().optional(),
  website: z.string().optional(),
  address: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  industry: z.string().optional(),
  notes: z.string().optional(),
  potensiellVerdi: z.number().optional(),
  sourceSystem: z.string().optional(), // Which system sent the lead
  externalId: z.string().optional(), // External system's ID for the lead
  // Add any API key or authentication fields as needed
  apiKey: z.string().optional(),
});

// Utility to log requests for debugging
const logRequest = (req: NextRequest, data: any) => {
  console.log(`[${new Date().toISOString()}] Lead API Request:`, {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries()),
    data: data,
  });
};

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const body = await req.json();
    logRequest(req, body);

    // Validate the incoming data
    const validationResult = leadSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation error",
          errors: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Here you could implement API key validation or other auth methods
    // if (data.apiKey !== process.env.EXTERNAL_API_KEY) {
    //   return NextResponse.json({ success: false, message: "Invalid API key" }, { status: 403 });
    // }

    // Check if a lead with this email already exists
    const existingLead = await prisma.business.findFirst({
      where: {
        email: data.email,
      },
    });

    let lead;

    // If the lead exists, update it
    if (existingLead) {
      lead = await prisma.business.update({
        where: {
          id: existingLead.id,
        },
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          orgNumber: data.orgNumber || existingLead.orgNumber,
          contactPerson: data.contactPerson || existingLead.contactPerson,
          website: data.website || existingLead.website,
          address: data.address || existingLead.address,
          postalCode: data.postalCode || existingLead.postalCode,
          city: data.city || existingLead.city,
          country: data.country || existingLead.country,
          industry: data.industry || existingLead.industry,
          notes: data.notes
            ? `${existingLead.notes ? existingLead.notes + "\n\n" : ""}${
                data.notes
              }`
            : existingLead.notes,
          potensiellVerdi: data.potensiellVerdi || existingLead.potensiellVerdi,
          // Don't change the stage if it's already been progressed
          // Only update if the existing lead is still in lead stage
          ...(existingLead.stage === CustomerStage.lead && {
            stage: CustomerStage.lead,
          }),
        },
      });

      return NextResponse.json({
        success: true,
        message: "Lead updated successfully",
        data: {
          id: lead.id,
          externalId: data.externalId,
          isNew: false,
        },
      });
    }
    // Create a new lead
    else {
      lead = await prisma.business.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          orgNumber: data.orgNumber,
          contactPerson: data.contactPerson,
          website: data.website,
          address: data.address,
          postalCode: data.postalCode,
          city: data.city,
          country: data.country,
          industry: data.industry,
          notes: data.notes,
          potensiellVerdi: data.potensiellVerdi,
          status: BusinessStatus.active,
          stage: CustomerStage.lead,
        },
      });

      // Log the source of this lead if provided
      if (data.sourceSystem) {
        await prisma.activity.create({
          data: {
            type: "note",
            date: new Date(),
            description: `Lead opprettet fra ${data.sourceSystem}`,
            businessId: lead.id,
            completed: true,
            userId: "system", // Use a system user ID
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: "Lead created successfully",
        data: {
          id: lead.id,
          externalId: data.externalId,
          isNew: true,
        },
      });
    }
  } catch (error) {
    console.error("Error processing lead API request:", error);

    return NextResponse.json(
      {
        success: false,
        message: "An error occurred processing the request",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Optionally add a GET handler to verify the API is working
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Lead API is running",
  });
}
