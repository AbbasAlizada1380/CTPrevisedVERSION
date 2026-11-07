import Remain from "../Models/Remain.js";
import Customer from "../Models/Customers.js";
import sequelize from "../dbconnection.js";
import OrderItem from "../Models/OrderItems.js";

export const getRemainOrderItemsByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    
    // دریافت پارامترهای pagination از query
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    if (!customerId) {
      return res.status(400).json({
        message: "customerId is required",
      });
    }

    // 1️⃣ find remain by customerId
    const remain = await Remain.findOne({
      where: { customerId },
      include: [{ model: Customer, as: "customer" }],
    });

    if (!remain) {
      return res.status(404).json({
        message: "No remain record found for this customer",
      });
    }

    const orderIds = remain.orderId || [];

    if (orderIds.length === 0) {
      return res.json({
        customer: remain.customer,
        orderItems: [],
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalItems: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
        message: "No remaining order items",
      });
    }

    // 2️⃣ fetch order items by IDs با pagination
    const { count, rows: orderItems } = await OrderItem.findAndCountAll({
      where: {
        id: orderIds,
      },
      order: [["id", "DESC"]],
      limit: limit,
      offset: offset,
    });

    const totalPages = Math.ceil(count / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    res.json({
      customer: remain.customer,
      orderCount: count,
      orderItems,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: count,
        itemsPerPage: limit,
        hasNextPage: hasNextPage,
        hasPreviousPage: hasPreviousPage,
        nextPage: hasNextPage ? page + 1 : null,
        previousPage: hasPreviousPage ? page - 1 : null,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching remaining order items",
      error: error.message,
    });
  }
};


/**
 * CREATE remain manually
 * POST /remain
 */
export const createRemain = async (req, res) => {
  try {
    const { customerId, orderId = [] } = req.body;

    if (!customerId) {
      return res.status(400).json({ message: "customerId is required" });
    }

    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const remain = await Remain.create({
      customerId,
      orderId,
    });

    res.status(201).json(remain);
  } catch (error) {
    res.status(500).json({
      message: "Error creating remain",
      error: error.message,
    });
  }
};

/**
 * GET all remains
 * GET /remain
 */
export const getRemains = async (req, res) => {
  try {
    const remains = await Remain.findAll({
      include: [{ model: Customer, as: "customer" }],
      order: [["id", "DESC"]],
    });

    res.json(remains);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching remains",
      error: error.message,
    });
  }
};

/**
 * GET remain by id
 * GET /remain/:id
 */
export const getRemainById = async (req, res) => {
  try {
    const remain = await Remain.findByPk(req.params.id, {
      include: [{ model: Customer, as: "customer" }],
    });

    if (!remain) {
      return res.status(404).json({ message: "Remain not found" });
    }

    res.json(remain);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching remain",
      error: error.message,
    });
  }
};

/**
 * UPDATE remain (replace)
 * PUT /remain/:id
 */
export const updateRemain = async (req, res) => {
  try {
    const remain = await Remain.findByPk(req.params.id);

    if (!remain) {
      return res.status(404).json({ message: "Remain not found" });
    }

    const { orderId } = req.body;

    if (orderId !== undefined) {
      remain.orderId = orderId;
    }

    await remain.save();

    res.json(remain);
  } catch (error) {
    res.status(500).json({
      message: "Error updating remain",
      error: error.message,
    });
  }
};

/**
 * ADD orderIds to remain
 * PATCH /remain/:id/add-orders
 */
export const addOrderIdsToRemain = async (req, res) => {
  try {
    const { orderIds } = req.body;

    if (!orderIds) {
      return res.status(400).json({ message: "orderIds is required" });
    }

    const remain = await Remain.findByPk(req.params.id);

    if (!remain) {
      return res.status(404).json({ message: "Remain not found" });
    }

    remain.addOrderIds(orderIds);
    await remain.save();

    res.json(remain);
  } catch (error) {
    res.status(500).json({
      message: "Error adding order IDs",
      error: error.message,
    });
  }
};

/**
 * REMOVE orderIds from remain
 * PATCH /remain/:id/remove-orders
 */
export const removeOrderIdsFromRemain = async (req, res) => {
  try {
    const { orderIds } = req.body;

    if (!orderIds) {
      return res.status(400).json({ message: "orderIds is required" });
    }

    const remain = await Remain.findByPk(req.params.id);

    if (!remain) {
      return res.status(404).json({ message: "Remain not found" });
    }

    remain.removeOrderIds(orderIds);
    await remain.save();

    res.json(remain);
  } catch (error) {
    res.status(500).json({
      message: "Error removing order IDs",
      error: error.message,
    });
  }
};

/**
 * DELETE remain
 * DELETE /remain/:id
 */
export const deleteRemain = async (req, res) => {
  try {
    const remain = await Remain.findByPk(req.params.id);

    if (!remain) {
      return res.status(404).json({ message: "Remain not found" });
    }

    await remain.destroy();

    res.json({ message: "Remain deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting remain",
      error: error.message,
    });
  }
};
    
/**
 * GET remaining money of all customers
 * GET /remain/money
 */
export const getRemainingMoneyOfAllCustomers = async (req, res) => {
  try {
    // 1️⃣ get all remain records with customer
    const remains = await Remain.findAll({
      include: [{ model: Customer, as: "customer" }],
      order: [["id", "DESC"]],
    });

    if (!remains.length) {
      return res.json({
        customers: [],
        grandTotalRemaining: 0,
      });
    }

    const results = [];
    let grandTotalRemaining = 0;

    // 2️⃣ loop through each remain record
    for (const remain of remains) {
      const orderIds = remain.orderId || [];

      if (!orderIds.length) continue;

      // 3️⃣ fetch related order items
      const orderItems = await OrderItem.findAll({
        where: { id: orderIds },
        attributes: ["money", "receipt"],
      });

      let totalMoney = 0;
      let totalReceipt = 0;

      orderItems.forEach((item) => {
        totalMoney += Number(item.money || 0);
        totalReceipt += Number(item.receipt || 0);
      });

      const remainingMoney = totalMoney - totalReceipt;

      if (remainingMoney > 0) {
        results.push({
          customer: remain.customer,
          orderCount: orderItems.length,
          totalMoney,
          totalReceipt,
          remainingMoney,
        });

        grandTotalRemaining += remainingMoney;
      }
    }

    res.json({
      customers: results,
      customerCount: results.length,
      grandTotalRemaining,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error calculating remaining money for all customers",
      error: error.message,
    });
  }
};
