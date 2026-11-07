// orderStatsController.js
// import { Order } from "../Models/OrderItems.js";
import { Op } from "sequelize";

export const getOrderStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build where condition for Sequelize
    const whereCondition = {};

    if (startDate && endDate) {
      whereCondition.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    } else if (startDate) {
      whereCondition.createdAt = {
        [Op.gte]: new Date(startDate),
      };
    } else if (endDate) {
      whereCondition.createdAt = {
        [Op.lte]: new Date(endDate),
      };
    }

    // Get all orders based on filter
    const orders = await Order.findAll({
      where: whereCondition,
      attributes: ["id", "total", "isDelivered", "createdAt"],
    });

    // Calculate statistics manually
    const statistics = {
      totalRemainedMoney: 0,
      deliveredOrdersCount: 0,
      notDeliveredOrdersCount: 0,
      totalReceivedMoney: 0,
      totalPendingMoney: 0,
      totalOrdersCount: orders.length,
      timeRange: {
        startDate: startDate || null,
        endDate: endDate || null,
        hasTimeRange: !!(startDate || endDate),
      },
    };

    orders.forEach((order) => {
      const total = parseFloat(order.total) || 0;
      statistics.totalRemainedMoney += total;

      if (order.isDelivered) {
        statistics.deliveredOrdersCount++;
        statistics.totalReceivedMoney += total;
      } else {
        statistics.notDeliveredOrdersCount++;
        statistics.totalPendingMoney += total;
      }
    });

    res.status(200).json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    console.error("Error in getOrderStatistics:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching order statistics",
      error: error.message,
    });
  }
};

// Alternative version using Sequelize aggregate functions (more efficient)
export const getOrderStatisticsSequelize = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const { fn, col, where, literal } = Order.sequelize.Sequelize;

    // Build where condition
    const whereCondition = {};
    if (startDate && endDate) {
      whereCondition.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    } else if (startDate) {
      whereCondition.createdAt = {
        [Op.gte]: new Date(startDate),
      };
    } else if (endDate) {
      whereCondition.createdAt = {
        [Op.lte]: new Date(endDate),
      };
    }

    // Get statistics using Sequelize aggregation
    const stats = await Order.findAll({
      where: whereCondition,
      attributes: [
        [fn("SUM", col("total")), "totalRemainedMoney"],
        [fn("COUNT", col("id")), "totalOrdersCount"],
        [
          literal(`SUM(CASE WHEN isDelivered = true THEN 1 ELSE 0 END)`),
          "deliveredOrdersCount",
        ],
        [
          literal(`SUM(CASE WHEN isDelivered = false THEN 1 ELSE 0 END)`),
          "notDeliveredOrdersCount",
        ],
        [
          literal(
            `SUM(CASE WHEN isDelivered = true THEN total ELSE 0 END)`
          ),
          "totalReceivedMoney",
        ],
        [
          literal(
            `SUM(CASE WHEN isDelivered = false THEN total ELSE 0 END)`
          ),
          "totalPendingMoney",
        ],
      ],
      raw: true,
    });

    const result = stats[0] || {
      totalRemainedMoney: 0,
      totalOrdersCount: 0,
      deliveredOrdersCount: 0,
      notDeliveredOrdersCount: 0,
      totalReceivedMoney: 0,
      totalPendingMoney: 0,
    };

    res.status(200).json({
      success: true,
      data: {
        totalRemainedMoney: parseFloat(result.totalRemainedMoney) || 0,
        deliveredOrdersCount: parseInt(result.deliveredOrdersCount) || 0,
        notDeliveredOrdersCount: parseInt(result.notDeliveredOrdersCount) || 0,
        totalReceivedMoney: parseFloat(result.totalReceivedMoney) || 0,
        totalPendingMoney: parseFloat(result.totalPendingMoney) || 0,
        totalOrdersCount: parseInt(result.totalOrdersCount) || 0,
        timeRange: {
          startDate: startDate || null,
          endDate: endDate || null,
          hasTimeRange: !!(startDate || endDate),
        },
      },
    });
  } catch (error) {
    console.error("Error in getOrderStatisticsSequelize:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching order statistics",
      error: error.message,
    });
  }
};

