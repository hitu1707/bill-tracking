import Bill from '../../models/Bill.js';
import User from '../../models/User.js';

class BillRepository {
  // Create bill linked to specific user
  async create(billData) {
    return await Bill.create(billData);
  }

  // Get ONLY bills belonging to this specific user
  async findAllByUserId(userId) {
    return await Bill.find({ userId }).sort({ createdAt: -1 });
  }

  // Find a specific bill belonging to this user
  async findByIdAndUserId(billId, userId) {
    return await Bill.findOne({ _id: billId, userId });
  }

  // Get expiring bills ONLY for this user
  async findExpiringSoonByUserId(userId) {
    return await Bill.find({
      userId,
      warrantyStatus: 'Expiring Soon'
    }).sort({ warrantyEndDate: 1 });
  }

  // Get expired bills ONLY for this user
  async findExpiredByUserId(userId) {
    return await Bill.find({
      userId,
      warrantyStatus: 'Expired'
    }).sort({ warrantyEndDate: -1 });
  }

  // Delete bill ONLY if it belongs to this user
  async deleteByIdAndUserId(billId, userId) {
    return await Bill.findOneAndDelete({ _id: billId, userId });
  }

  // Increment scan count for this user
  async incrementUserBillCount(userId) {
    await User.findByIdAndUpdate(userId, { $inc: { totalBillsScanned: 1 } });
  }
}

export default new BillRepository();