import Exist from "../../Models/Stock/exist.js";

// @desc    Create a new exist record
// @route   POST /api/exists
// @access  Public/Private (adjust as needed)
export const createExist = async (req, res) => {
  try {
    const { size, quantity } = req.body;

    // Validate required fields
    if (!size) {
      return res.status(400).json({
        success: false,
        message: "Size is required",
      });
    }

    // Check if size already exists
    const existingRecord = await Exist.findOne({ where: { size } });
    if (existingRecord) {
      return res.status(400).json({
        success: false,
        message: "Size already exists",
        data: existingRecord,
      });
    }

    const existRecord = await Exist.create({
      size,
      quantity: quantity || 0,
    });

    res.status(201).json({
      success: true,
      message: "Exist record created successfully",
      data: existRecord,
    });
  } catch (error) {
    console.error("Error creating exist record:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create exist record",
      error: error.message,
    });
  }
};

// @desc    Get all exist records
// @route   GET /api/exists
// @access  Public/Private
export const getAllExists = async (req, res) => {
  try {
    const exists = await Exist.findAll({
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      success: true,
      count: exists.length,
      data: exists,
    });
  } catch (error) {
    console.error("Error fetching exist records:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch exist records",
      error: error.message,
    });
  }
};

// @desc    Get single exist record by ID
// @route   GET /api/exists/:id
// @access  Public/Private
export const getExistById = async (req, res) => {
  try {
    const { id } = req.params;

    const existRecord = await Exist.findByPk(id);

    if (!existRecord) {
      return res.status(404).json({
        success: false,
        message: "Exist record not found",
      });
    }

    res.status(200).json({
      success: true,
      data: existRecord,
    });
  } catch (error) {
    console.error("Error fetching exist record:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch exist record",
      error: error.message,
    });
  }
};

// @desc    Get exist record by size
// @route   GET /api/exists/size/:size
// @access  Public/Private
export const getExistBySize = async (req, res) => {
  try {
    const { size } = req.params;

    const existRecord = await Exist.findOne({ where: { size } });

    if (!existRecord) {
      return res.status(404).json({
        success: false,
        message: "Exist record not found for this size",
      });
    }

    res.status(200).json({
      success: true,
      data: existRecord,
    });
  } catch (error) {
    console.error("Error fetching exist record by size:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch exist record",
      error: error.message,
    });
  }
};

// @desc    Update exist record
// @route   PUT /api/exists/:id
// @access  Public/Private
export const updateExist = async (req, res) => {
  try {
    const { id } = req.params;
    const { size, quantity } = req.body;

    const existRecord = await Exist.findByPk(id);

    if (!existRecord) {
      return res.status(404).json({
        success: false,
        message: "Exist record not found",
      });
    }

    // If size is being updated, check for duplicates
    if (size && size !== existRecord.size) {
      const existingSize = await Exist.findOne({ where: { size } });
      if (existingSize && existingSize.id !== parseInt(id)) {
        return res.status(400).json({
          success: false,
          message: "Size already exists",
        });
      }
    }

    // Update record
    const updatedData = {};
    if (size !== undefined) updatedData.size = size;
    if (quantity !== undefined) updatedData.quantity = quantity;

    await existRecord.update(updatedData);

    res.status(200).json({
      success: true,
      message: "Exist record updated successfully",
      data: existRecord,
    });
  } catch (error) {
    console.error("Error updating exist record:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update exist record",
      error: error.message,
    });
  }
};

// @desc    Update quantity (increment/decrement)
// @route   PATCH /api/exists/:id/quantity
// @access  Public/Private
export const updateQuantity = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, value } = req.body;

    const existRecord = await Exist.findByPk(id);

    if (!existRecord) {
      return res.status(404).json({
        success: false,
        message: "Exist record not found",
      });
    }

    let newQuantity = existRecord.quantity;

    switch (action) {
      case 'increment':
        newQuantity += parseInt(value) || 1;
        break;
      case 'decrement':
        newQuantity = Math.max(0, newQuantity - (parseInt(value) || 1));
        break;
      case 'set':
        newQuantity = parseInt(value) || 0;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: "Invalid action. Use 'increment', 'decrement', or 'set'",
        });
    }

    await existRecord.update({ quantity: newQuantity });

    res.status(200).json({
      success: true,
      message: "Quantity updated successfully",
      data: existRecord,
    });
  } catch (error) {
    console.error("Error updating quantity:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update quantity",
      error: error.message,
    });
  }
};

// @desc    Delete exist record
// @route   DELETE /api/exists/:id
// @access  Public/Private
export const deleteExist = async (req, res) => {
  try {
    const { id } = req.params;

    const existRecord = await Exist.findByPk(id);

    if (!existRecord) {
      return res.status(404).json({
        success: false,
        message: "Exist record not found",
      });
    }

    await existRecord.destroy();

    res.status(200).json({
      success: true,
      message: "Exist record deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting exist record:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete exist record",
      error: error.message,
    });
  }
};

// @desc    Bulk create exist records
// @route   POST /api/exists/bulk
// @access  Public/Private
export const bulkCreateExists = async (req, res) => {
  try {
    const { records } = req.body;

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Records array is required",
      });
    }

    const createdRecords = await Exist.bulkCreate(records, {
      validate: true,
      ignoreDuplicates: true,
    });

    res.status(201).json({
      success: true,
      message: `${createdRecords.length} exist records created successfully`,
      data: createdRecords,
    });
  } catch (error) {
    console.error("Error bulk creating exist records:", error);
    res.status(500).json({
      success: false,
      message: "Failed to bulk create exist records",
      error: error.message,
    });
  }
};

// @desc    Get exist records with pagination
// @route   GET /api/exists/paginated
// @access  Public/Private
export const getPaginatedExists = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await Exist.findAndCountAll({
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching paginated exist records:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch paginated exist records",
      error: error.message,
    });
  }
};