import * as XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const filePath = 'C:\\Users\\Novotion Server\\Downloads\\Draft Sheet.xlsx';

function formatLinkedInUrl(rawUrl: string): string {
  let url = (rawUrl || '').trim();
  if (!url) return '';
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  return url;
}

function formatPhoneNumber(rawPhone: any): string {
  if (!rawPhone) return '';
  return String(rawPhone).trim();
}

function parseExcelDate(val: any): Date {
  if (!val) return new Date();
  if (typeof val === 'number') {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    return new Date(excelEpoch.getTime() + val * 86400000);
  }
  if (typeof val === 'string') {
    const parts = val.trim().split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
  }
  return new Date();
}

async function importExcel() {
  console.log(`Reading Excel file from: ${filePath}`);
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets['Sheet1'];
  const rawRows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  console.log(`Processing ${rawRows.length} rows...`);

  let createdCount = 0;
  let updatedCount = 0;

  for (const [index, row] of rawRows.entries()) {
    const candidateName = String(row['Candidate Name'] || '').replace(/[\r\n]+/g, ' ').trim();
    if (!candidateName) {
      console.log(`Row #${index + 1}: Skipped (Empty candidate name)`);
      continue;
    }

    const phoneNumber = formatPhoneNumber(row['Contact number']);
    const email = String(row['Email address'] || '').trim().toLowerCase();
    const visaStatus = String(row['Visa status'] || '').trim();
    const linkedinUrl = formatLinkedInUrl(String(row['Linkedin URL'] || ''));
    const jobProfile = String(row['Job title'] || '').trim();
    const createdByName = String(row['Lead By'] || 'Prajakta Zode').trim();
    const comment = String(row['comment'] || '').trim();
    const linkedinName = String(row['Linkedin Name'] || '').trim();
    const chatBrief = comment || (linkedinName ? `Source: ${linkedinName}` : 'Excel Import');
    const isCold = false;
    const createdAt = parseExcelDate(row['Date']);
    const status = String(row['Status'] || '').trim() || 'No Response';

    // Check if lead with this email or phone number already exists
    const existingLead = await prisma.lead.findFirst({
      where: {
        OR: [
          ...(email ? [{ email: email }] : []),
          ...(phoneNumber ? [{ phoneNumber: phoneNumber }] : []),
        ],
      },
      include: { interactions: true },
    });

    if (existingLead) {
      console.log(`Row #${index + 1}: Updating existing lead "${candidateName}" (ID: ${existingLead.id})`);
      await prisma.lead.update({
        where: { id: existingLead.id },
        data: {
          candidateName,
          phoneNumber: phoneNumber || existingLead.phoneNumber,
          email: email || existingLead.email,
          visaStatus: visaStatus || existingLead.visaStatus,
          linkedinUrl: linkedinUrl || existingLead.linkedinUrl,
          jobProfile: jobProfile || existingLead.jobProfile,
          createdByName: createdByName || existingLead.createdByName,
          chatBrief: chatBrief || existingLead.chatBrief,
          isCold,
        },
      });
      updatedCount++;
    } else {
      console.log(`Row #${index + 1}: Creating new lead "${candidateName}" (${email})`);
      const newLead = await prisma.lead.create({
        data: {
          candidateName,
          phoneNumber,
          email: email || `lead_${Date.now()}_${index}@novotion.local`,
          visaStatus,
          linkedinUrl,
          jobProfile,
          createdByName,
          chatBrief,
          isCold,
          createdAt,
        },
      });

      // Add initial sales interaction
      await prisma.salesInteraction.create({
        data: {
          leadId: newLead.id,
          salesRepName: 'System',
          status: status,
          candidateFeedback: `Imported from Excel - Lead by ${createdByName}`,
          updatedAt: createdAt,
        },
      });
      createdCount++;
    }
  }

  console.log(`\nImport Summary:`);
  console.log(`- Created: ${createdCount}`);
  console.log(`- Updated: ${updatedCount}`);
  console.log(`- Total processed: ${createdCount + updatedCount}`);
}

importExcel()
  .catch((err) => {
    console.error('Import failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