// Get detailed breakdown with additional metrics
export const getDetailedOrderStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const { fn, col, literal } = Order.sequelize.Sequelize;

    // Build where condition
    const whereCondition = {};
    if (startDate && endDate) {
      whereCondition.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    // Get overall statistics
    const overallStats = await Order.findAll({
      where: whereCondition,
      attributes: [
        [fn("SUM", col("total")), "totalRemainedMoney"],
        [fn("COUNT", col("id")), "totalOrdersCount"],
        [fn("AVG", col("total")), "averageOrderValue"],
        [
          literal(`SUM(CASE WHEN isDelivered = true THEN 1 ELSE 0 END)`),
          "deliveredOrdersCount",
        ],
        [
          literal(`SUM(CASE WHEN isDelivered = false THEN 1 ELSE 0 END)`),
          "notDeliveredOrdersCount",
        ],
        [
          literal(
            `SUM(CASE WHEN isDelivered = true THEN total ELSE 0 END)`
          ),
          "totalReceivedMoney",
        ],
        [
          literal(
            `SUM(CASE WHEN isDelivered = false THEN total ELSE 0 END)`
          ),
          "totalPendingMoney",
        ],
      ],
      raw: true,
    });

    // Get statistics by delivery status
    const byDeliveryStatus = await Order.findAll({
      where: whereCondition,
      attributes: [
        "isDelivered",
        [fn("COUNT", col("id")), "count"],
        [fn("SUM", col("total")), "totalMoney"],
        [fn("AVG", col("total")), "averageValue"],
      ],
      group: ["isDelivered"],
      raw: true,
    });

    // Get monthly breakdown (if time range is provided)
    let monthlyBreakdown = [];
    if (startDate && endDate) {
      monthlyBreakdown = await Order.findAll({
        where: whereCondition,
        attributes: [
          [fn("YEAR", col("createdAt")), "year"],
          [fn("MONTH", col("createdAt")), "month"],
          [
            literal(`SUM(CASE WHEN isDelivered = true THEN 1 ELSE 0 END)`),
            "deliveredCount",
          ],
          [
            literal(`SUM(CASE WHEN isDelivered = false THEN 1 ELSE 0 END)`),
            "pendingCount",
          ],
          [
            literal(
              `SUM(CASE WHEN isDelivered = true THEN total ELSE 0 END)`
            ),
            "deliveredMoney",
          ],
          [
            literal(
              `SUM(CASE WHEN isDelivered = false THEN total ELSE 0 END)`
            ),
            "pendingMoney",
          ],
          [fn("SUM", col("total")), "totalMoney"],
        ],
        group: ["year", "month"],
        order: [
          [fn("YEAR", col("createdAt")), "ASC"],
          [fn("MONTH", col("createdAt")), "ASC"],
        ],
        raw: true,
      });
    }

    const result = overallStats[0] || {
      totalRemainedMoney: 0,
      totalOrdersCount: 0,
      averageOrderValue: 0,
      deliveredOrdersCount: 0,
      notDeliveredOrdersCount: 0,
      totalReceivedMoney: 0,
      totalPendingMoney: 0,
    };

    res.status(200).json({
      success: true,
      data: {
        totalRemainedMoney: parseFloat(result.totalRemainedMoney) || 0,
        deliveredOrdersCount: parseInt(result.deliveredOrdersCount) || 0,
        notDeliveredOrdersCount: parseInt(result.notDeliveredOrdersCount) || 0,
        totalReceivedMoney: parseFloat(result.totalReceivedMoney) || 0,
        totalPendingMoney: parseFloat(result.totalPendingMoney) || 0,
        totalOrdersCount: parseInt(result.totalOrdersCount) || 0,
        averageOrderValue: parseFloat(result.averageOrderValue) || 0,
        byDeliveryStatus: byDeliveryStatus,
        monthlyBreakdown: monthlyBreakdown,
        timeRange: {
          startDate: startDate || null,
          endDate: endDate || null,
          hasTimeRange: !!(startDate || endDate),
        },
      },
    });
  } catch (error) {
    console.error("Error in getDetailedOrderStatistics:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching detailed order statistics",
      error: error.message,
    });
  }
};
