import mongoose from 'mongoose';
import billService from './bill.service.js';
import { successResponse, errorResponse } from '../../utils/responseHandler.js';

class BillController {
  // POST /api/bills/scan
  async scanBill(req, res, next) {
    try {
      if (!req.file) {
        return errorResponse(res, 400, 'Please upload a bill image');
      }

      const userId = req.user._id; // 👈 Logged-in User ID
      const tempFilePath = req.file.path;

      const savedBill = await billService.scanAndSaveBill(tempFilePath, userId);
      return successResponse(res, 201, 'Bill scanned and saved successfully', savedBill);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/bills (Only bills of logged-in user)
  async getAllBills(req, res, next) {
    try {
      const userId = req.user._id;
      const bills = await billService.getAllBills(userId);
      return successResponse(res, 200, 'Bills retrieved successfully', bills);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/bills/expiring-soon
  async getExpiringBills(req, res, next) {
    try {
      const userId = req.user._id;
      const expiringBills = await billService.getExpiringBills(userId);
      return successResponse(res, 200, 'Expiring bills retrieved successfully', expiringBills);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/bills/:id
  async getBillById(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user._id;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return errorResponse(res, 404, 'Bill not found');
      }

      const bill = await billService.getBillById(id, userId);
      return successResponse(res, 200, 'Bill retrieved successfully', bill);
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/bills/:id
  async deleteBill(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user._id;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return errorResponse(res, 404, 'Bill not found');
      }

      await billService.deleteBill(id, userId);
      return successResponse(res, 200, 'Bill deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

export default new BillController();