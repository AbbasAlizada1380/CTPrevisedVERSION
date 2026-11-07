import Owner from "../Models/owners.js";

export const createOwner = async (req, res) => {
  try {
    const { name, isActive } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Owner name is required" });
    }

    const owner = await Owner.create({
      name,
      isActive: isActive ?? true,
    });

    res.status(201).json({
      message: "Owner created successfully",
      owner,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating owner",
      error: error.message,
    });
  }
};
export const getOwners = async (req, res) => {
  try {
    const owners = await Owner.findAll({
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({ owners });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching owners",
      error: error.message,
    });
  }
};

export const updateOwner = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, isActive } = req.body;

    const owner = await Owner.findByPk(id);

    if (!owner) {
      return res.status(404).json({ message: "Owner not found" });
    }

    if (name !== undefined) owner.name = name;
    if (isActive !== undefined) owner.isActive = isActive;

    await owner.save();

    res.status(200).json({
      message: "Owner updated successfully",
      owner,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating owner",
      error: error.message,
    });
  }
};

export const activateOwner = async (req, res) => {
  try {
    const { id } = req.params;

    const owner = await Owner.findByPk(id);
    if (!owner) {
      return res.status(404).json({ message: "Owner not found" });
    }

    owner.isActive = true;
    await owner.save();

    res.status(200).json({
      message: "Owner activated",
      owner,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error activating owner",
      error: error.message,
    });
  }
};

export const deactivateOwner = async (req, res) => {
  try {
    const { id } = req.params;

    const owner = await Owner.findByPk(id);
    if (!owner) {
      return res.status(404).json({ message: "Owner not found" });
    }

    owner.isActive = false;
    await owner.save();

    res.status(200).json({
      message: "Owner deactivated",
      owner,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deactivating owner",
      error: error.message,
    });
  }
};
export const deleteOwner = async (req, res) => {
  try {
    const { id } = req.params;

    const owner = await Owner.findByPk(id);
    if (!owner) {
      return res.status(404).json({ message: "Owner not found" });
    }

    await owner.destroy();

    res.status(200).json({
      message: "Owner deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting owner",
      error: error.message,
    });
  }
};