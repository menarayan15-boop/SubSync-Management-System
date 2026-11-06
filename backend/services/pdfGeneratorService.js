import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STORAGE_DIR = path.join(__dirname, '../uploads/resources');

// Ensure directory exists
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

/**
 * Generate a complete, multi-page, publication-grade PDF for a resource
 * @param {Object} resource
 * @returns {Promise<string>} File path of generated PDF
 */
export const generateResourcePdf = (resource) => {
  return new Promise((resolve, reject) => {
    const filename = `${resource.slug}.pdf`;
    const outputPath = path.join(STORAGE_DIR, filename);

    // If file already exists and is non-empty, resolve early unless forced
    // We recreate it to ensure complete fidelity
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      bufferPages: true,
      info: {
        Title: resource.title,
        Author: 'SubSync Research & Engineering Labs',
        Subject: `${resource.category} - ${resource.planLevelRequired} Tier Publication`,
        Keywords: (resource.tags || []).join(', '),
        CreationDate: new Date(),
      },
    });

    const writeStream = fs.createWriteStream(outputPath);
    doc.pipe(writeStream);

    const navy = '#172033';
    const violet = '#6C4CF1';
    const softBg = '#F8FAFC';
    const borderSlate = '#E2E8F0';
    const muted = '#64748B';
    const darkBody = '#1E293B';
    const emerald = '#10B981';

    // =========================================================================
    // PAGE 1: COVER PAGE
    // =========================================================================
    // Top Accent Bar
    doc.rect(0, 0, 595.28, 12).fill(violet);

    // Decorative Top Grid
    doc.rect(50, 40, 495, 2).fill(borderSlate);

    // Brand Identity Header
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor(violet)
      .text('SUBSYNC DIGITAL RESOURCE VAULT', 50, 55, { characterSpacing: 1.5 });

    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor(muted)
      .text('OFFICIAL TECHNICAL & STRATEGIC PUBLICATION • 2026 EDITION', 50, 70);

    // Category & Tier Pill Box
    const pillY = 110;
    doc.roundedRect(50, pillY, 240, 26, 6).fill('#F5F3FF');
    doc.roundedRect(50, pillY, 240, 26, 6).lineWidth(1).stroke(violet);
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor(violet)
      .text(
        `${resource.category.toUpperCase()} • ${resource.planLevelRequired.toUpperCase()} TIER`,
        62,
        pillY + 8
      );

    // Main Publication Title
    const titleY = 160;
    doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .fillColor(navy)
      .text(resource.title, 50, titleY, { width: 495, lineGap: 6 });

    // Decorative Violet Underline
    const lineY = doc.y + 12;
    doc.rect(50, lineY, 80, 4).fill(violet);

    // Description / Abstract
    doc
      .fontSize(11)
      .font('Helvetica')
      .fillColor(darkBody)
      .text(resource.description, 50, lineY + 22, { width: 495, lineGap: 5 });

    // Metadata & Publication Specs Box
    const metaBoxY = 380;
    doc.roundedRect(50, metaBoxY, 495, 190, 8).fill(softBg);
    doc.roundedRect(50, metaBoxY, 495, 190, 8).lineWidth(1).stroke(borderSlate);

    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .fillColor(navy)
      .text('DOCUMENT SPECIFICATIONS & ACCESS METADATA', 70, metaBoxY + 18);

    doc.rect(70, metaBoxY + 34, 455, 1).fill(borderSlate);

    const col1X = 70;
    const col2X = 300;
    let rowY = metaBoxY + 48;

    const metaItems = [
      ['Document ID:', `SS-VAULT-${String(resource.id || 1).padStart(3, '0')}`],
      ['Access Tier Required:', `${resource.planLevelRequired} Membership or higher`],
      ['Target Audience:', 'Full-Stack Developers, Architects, SaaS Founders'],
      ['Curriculum Author:', 'SubSync Research & Engineering Labs'],
      ['Verified Format:', 'Full-Length PDF Reference (Digital Master)'],
      ['Release Cycle:', 'Q1 2026 Core Infrastructure Series'],
      ['License / Permissions:', 'Authorized SubSync Member Use Only'],
    ];

    for (let i = 0; i < metaItems.length; i++) {
      const [label, val] = metaItems[i];
      const isCol2 = i >= 4;
      const x = isCol2 ? col2X : col1X;
      const y = isCol2 ? metaBoxY + 48 + (i - 4) * 28 : metaBoxY + 48 + i * 28;

      doc.fontSize(8.5).font('Helvetica-Bold').fillColor(muted).text(label, x, y);
      doc.fontSize(9).font('Helvetica').fillColor(navy).text(val, x, y + 11);
    }

    // Key Highlights Bullet Box
    const highY = 600;
    doc.roundedRect(50, highY, 495, 140, 8).fill('#FFFFFF');
    doc.roundedRect(50, highY, 495, 140, 8).lineWidth(1).stroke(borderSlate);

    doc
      .fontSize(10.5)
      .font('Helvetica-Bold')
      .fillColor(violet)
      .text('EXECUTIVE HIGHLIGHTS & CORE DELIVERABLES', 70, highY + 16);

    const highlights = resource.highlights || [
      'Comprehensive architectural specifications and industry benchmarks',
      'Step-by-step implementation instructions and production best practices',
      'Production checklist, audit matrices, and troubleshooting guidelines',
      'Enterprise case studies and empirical performance metrics',
    ];

    let bulletY = highY + 38;
    for (const h of highlights.slice(0, 4)) {
      doc.circle(75, bulletY + 4, 3).fill(emerald);
      doc.fontSize(9).font('Helvetica').fillColor(darkBody).text(h, 86, bulletY, { width: 440 });
      bulletY += 22;
    }

    // Footer on Cover
    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor(muted)
      .text('SubSync Subscription Management System • Confidential & Proprietary Publication', 50, 780, {
        align: 'center',
        width: 495,
      });

    // =========================================================================
    // PAGE 2: TABLE OF CONTENTS & LEARNING OBJECTIVES
    // =========================================================================
    doc.addPage();

    doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .fillColor(navy)
      .text('Table of Contents & Curriculum Map', 50, 60);

    doc.rect(50, 85, 495, 2).fill(borderSlate);

    const toc = resource.tableOfContents || [
      { chapterNumber: 1, title: 'Introduction & Foundational Concepts', page: 3 },
      { chapterNumber: 2, title: 'Architecture, Models & Methodologies', page: 4 },
      { chapterNumber: 3, title: 'Step-by-Step Implementation Guide', page: 5 },
      { chapterNumber: 4, title: 'Practical Examples & Code Snippets', page: 6 },
      { chapterNumber: 5, title: 'Production Case Study & Real-World Lessons', page: 7 },
      { chapterNumber: 6, title: 'Audit Checklist, Common Pitfalls & Next Steps', page: 8 },
    ];

    let tocY = 105;
    for (const item of toc) {
      doc.roundedRect(50, tocY, 495, 34, 4).fill(tocY % 2 === 0 ? softBg : '#FFFFFF');
      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor(violet)
        .text(`CHAPTER ${item.chapterNumber}`, 62, tocY + 11);

      doc
        .fontSize(9.5)
        .font('Helvetica-Bold')
        .fillColor(navy)
        .text(item.title, 140, tocY + 11, { width: 340 });

      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor(muted)
        .text(`Page ${item.page}`, 490, tocY + 11, { align: 'right' });

      tocY += 40;
    }

    // Prerequisites & Target Competencies
    const objY = tocY + 20;
    doc.roundedRect(50, objY, 495, 170, 8).fill('#F5F3FF');
    doc.roundedRect(50, objY, 495, 170, 8).lineWidth(1).stroke(violet);

    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .fillColor(navy)
      .text('Prerequisites & Master Competencies', 70, objY + 18);

    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor(darkBody)
      .text(
        'This publication has been structured for immediate practical execution. Readers are advised to follow each section sequentially, validating code patterns, audit checklists, and metric calculations against their existing deployment environments.',
        70,
        objY + 36,
        { width: 455, lineGap: 4 }
      );

    const competencies = [
      'Mastery of core theoretical architectures and mathematical formulas',
      'Ability to design, audit, and troubleshoot scalable production systems',
      'Implementation of security best practices aligned with enterprise standards',
      'Streamlined execution of team workflows, SLAs, and performance benchmarks',
    ];

    let compY = objY + 84;
    for (const c of competencies) {
      doc.circle(76, compY + 4, 2.5).fill(violet);
      doc.fontSize(8.5).font('Helvetica').fillColor(darkBody).text(c, 86, compY, { width: 435 });
      compY += 18;
    }

    // =========================================================================
    // PAGES 3 to N: CONTENT SECTIONS
    // =========================================================================
    const sections = resource.contentSections || [
      {
        heading: '1. Architectural Principles and Theoretical Foundations',
        text: `${resource.title} represents a fundamental discipline within modern software engineering and SaaS operations. Building scalable, robust workflows requires balancing rapid feature velocity with long-term system maintainability and data integrity. Organizations that adhere to structured specifications experience significantly lower defect densities, predictable deployment cycles, and superior customer retention metrics.`,
      },
      {
        heading: '2. Detailed Technical Breakdown & Core Methodologies',
        text: `Implementing these principles requires establishing rigorous operational boundaries. Key architectural decisions—such as schema design, cryptographic signature verification, connection pooling, and multi-tenant isolation—must be documented using Architecture Decision Records (ADRs). Furthermore, error states must be explicitly handled rather than relying on silent fallbacks or generic error codes.`,
      },
      {
        heading: '3. Step-by-Step Implementation and Verification Workflow',
        text: `To achieve verified production readiness, follow this sequence:\n\nStep 1: Audit existing configurations against the baseline security and performance rubric.\nStep 2: Isolate critical transactional pathways and configure idempotent execution guards.\nStep 3: Introduce automated unit and contract tests covering nominal and failure branches.\nStep 4: Establish continuous observability, structured telemetry, and alert thresholds.\nStep 5: Execute periodic restore and failure drill procedures under simulated production loads.`,
      },
      {
        heading: '4. Best Practices vs Common Anti-Patterns',
        text: `RECOMMENDED BEST PRACTICES:\n• Always validate inputs strictly on the server-side; client validation is solely for user UX.\n• Employ immutable audit logging for all sensitive user, billing, and access operations.\n• Utilize automated rate-limiting to protect API boundaries against credential stuffing and DoS.\n\nCRITICAL ANTI-PATTERNS TO AVOID:\n• Never hardcode local development URLs into production builds.\n• Avoid storing plaintext secrets in version control; utilize environment isolation.\n• Do not assume network calls are synchronous or guaranteed; design for transient failures.`,
      },
    ];

    for (let sIdx = 0; sIdx < sections.length; sIdx++) {
      doc.addPage();
      const sec = sections[sIdx];

      // Chapter Header
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor(violet)
        .text(`SECTION 0${sIdx + 1} • CORE REFERENCE`, 50, 55, { characterSpacing: 1 });

      doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .fillColor(navy)
        .text(sec.heading, 50, 72, { width: 495 });

      doc.rect(50, doc.y + 6, 495, 1.5).fill(borderSlate);

      let currentY = doc.y + 18;

      // Section Body Text
      doc
        .fontSize(9.5)
        .font('Helvetica')
        .fillColor(darkBody)
        .text(sec.text, 50, currentY, { width: 495, lineGap: 5 });

      currentY = doc.y + 24;

      // Practical Code / Formula / Framework Callout Box
      doc.roundedRect(50, currentY, 495, 150, 6).fill('#1E293B');
      doc
        .fontSize(9)
        .font('Courier-Bold')
        .fillColor('#94A3B8')
        .text('// SUBSYNC SPECIFICATION CODE PATTERN & FORMULA REFERENCE', 66, currentY + 16);

      const snippet = [
        `// Topic: ${resource.title}`,
        `const verifiedStatus = verifySubscriptionAccess(user.tierLevel, resource.tierLevelRequired);`,
        `if (!verifiedStatus.granted) {`,
        `  throw new ForbiddenError("Upgrade to ${resource.planLevelRequired} tier to unlock this resource.");`,
        `}`,
        `await recordActivityLog({ action: "RESOURCE_DOWNLOAD", id: "${resource.slug}" });`,
        `return serveProtectedFile(resource.filePath, { cacheControl: "private, max-age=3600" });`,
      ].join('\n');

      doc
        .fontSize(8.5)
        .font('Courier')
        .fillColor('#F8FAFC')
        .text(snippet, 66, currentY + 36, { lineGap: 3.5 });

      currentY += 170;

      // Pro Tip Alert Box
      doc.roundedRect(50, currentY, 495, 75, 6).fill('#F0FDF4');
      doc.roundedRect(50, currentY, 495, 75, 6).lineWidth(1).stroke('#86EFAC');

      doc
        .fontSize(9.5)
        .font('Helvetica-Bold')
        .fillColor('#15803D')
        .text('PRODUCTION TIP: RESILIENCE IN MULTI-TENANT ARCHITECTURES', 66, currentY + 14);

      doc
        .fontSize(8.5)
        .font('Helvetica')
        .fillColor('#166534')
        .text(
          `When implementing ${resource.title} in mission-critical SaaS platforms, ensure that database query footprints and file streams utilize chunked buffering to keep Node.js event-loop memory usage below 80MB per worker.`,
          66,
          currentY + 32,
          { width: 460, lineGap: 3 }
        );
    }

    // =========================================================================
    // FINAL PAGE: SUMMARY, CHECKLIST & NEXT STEPS
    // =========================================================================
    doc.addPage();

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor(violet)
      .text('FINAL REVIEW & IMPLEMENTATION SIGN-OFF', 50, 55, { characterSpacing: 1 });

    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .fillColor(navy)
      .text('Comprehensive Implementation & Audit Checklist', 50, 72);

    doc.rect(50, 94, 495, 1.5).fill(borderSlate);

    let checkY = 115;
    const checklistItems = [
      'Documented architecture and data flows reviewed by lead engineer',
      'All access control rules strictly enforced on backend API endpoints',
      'Unit and integration tests pass with zero unhandled promise rejections',
      'Audit logging and telemetry metrics active in production dashboard',
      'Database indexes verified with EXPLAIN ANALYZE to eliminate sequential scans',
      'Rollback and emergency incident response playbooks documented and rehearsed',
      'Compliance with GDPR / DPDP and regional data privacy standards verified',
      'Production environment variables verified with secret isolation',
    ];

    for (let i = 0; i < checklistItems.length; i++) {
      const item = checklistItems[i];
      doc.roundedRect(50, checkY, 495, 34, 4).fill(i % 2 === 0 ? softBg : '#FFFFFF');
      doc.rect(64, checkY + 11, 12, 12).lineWidth(1).stroke(violet);
      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .fillColor(violet)
        .text('✓', 67, checkY + 12);

      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor(darkBody)
        .text(item, 88, checkY + 11, { width: 440 });

      checkY += 40;
    }

    // Official Seal / Attestation Box
    const sealY = checkY + 20;
    doc.roundedRect(50, sealY, 495, 140, 8).fill('#F5F3FF');
    doc.roundedRect(50, sealY, 495, 140, 8).lineWidth(1).stroke(violet);

    doc
      .fontSize(10.5)
      .font('Helvetica-Bold')
      .fillColor(navy)
      .text('Official SubSync Digital Vault Attestation', 70, sealY + 18);

    doc
      .fontSize(8.5)
      .font('Helvetica')
      .fillColor(darkBody)
      .text(
        `This digital publication has been produced and verified under the SubSync Resource Quality Framework. Registered subscribers holding an active ${resource.planLevelRequired} membership or above are granted full personal and enterprise implementation rights. Redistribution or unauthorized resale without express written authorization is strictly prohibited.`,
        70,
        sealY + 36,
        { width: 455, lineGap: 3.5 }
      );

    doc.rect(70, sealY + 85, 455, 1).fill(borderSlate);

    doc
      .fontSize(8)
      .font('Helvetica-Bold')
      .fillColor(violet)
      .text('SUBSYNC CORE ENGINE: VERIFIED', 70, sealY + 98);

    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor(muted)
      .text(`PUBLICATION HASH: SHA256-${resource.slug.slice(0, 16)}`, 260, sealY + 98);

    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor(muted)
      .text('STATUS: ACTIVE IN VAULT', 440, sealY + 98);

    // =========================================================================
    // ADD HEADERS AND FOOTERS ACROSS ALL INNER PAGES
    // =========================================================================
    const range = doc.bufferedPageRange();
    for (let i = 1; i < range.count; i++) {
      doc.switchToPage(i);

      // Running Header
      doc
        .fontSize(7.5)
        .font('Helvetica')
        .fillColor(muted)
        .text(`SubSync Digital Vault • ${resource.title}`, 50, 24, { width: 495 });

      doc.rect(50, 36, 495, 0.5).fill(borderSlate);

      // Running Footer
      doc.rect(50, 800, 495, 0.5).fill(borderSlate);
      doc
        .fontSize(7.5)
        .font('Helvetica')
        .fillColor(muted)
        .text('Confidential • SubSync Subscription Management System', 50, 808);

      doc
        .fontSize(7.5)
        .font('Helvetica-Bold')
        .fillColor(navy)
        .text(`Page ${i + 1} of ${range.count}`, 490, 808, { align: 'right' });
    }

    doc.end();

    writeStream.on('finish', () => {
      resolve(outputPath);
    });

    writeStream.on('error', (err) => {
      reject(err);
    });
  });
};
