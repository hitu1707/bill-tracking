import billRepository from './bill.repository.js';
import { extractBillData } from '../../utils/aiExtractor.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../../utils/imageProcessor.js';
import logger from '../../config/logger.js';

// ─── HELPER SANITIZERS ───
const sanitizeString = (val) => {
  if (val === undefined || val === null) return null;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (['null', 'none', 'n/a', 'na', 'nil', 'undefined', ''].includes(trimmed.toLowerCase())) {
      return null;
    }
    return trimmed;
  }
  return String(val);
};

const sanitizeDate = (val) => {
  const clean = sanitizeString(val);
  if (!clean) return null;
  const parsed = new Date(clean);
  return isNaN(parsed.getTime()) ? null : parsed;
};

const sanitizeNumber = (val, defaultVal = null) => {
  const clean = sanitizeString(val);
  if (clean === null) return defaultVal;
  if (typeof clean === 'number') return isNaN(clean) ? defaultVal : clean;
  // Remove currency symbols, commas, and extra text (e.g., "₹ 1,299.50" -> 1299.50)
  const numericStr = String(clean).replace(/[^0-9.-]+/g, '');
  const parsed = parseFloat(numericStr);
  return isNaN(parsed) ? defaultVal : parsed;
};

class BillService {
  // Main scan and save workflow
  async scanAndSaveBill(tempImagePath, userId) {
    try {
      logger.info(`Bill scan initiated for user: ${userId}`);

      // 1. Extract data using AI on the local file
      const rawExtractedData = await extractBillData(tempImagePath);

      // 2. Upload image to Cloudinary (or local fallback)
      const cloudinaryData = await uploadToCloudinary(tempImagePath);

      // 3. Clean, sanitize and calculate tracking fields
      const sanitizedData = this.sanitizeAndEnrichData(rawExtractedData);

      // 4. Attach user ID and image references
      const finalBillData = {
        ...sanitizedData,
        userId,
        billImageUrl: cloudinaryData.imageUrl,
        cloudinaryPublicId: cloudinaryData.publicId
      };

      // 5. Save to database
      const savedBill = await billRepository.create(finalBillData);

      // 6. Increment user's scan counter
      await billRepository.incrementUserBillCount(userId);

      logger.info(`Bill saved successfully: "${savedBill.productName}" (ID: ${savedBill._id})`);
      return savedBill;
    } catch (error) {
      logger.error(`Bill processing workflow failed: ${error.message}`);
      throw error;
    }
  }

  // Sanitize all AI fields and compute warranty/expiry tracking
  sanitizeAndEnrichData(raw) {
    const today = new Date();

    // 1. Sanitize Basic Information
    const productName = sanitizeString(raw.productName) || 'Scanned Product';
    const productModel = sanitizeString(raw.productModel);
    const category = sanitizeString(raw.category);
    const quantity = sanitizeNumber(raw.quantity, 1);

    // 2. Sanitize Monetary Fields
    const price = sanitizeNumber(raw.price);
    const tax = sanitizeNumber(raw.tax);
    const totalPrice = sanitizeNumber(raw.totalPrice) || price;

    // 3. Sanitize Vendor & Invoice Details
    const vendorName = sanitizeString(raw.vendorName);
    const vendorAddress = sanitizeString(raw.vendorAddress);
    const vendorPhone = sanitizeString(raw.vendorPhone);
    const billNumber = sanitizeString(raw.billNumber);
    const paymentMethod = sanitizeString(raw.paymentMethod);
    const warrantyPeriod = sanitizeString(raw.warrantyPeriod);

    // 4. Sanitize Dates
    const purchaseDate = sanitizeDate(raw.purchaseDate);
    const manufacturingDate = sanitizeDate(raw.manufacturingDate);
    const expiryDate = sanitizeDate(raw.expiryDate);
    let warrantyEndDate = sanitizeDate(raw.warrantyEndDate);

    // Auto-calculate warranty end date if missing but purchaseDate + warrantyPeriod exist
    if (!warrantyEndDate && purchaseDate && warrantyPeriod) {
      warrantyEndDate = this.computeEndDate(purchaseDate, warrantyPeriod);
    }

    // 5. Compute Warranty Tracking & Status
    let daysUntilWarrantyEnds = null;
    let warrantyStatus = 'Unknown';
    let reminderDate = null;

    if (warrantyEndDate) {
      const diffTime = warrantyEndDate.getTime() - today.getTime();
      daysUntilWarrantyEnds = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (daysUntilWarrantyEnds < 0) {
        warrantyStatus = 'Expired';
      } else if (daysUntilWarrantyEnds <= 30) {
        warrantyStatus = 'Expiring Soon';
      } else {
        warrantyStatus = 'Active';
      }

      // Reminder set to 30 days prior to warranty expiration
      reminderDate = new Date(warrantyEndDate);
      reminderDate.setDate(reminderDate.getDate() - 30);
    }

    // 6. Compute Expiry Tracking
    let daysUntilExpiry = null;
    if (expiryDate) {
      const diffTime = expiryDate.getTime() - today.getTime();
      daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    return {
      productName,
      productModel,
      category,
      quantity,
      price,
      tax,
      totalPrice,
      vendorName,
      vendorAddress,
      vendorPhone,
      billNumber,
      paymentMethod,
      warrantyPeriod,
      purchaseDate,
      manufacturingDate,
      expiryDate,
      warrantyEndDate,
      daysUntilWarrantyEnds,
      warrantyStatus,
      reminderDate,
      daysUntilExpiry
    };
  }

  // Calculate future date from warranty text
  computeEndDate(purchaseDate, warrantyPeriodStr) {
    const date = new Date(purchaseDate);
    const text = warrantyPeriodStr.toLowerCase();

    const yearMatch = text.match(/(\d+)\s*(year|yr)/);
    const monthMatch = text.match(/(\d+)\s*(month|mo)/);

    if (yearMatch) {
      date.setFullYear(date.getFullYear() + parseInt(yearMatch[1], 10));
    } else if (monthMatch) {
      date.setMonth(date.getMonth() + parseInt(monthMatch[1], 10));
    } else {
      return null;
    }

    return isNaN(date.getTime()) ? null : date;
  }

  async getAllBills(userId) {
    return await billRepository.findAllByUserId(userId);
  }

  async getBillById(billId, userId) {
    const bill = await billRepository.findByIdAndUserId(billId, userId);
    if (!bill) {
      const error = new Error('Bill not found');
      error.statusCode = 404;
      throw error;
    }
    return bill;
  }

  async getExpiringBills(userId) {
    return await billRepository.findExpiringSoonByUserId(userId);
  }

  async deleteBill(billId, userId) {
    const bill = await billRepository.deleteByIdAndUserId(billId, userId);
    if (!bill) {
      const error = new Error('Bill not found');
      error.statusCode = 404;
      throw error;
    }

    if (bill.cloudinaryPublicId) {
      await deleteFromCloudinary(bill.cloudinaryPublicId);
    }

    return bill;
  }
}

export default new BillService();