

const BillCard = ({ bill, onDelete }) => {
  const getBadgeClass = (status) => {
    switch (status) {
      case 'Active':
        return 'badge badge-active';
      case 'Expiring Soon':
        return 'badge badge-expiring';
      case 'Expired':
        return 'badge badge-expired';
      default:
        return 'badge badge-unknown';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bill-card">
      {bill.billImageUrl ? (
        <img
          src={bill.billImageUrl}
          alt={bill.productName}
          className="bill-card-img"
        />
      ) : (
        <div className="bill-card-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
          📄 No Image
        </div>
      )}

      <div className="bill-card-body">
        <div className="bill-card-header">
          <h3 className="bill-product-name">{bill.productName}</h3>
          <span className={getBadgeClass(bill.warrantyStatus)}>
            {bill.warrantyStatus}
          </span>
        </div>

        {bill.vendorName && (
          <div className="bill-info-row">
            <span>Store:</span>
            <strong>{bill.vendorName}</strong>
          </div>
        )}

        <div className="bill-info-row">
          <span>Purchased:</span>
          <span>{formatDate(bill.purchaseDate)}</span>
        </div>

        {bill.warrantyEndDate && (
          <div className="bill-info-row">
            <span>Warranty Ends:</span>
            <span>{formatDate(bill.warrantyEndDate)}</span>
          </div>
        )}

        {bill.daysUntilWarrantyEnds !== null && bill.daysUntilWarrantyEnds !== undefined && (
          <div className="bill-info-row">
            <span>Days Remaining:</span>
            <strong style={{ color: bill.daysUntilWarrantyEnds < 30 ? '#dc2626' : '#16a34a' }}>
              {bill.daysUntilWarrantyEnds > 0 ? `${bill.daysUntilWarrantyEnds} days` : 'Expired'}
            </strong>
          </div>
        )}

        {bill.expiryDate && (
          <div className="bill-info-row">
            <span>Expiry Date:</span>
            <span>{formatDate(bill.expiryDate)}</span>
          </div>
        )}

        <div className="bill-card-footer">
          <div className="bill-price">
            {bill.totalPrice || bill.price ? `₹${(bill.totalPrice || bill.price).toLocaleString()}` : 'N/A'}
          </div>
          <button
            onClick={() => onDelete(bill._id)}
            className="btn-icon-delete"
            title="Delete Bill"
          >
            🗑️ Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default BillCard;