import CompanyStock from "../Models/CompanyStock.js";

/* =========================
   CREATE COMPANY STOCK
========================= */
export const createCompanyStock = async (req, res) => {
  try {
    const {
      productName,
      quantity,
      unitPrice,
      totalValue,
      supplier,
      stockDate,
      expiryDate,
      location,
      minStockLevel,
      maxStockLevel,
      category,
      description
    } = req.body;

    // Basic validation
    if (!productName || !quantity || !unitPrice || !supplier) {
      return res.status(400).json({
        message: "Product name, quantity, unit price, and supplier are required",
      });
    }

    // Calculate total value if not provided
    const calculatedTotalValue = totalValue || (quantity * unitPrice);

    const companyStock = await CompanyStock.create({
      productName,
      quantity,
      unitPrice,
      totalValue: calculatedTotalValue,
      supplier,
      stockDate: stockDate || new Date(),
      expiryDate,
      location,
      minStockLevel: minStockLevel || 10, // default minimum stock
      maxStockLevel: maxStockLevel || 100, // default maximum stock
      category,
      description
    });

    res.status(201).json({
      message: "Company stock created successfully",
      data: companyStock
    });
  } catch (error) {
    console.error("Error creating company stock:", error);
    res.status(500).json({
      message: "Error creating company stock",
      error: error.message,
    });
  }
};

/* =========================
   GET ALL COMPANY STOCKS (PAGINATION & FILTERING)
========================= */
export const getCompanyStocks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Filter parameters
    const { category, supplier, lowStock } = req.query;
    
    // Build where clause
    const whereClause = {};
    
    if (category) {
      whereClause.category = category;
    }
    
    if (supplier) {
      whereClause.supplier = supplier;
    }
    
    if (lowStock === 'true') {
      whereClause.quantity = {
        [Op.lte]: Sequelize.col('minStockLevel')
      };
    }

    const { count, rows } = await CompanyStock.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        itemsPerPage: limit,
      },
      filters: {
        category,
        supplier,
        lowStock
      }
    });
  } catch (error) {
    console.error("Error fetching company stocks:", error);
    res.status(500).json({
      message: "Error fetching company stocks",
      error: error.message,
    });
  }
};

/* =========================
   GET COMPANY STOCK BY ID
========================= */
export const getCompanyStockById = async (req, res) => {
  try {
    const companyStock = await CompanyStock.findByPk(req.params.id);

    if (!companyStock) {
      return res.status(404).json({
        message: "Company stock not found",
      });
    }

    res.json({
      success: true,
      data: companyStock
    });
  } catch (error) {
    console.error("Error fetching company stock:", error);
    res.status(500).json({
      message: "Error fetching company stock",
      error: error.message,
    });
  }
};

/* =========================
   UPDATE COMPANY STOCK
========================= */
export const updateCompanyStock = async (req, res) => {
  try {
    const companyStock = await CompanyStock.findByPk(req.params.id);

    if (!companyStock) {
      return res.status(404).json({
        message: "Company stock not found",
      });
    }

    // Recalculate total value if quantity or unitPrice is updated
    if (req.body.quantity || req.body.unitPrice) {
      const newQuantity = req.body.quantity || companyStock.quantity;
      const newUnitPrice = req.body.unitPrice || companyStock.unitPrice;
      req.body.totalValue = newQuantity * newUnitPrice;
    }

    await companyStock.update(req.body);

    res.json({
      message: "Company stock updated successfully",
      data: companyStock
    });
  } catch (error) {
    console.error("Error updating company stock:", error);
    res.status(500).json({
      message: "Error updating company stock",
      error: error.message,
    });
  }
};

/* =========================
   DELETE COMPANY STOCK
========================= */
export const deleteCompanyStock = async (req, res) => {
  try {
    const companyStock = await CompanyStock.findByPk(req.params.id);

    if (!companyStock) {
      return res.status(404).json({
        message: "Company stock not found",
      });
    }

    await companyStock.destroy();

    res.json({
      message: "Company stock deleted successfully",
      deletedId: req.params.id
    });
  } catch (error) {
    console.error("Error deleting company stock:", error);
    res.status(500).json({
      message: "Error deleting company stock",
      error: error.message,
    });
  }
};

/* =========================
   GET STOCK SUMMARY
========================= */
export const getStockSummary = async (req, res) => {
  try {
    const totalStocks = await CompanyStock.count();
    const totalValue = await CompanyStock.sum('totalValue');
    const totalItems = await CompanyStock.sum('quantity');
    
    // Get low stock items (quantity <= minStockLevel)
    const lowStockItems = await CompanyStock.findAll({
      where: {
        quantity: {
          [Op.lte]: Sequelize.col('minStockLevel')
        }
      }
    });

    // Get stocks by category
    const stocksByCategory = await CompanyStock.findAll({
      attributes: [
        'category',
        [Sequelize.fn('COUNT', 'id'), 'count'],
        [Sequelize.fn('SUM', 'totalValue'), 'totalValue'],
        [Sequelize.fn('SUM', 'quantity'), 'totalQuantity']
      ],
      group: ['category'],
      order: [[Sequelize.fn('SUM', 'totalValue'), 'DESC']]
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalStocks,
          totalValue: totalValue || 0,
          totalItems: totalItems || 0,
          averageValuePerItem: totalValue && totalItems ? totalValue / totalItems : 0
        },
        lowStockCount: lowStockItems.length,
        stocksByCategory,
        lowStockItems: lowStockItems.map(item => ({
          id: item.id,
          productName: item.productName,
          quantity: item.quantity,
          minStockLevel: item.minStockLevel,
          needToOrder: item.minStockLevel - item.quantity
        }))
      }
    });
  } catch (error) {
    console.error("Error getting stock summary:", error);
    res.status(500).json({
      message: "Error getting stock summary",
      error: error.message,
    });
  }
};

/* =========================
   UPDATE STOCK QUANTITY (ADD/REMOVE)
========================= */
export const updateStockQuantity = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, quantity } = req.body; // action: 'add' or 'remove'
    
    if (!['add', 'remove'].includes(action) || !quantity || quantity <= 0) {
      return res.status(400).json({
        message: "Valid action ('add' or 'remove') and positive quantity required"
      });
    }

    const companyStock = await CompanyStock.findByPk(id);

    if (!companyStock) {
      return res.status(404).json({
        message: "Company stock not found",
      });
    }

    let newQuantity;
    if (action === 'add') {
      newQuantity = companyStock.quantity + quantity;
    } else {
      if (companyStock.quantity < quantity) {
        return res.status(400).json({
          message: "Insufficient stock to remove",
          currentQuantity: companyStock.quantity,
          requestedRemove: quantity
        });
      }
      newQuantity = companyStock.quantity - quantity;
    }

    await companyStock.update({
      quantity: newQuantity,
      totalValue: newQuantity * companyStock.unitPrice
    });

    res.json({
      message: `Stock ${action === 'add' ? 'added' : 'removed'} successfully`,
      data: {
        id: companyStock.id,
        productName: companyStock.productName,
        oldQuantity: companyStock.quantity,
        newQuantity: newQuantity,
        change: action === 'add' ? `+${quantity}` : `-${quantity}`
      }
    });
  } catch (error) {
    console.error("Error updating stock quantity:", error);
    res.status(500).json({
      message: "Error updating stock quantity",
      error: error.message,
    });
  }
};