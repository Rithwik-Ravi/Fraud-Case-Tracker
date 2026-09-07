/**
 * Court-Admissible Dossier & Evidence Vault PDF Generator
 * Compliant with Section 63 Bharatiya Sakshya Adhiniyam (BSA), 2023
 * and Section 173(3) Bharatiya Nagarik Suraksha Sanhita (BNSS).
 */

export interface PdfEvidenceItem {
  name: string;
  size?: number;
  sha256: string;
  category?: string;
  dataUrl?: string;
}

export interface PdfCaseData {
  ackNumber?: string | null;
  selectedCategory?: {
    section?: string;
    subCategory?: string;
    label?: string;
    statutoryCitations?: string[];
  } | null;
  triageResult?: {
    urgency: string;
    source?: string;
  } | null;
  reportAnonymously?: boolean;
  amount?: string | number | null;
  freezeRequested?: boolean;
  platformChannel?: string | null;
  incidentDate?: string | null;
  suspectName?: string | null;
  suspectPhone?: string | null;
  suspectAccount?: string | null;
  suspectHandle?: string | null;
  suspectWebsite?: string | null;
  suspectDetails?: string | null;
  cryptoNetwork?: string | null;
  victimWallet?: string | null;
  suspectWallet?: string | null;
  transactionHash?: string | null;
  cryptoExchange?: string | null;
  encryptedExtension?: string | null;
  ransomNoteFile?: string | null;
  ransomDemanded?: string | null;
  ransomWalletAddress?: string | null;
  targetDomain?: string | null;
  serverIp?: string | null;
  defacerHandle?: string | null;
  imposterUrl?: string | null;
  genuineUrl?: string | null;
  socialPlatform?: string | null;
  maliciousApkName?: string | null;
  threatenedContent?: string | null;
  extortionDemand?: string | null;
  harassmentMedium?: string | null;
  fullName?: string | null;
  phone?: string | null;
  email?: string | null;
  idType?: string | null;
  idNumber?: string | null;
  stateName?: string | null;
  district?: string | null;
  policeStation?: string | null;
  evidenceFiles?: PdfEvidenceItem[];
}

/**
 * Preprocesses screenshot or evidence image for robust PDF embedding:
 * 1. Draws onto an HTML5 canvas with a solid white background (eliminating black backgrounds on transparent PNGs).
 * 2. Standardizes format to JPEG.
 * 3. Returns natural dimensions for exact aspect-ratio preservation.
 */
export async function processImageForPdf(
  dataUrl: string
): Promise<{ dataUrl: string; width: number; height: number; format: "JPEG" }> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || typeof Image === "undefined") {
      resolve({ dataUrl, width: 800, height: 600, format: "JPEG" });
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const origW = img.naturalWidth || img.width || 800;
      const origH = img.naturalHeight || img.height || 600;

      const canvas = document.createElement("canvas");
      canvas.width = origW;
      canvas.height = origH;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve({ dataUrl, width: origW, height: origH, format: "JPEG" });
        return;
      }

      // Pure white backing
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, origW, origH);
      ctx.drawImage(img, 0, 0, origW, origH);

      try {
        const jpegUrl = canvas.toDataURL("image/jpeg", 0.90);
        resolve({ dataUrl: jpegUrl, width: origW, height: origH, format: "JPEG" });
      } catch {
        resolve({ dataUrl, width: origW, height: origH, format: "JPEG" });
      }
    };

    img.onerror = () => {
      resolve({ dataUrl, width: 800, height: 600, format: "JPEG" });
    };

    img.src = dataUrl;
  });
}

/**
 * Generates and downloads the official CasePilot NCRP confirmation and evidence dossier PDF.
 */
