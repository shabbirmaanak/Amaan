import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import QRCode from "qrcode";

export type CardData = {
  firstName: string;
  shortCode: string;
  tagId: string;
  helpDeskNumber: string;
  baseUrl: string;
};

const MM_TO_PT = 2.8346;
function mm(value: number): number {
  return value * MM_TO_PT;
}

async function makeQrPng(tagId: string, baseUrl: string): Promise<Buffer> {
  const url = `${baseUrl.replace(/\/$/, "")}/t/${tagId}`;
  return QRCode.toBuffer(url, { type: "png", margin: 1, width: 400 });
}

async function drawCard(
  doc: PDFDocument,
  data: CardData,
  widthPt: number,
  heightPt: number,
  qrPng: Buffer
): Promise<void> {
  const page = doc.addPage([widthPt, heightPt]);
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const qrImage = await doc.embedPng(qrPng);

  page.drawRectangle({
    x: 2,
    y: 2,
    width: widthPt - 4,
    height: heightPt - 4,
    borderColor: rgb(0.2, 0.2, 0.2),
    borderWidth: 1,
  });

  const qrSize = Math.min(widthPt, heightPt) * 0.42;
  const qrX = widthPt - qrSize - mm(4);
  const qrY = heightPt / 2 - qrSize / 2;
  page.drawImage(qrImage, { x: qrX, y: qrY, width: qrSize, height: qrSize });

  const textX = mm(4);
  let textY = heightPt - mm(6);

  page.drawText(data.firstName, { x: textX, y: textY, size: 14, font, color: rgb(0, 0, 0) });
  textY -= mm(6);

  page.drawText(`Code: ${data.shortCode}`, {
    x: textX,
    y: textY,
    size: 11,
    font,
    color: rgb(0, 0, 0),
  });
  textY -= mm(7);

  const instruction = "If I am lost, take me to the nearest Khidmat desk";
  const maxTextWidth = qrX - textX - mm(2);
  wrapText(instruction, regular, 8, maxTextWidth).forEach((line) => {
    page.drawText(line, { x: textX, y: textY, size: 8, font: regular, color: rgb(0.1, 0.1, 0.1) });
    textY -= mm(4);
  });

  textY -= mm(1);
  page.drawText(`Help desk: ${data.helpDeskNumber}`, {
    x: textX,
    y: textY,
    size: 8,
    font,
    color: rgb(0.1, 0.1, 0.1),
  });
}

function wrapText(
  text: string,
  font: { widthOfTextAtSize(text: string, size: number): number },
  size: number,
  maxWidth: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** Generates a single PDF with both a wristband-sized and a wallet-card-sized tag. */
export async function generateTagCardPdf(data: CardData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const qrPng = await makeQrPng(data.tagId, data.baseUrl);

  // Wristband: long and narrow, printable on label tape.
  await drawCard(doc, data, mm(140), mm(25), qrPng);

  // Wallet card: standard credit-card size.
  await drawCard(doc, data, mm(85.6), mm(54), qrPng);

  return doc.save();
}
