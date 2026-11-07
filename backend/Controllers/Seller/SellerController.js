import Seller from "../../Models/Seller/Seller.js"; // adjust path as needed

// Get all sellers (with pagination optional)
export const getAllSellers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { count, rows } = await Seller.findAndCountAll({
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    res.json({
      data: rows,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    console.error("Error fetching sellers:", error);
    res.status(500).json({ message: "Failed to fetch sellers", error: error.message });
  }
};

// Get only active sellers
export const getActiveSellers = async (req, res) =>   {
  try {
    const sellers = await Seller.findAll({
      where: { isActive: true },
      order: [["fullname", "ASC"]],
    });
    res.json({ data: sellers });
  } catch (error) {
    console.error("Error fetching active sellers:", error);
    res.status(500).json({ message: "Failed to fetch active sellers", error: error.message });
  }
};

// Get single seller by ID
export const getSellerById = async (req, res) => {
  try {
    const { id } = req.params;
    const seller = await Seller.findByPk(id);
    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }
    res.json(seller);
  } catch (error) {
    console.error("Error fetching seller:", error);
    res.status(500).json({ message: "Failed to fetch seller", error: error.message });
  }
};

// Create a new seller
export const createSeller = async (req, res) => {
  try {
    const { fullname, phoneNumber, isActive = true } = req.body;
    if (!fullname) {
      return res.status(400).json({ message: "Fullname is required" });
    }

    const newSeller = await Seller.create({
      fullname,
      phoneNumber,
      isActive,
    });
    res.status(201).json({ message: "Seller created successfully", data: newSeller });
  } catch (error) {
    console.error("Error creating seller:", error);
    res.status(500).json({ message: "Failed to create seller", error: error.message });
  }
};

// Update a seller
export const updateSeller = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullname, phoneNumber, isActive } = req.body;

    const seller = await Seller.findByPk(id);
    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    await seller.update({
      fullname: fullname !== undefined ? fullname : seller.fullname,
      phoneNumber: phoneNumber !== undefined ? phoneNumber : seller.phoneNumber,
      isActive: isActive !== undefined ? isActive : seller.isActive,
    });

    res.json({ message: "Seller updated successfully", data: seller });
  } catch (error) {
    console.error("Error updating seller:", error);
    res.status(500).json({ message: "Failed to update seller", error: error.message });
  }
};

// Soft delete (deactivate) a seller – set isActive false
export const deactivateSeller = async (req, res) => {
  try {
    const { id } = req.params;
    const seller = await Seller.findByPk(id);
    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    await seller.update({ isActive: false });
    res.json({ message: "Seller deactivated successfully", data: seller });
  } catch (error) {
    console.error("Error deactivating seller:", error);
    res.status(500).json({ message: "Failed to deactivate seller", error: error.message });
  }
};

// Hard delete a seller (use with caution)
export const deleteSeller = async (req, res) => {
  try {
    const { id } = req.params;
    const seller = await Seller.findByPk(id);
    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    await seller.destroy();
    res.json({ message: "Seller permanently deleted" });
  } catch (error) {
    console.error("Error deleting seller:", error);
    res.status(500).json({ message: "Failed to delete seller", error: error.message });
  }
};