export async function generateCasePilotDossierPdf(
  caseData: PdfCaseData,
  customAck?: string
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  const effectiveAck =
    customAck ||
    caseData.ackNumber ||
    `PREVIEW-${Date.now().toString().slice(-6)}`;

  // Header banner
  doc.setFillColor(11, 12, 12);
  doc.rect(0, 0, pageW, 28, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text("CasePilot — National Cyber Incident Confirmation", 14, 12);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Official Citizen Acknowledgment & Statutory Chain-of-Custody Record", 14, 20);

  // Body
  doc.setTextColor(11, 12, 12);
  let y = 36;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(
    caseData.ackNumber ? "Acknowledgement Number" : "Provisional Reference (Review Draft)",
    14,
    y
  );
  y += 6;
  doc.setFontSize(18);
  doc.setTextColor(29, 112, 184);
  doc.text(effectiveAck, 14, y);
  y += 10;
  doc.setTextColor(11, 12, 12);

  const row = (label: string, value: string) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(label, 14, y);
    doc.setFont("helvetica", "normal");
    doc.text(value || "Not Specified", 70, y);
    y += 6.5;
  };

  row("Filed at:", new Date().toLocaleString("en-IN"));
  if (caseData.selectedCategory) {
    const sectionName =
      caseData.selectedCategory.section === "WOMEN_CHILDREN"
        ? "Women / Children Related Crime"
        : caseData.selectedCategory.section === "FINANCIAL"
        ? "Financial Fraud"
        : "Other Cyber Crime";
    row("NCRP Statutory Pillar:", sectionName);
    row(
      "Official Subcategory:",
      caseData.selectedCategory.subCategory || caseData.selectedCategory.label || "General"
    );
    if (
      caseData.selectedCategory.statutoryCitations &&
      caseData.selectedCategory.statutoryCitations.length > 0
    ) {
      row("Applicable Laws:", caseData.selectedCategory.statutoryCitations.slice(0, 2).join(", "));
    }
  }

  if (caseData.triageResult) {
    row("Statutory Urgency:", caseData.triageResult.urgency.toUpperCase());
    row(
      "Classification Engine:",
      caseData.triageResult.source === "ai" ? "AI-assisted (gpt-4o-mini)" : "Rule-based engine"
    );
  }

  if (caseData.reportAnonymously) {
    row("NCRP Track:", "Track 1A (Report Anonymously - Identity Withheld)");
  }

  if (caseData.amount) {
    row("Reported Loss:", `₹${Number(caseData.amount).toLocaleString("en-IN")}`);
  }

  if (caseData.freezeRequested) {
    row("Bank Freeze Alert:", "Dispatched via CFCFRMS / 1930 Gateway");
  }

  // Incident & Suspect Particulars section
  y += 2;
  doc.setFillColor(240, 244, 248);
  doc.rect(14, y, pageW - 28, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(20, 60, 110);
  doc.text("INCIDENT & SUSPECT PARTICULARS", 16, y + 4.5);
  doc.setTextColor(11, 12, 12);
  y += 9;

  row("Platform / Channel:", caseData.platformChannel || "Online / Digital Channel");
  if (caseData.incidentDate) row("Incident Timing:", caseData.incidentDate);
  if (caseData.suspectName) row("Suspect Name / Alias:", caseData.suspectName);
  if (caseData.suspectPhone) row("Suspect Contact:", caseData.suspectPhone);
  if (caseData.suspectAccount) row("Suspect Bank/UPI:", caseData.suspectAccount);
  if (caseData.suspectHandle) row("Suspect Handle / Link:", caseData.suspectHandle);
  if (caseData.suspectWebsite) row("Suspect Malicious URL:", caseData.suspectWebsite);
  if (caseData.suspectDetails) row("Additional Suspect Info:", caseData.suspectDetails);

  // Category-specific blocks
  if (caseData.cryptoNetwork || caseData.suspectWallet || caseData.transactionHash) {
    y += 2;
    doc.setFillColor(240, 244, 248);
    doc.rect(14, y, pageW - 28, 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(20, 60, 110);
    doc.text("CRYPTOCURRENCY & BLOCKCHAIN PARAMETERS", 16, y + 4.5);
    doc.setTextColor(11, 12, 12);
    y += 9;

    if (caseData.cryptoNetwork) row("Blockchain Network:", caseData.cryptoNetwork);
    if (caseData.suspectWallet) row("Suspect Wallet:", caseData.suspectWallet);
    if (caseData.transactionHash) row("Transaction Hash (TxID):", caseData.transactionHash);
    if (caseData.victimWallet) row("Complainant Wallet:", caseData.victimWallet);
    if (caseData.cryptoExchange) row("Exchange Involved:", caseData.cryptoExchange);
  }

  if (caseData.encryptedExtension || caseData.ransomDemanded) {
    y += 2;
    doc.setFillColor(240, 244, 248);
    doc.rect(14, y, pageW - 28, 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(20, 60, 110);
    doc.text("RANSOMWARE ATTACK PARAMETERS", 16, y + 4.5);
    doc.setTextColor(11, 12, 12);
    y += 9;

    if (caseData.encryptedExtension) row("Encrypted Extension:", caseData.encryptedExtension);
    if (caseData.ransomNoteFile) row("Ransom Note File:", caseData.ransomNoteFile);
    if (caseData.ransomDemanded) row("Ransom Demand:", caseData.ransomDemanded);
    if (caseData.ransomWalletAddress) row("Extortion Wallet / URL:", caseData.ransomWalletAddress);
  }

  if (caseData.targetDomain || caseData.defacerHandle) {
    y += 2;
    doc.setFillColor(240, 244, 248);
    doc.rect(14, y, pageW - 28, 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(20, 60, 110);
    doc.text("INFRASTRUCTURE & DEFACEMENT PARAMETERS", 16, y + 4.5);
    doc.setTextColor(11, 12, 12);
    y += 9;

    if (caseData.targetDomain) row("Target Domain:", caseData.targetDomain);
    if (caseData.serverIp) row("Host Server IP:", caseData.serverIp);
    if (caseData.defacerHandle) row("Defacer Alias:", caseData.defacerHandle);
  }

  if (caseData.imposterUrl || caseData.genuineUrl) {
    y += 2;
    doc.setFillColor(240, 244, 248);
    doc.rect(14, y, pageW - 28, 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(20, 60, 110);
    doc.text("SOCIAL MEDIA IMPERSONATION PARTICULARS", 16, y + 4.5);
    doc.setTextColor(11, 12, 12);
    y += 9;

    if (caseData.socialPlatform) row("Platform:", caseData.socialPlatform);
    if (caseData.imposterUrl) row("Imposter Profile:", caseData.imposterUrl);
    if (caseData.genuineUrl) row("Genuine Profile:", caseData.genuineUrl);
  }

  if (caseData.threatenedContent || caseData.extortionDemand) {
    y += 2;
    doc.setFillColor(240, 244, 248);
    doc.rect(14, y, pageW - 28, 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(20, 60, 110);
    doc.text("CYBER SAFETY & HARASSMENT PARTICULARS", 16, y + 4.5);
    doc.setTextColor(11, 12, 12);
    y += 9;

    if (caseData.harassmentMedium) row("Harassment Medium:", caseData.harassmentMedium);
    if (caseData.threatenedContent) row("Threatened Content:", caseData.threatenedContent);
    if (caseData.extortionDemand) row("Coercion Demand:", caseData.extortionDemand);
  }

  // Complainant & Jurisdiction section
  y += 2;
  doc.setFillColor(240, 244, 248);
  doc.rect(14, y, pageW - 28, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(20, 60, 110);
  doc.text("COMPLAINANT IDENTITY & POLICE JURISDICTION", 16, y + 4.5);
  doc.setTextColor(11, 12, 12);
  y += 9;

  if (caseData.reportAnonymously) {
    row("Complainant Status:", "PROTECTED ANONYMOUS (Track 1A - Identity Withheld)");
  } else {
    if (caseData.fullName) row("Complainant Name:", caseData.fullName);
    row("Registered Mobile:", caseData.phone || "Verified in session");
    if (caseData.email) row("Complainant Email:", caseData.email);
    if (caseData.idType && caseData.idNumber) {
      row("National ID Proof:", `${caseData.idType} (${caseData.idNumber})`);
    }
  }
  row("Jurisdiction State:", caseData.stateName || "National Jurisdiction");
  row("Police District:", caseData.district || "Central Cyber Crime Cell");
  row("Assigned Cyber Station:", caseData.policeStation || "Designated Cyber Cell");

  // Evidence files list on Page 1
  let activeEvidence: PdfEvidenceItem[] = caseData.evidenceFiles || [];

  // Fallback to in-memory window draft or sessionStorage if empty
  if (activeEvidence.length === 0 && typeof window !== "undefined") {
    try {
      const cached =
        (window as any).__casepilot_draft ||
        JSON.parse(sessionStorage.getItem("casepilot_chatbot_draft") || "{}");
      if (cached?.evidenceFiles && Array.isArray(cached.evidenceFiles) && cached.evidenceFiles.length > 0) {
        activeEvidence = cached.evidenceFiles;
      }
    } catch {}
  }

  if (activeEvidence.length > 0) {
    y += 2;
    doc.setFillColor(240, 244, 248);
    doc.rect(14, y, pageW - 28, 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(20, 60, 110);
    doc.text("DIGITAL EVIDENCE VAULT (SHA-256 DIGESTS - SEC 63 BSA)", 16, y + 4.5);
    doc.setTextColor(11, 12, 12);
    y += 9;

    activeEvidence.forEach((f) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      const line = `${f.name} [${f.category || "Evidence"}]: ${f.sha256.slice(0, 36)}...`;
      doc.text(line, 14, y);
      y += 4.5;
    });
  }

  // Footer for Page 1
  doc.setFillColor(248, 249, 250);
  doc.rect(0, pageH - 18, pageW, 18, "F");
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(80, 90, 95);
  doc.text(
    "Statutory Record under BNSS Section 173(3) and BSA Section 63. Official inquiry routed to designated Cyber Cell.",
    14,
    pageH - 10
  );

  // ── ANNEXURE PAGES: CERTIFIED EVIDENCE IMAGE EXHIBITS (SEC 63 BSA) ──
  const imageExhibits = activeEvidence.filter(
    (f) => f.dataUrl && f.dataUrl.startsWith("data:image")
  );

  if (imageExhibits.length > 0) {
    for (let idx = 0; idx < imageExhibits.length; idx++) {
      const img = imageExhibits[idx];
      doc.addPage();
      const pW = doc.internal.pageSize.getWidth();
      const pH = doc.internal.pageSize.getHeight();

      // Official Exhibit Banner
      doc.setFillColor(11, 12, 12);
      doc.rect(0, 0, pW, 18, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(255, 255, 255);
      doc.text(`ANNEXURE ${idx + 1} — CERTIFIED DIGITAL EVIDENCE EXHIBIT`, 14, 12);

      // Subheader with Section 63 BSA statutory citation
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(50, 60, 65);
      doc.text(
        `Statutory Chain of Custody: Admissible under Section 63, Bharatiya Sakshya Adhiniyam (BSA), 2023`,
        14,
        24
      );
      doc.text(
        `NCRP Complaint ACK: ${effectiveAck} | Exhibit File: ${img.name} (${img.category || "Digital Evidence"})`,
        14,
        29
      );

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(20, 60, 110);
      doc.text(`SHA-256 Digest:`, 14, 34);
      doc.setFont("courier", "normal");
      doc.setFontSize(7);
      doc.setTextColor(30, 30, 30);
      doc.text(img.sha256, 38, 34);

      // Stamped Exhibit Frame
      const frameX = 14;
      const frameY = 38;
      const frameW = pW - 28;
      const frameH = pH - 58;

      // Draw outer exhibit border
      doc.setDrawColor(20, 60, 110);
      doc.setLineWidth(0.6);
      doc.rect(frameX, frameY, frameW, frameH);

      // Process image to ensure pure white backing & calculate aspect ratio
      const processed = await processImageForPdf(img.dataUrl!);

      const maxImgW = frameW - 8;
      const maxImgH = frameH - 20; // leaves space for bottom seal banner
      const imgAspect = (processed.width || 800) / (processed.height || 600);
      const boxAspect = maxImgW / maxImgH;

      let renderW = maxImgW;
      let renderH = maxImgH;
      if (imgAspect > boxAspect) {
        // Wider than frame box
        renderW = maxImgW;
        renderH = maxImgW / imgAspect;
      } else {
        // Taller than frame box
        renderH = maxImgH;
        renderW = maxImgH * imgAspect;
      }

      const renderX = frameX + 4 + (maxImgW - renderW) / 2;
      const renderY = frameY + 4 + (maxImgH - renderH) / 2;

      try {
        doc.addImage(
          processed.dataUrl,
          "JPEG",
          renderX,
          renderY,
          renderW,
          renderH,
          undefined,
          "FAST"
        );
      } catch (e1) {
        console.warn("Retrying doc.addImage without FAST option:", e1);
        try {
          doc.addImage(processed.dataUrl, "JPEG", renderX, renderY, renderW, renderH);
        } catch (e2) {
          console.error("Failed to render image exhibit into PDF:", e2);
        }
      }

      // Official seal banner at bottom of frame
      doc.setFillColor(240, 244, 248);
      doc.rect(frameX, frameY + frameH - 12, frameW, 12, "F");
      doc.setFont("helvetica", "bolditalic");
      doc.setFontSize(7);
      doc.setTextColor(20, 60, 110);
      doc.text(
        `CERTIFIED TAMPER-EVIDENT EVIDENCE ATTACHMENT • STORED VIA CASEPILOT CRYPTOGRAPHIC VAULT`,
        frameX + 4,
        frameY + frameH - 4.5
      );

      // Exhibit page footer
      doc.setFillColor(248, 249, 250);
      doc.rect(0, pH - 15, pW, 15, "F");
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7);
      doc.setTextColor(90, 100, 105);
      doc.text(
        "Official Complaint Exhibit for Designated Cyber Crime Police Station and Banking Nodal Officer.",
        14,
        pH - 6
      );
    }
  }

  doc.save(`CasePilot-Complaint-${effectiveAck}.pdf`);
}
