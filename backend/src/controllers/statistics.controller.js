import {
  getStoreStatistics,
} from "../services/statistics.service.js";

export const getStatistics = async (
  req,
  res
) => {
  try {
    const statistics =
      await getStoreStatistics(
        req.database
      );

    return res.status(200).json({
      success: true,
      statistics,
    });
  } catch (error) {
    console.error(
      "Get statistics error:",
      error.message
    );

    return res.status(
      error.statusCode || 500
    ).json({
      success: false,
      message:
        error.message ||
        "Failed to get store statistics",
    });
  }
};