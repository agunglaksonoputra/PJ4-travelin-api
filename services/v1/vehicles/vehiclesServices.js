const createError = require("http-errors");
const { Vehicle, sequelize } = require("@models");
const { createActivityLog } = require("../activityLogs/activityLogsServices");

const ENTITY_TYPE = "vehicle";

const runInTransaction = async (outerTransaction, handler) => {
  if (outerTransaction) {
    return handler(outerTransaction);
  }

  return sequelize.transaction(handler);
};

exports.listVehicles = async ({ filters = {}, options = {} } = {}) => {
  const { where = {}, ...rest } = options;
  return Vehicle.findAll({ where: { ...where, ...filters }, ...rest });
};

exports.getVehicleById = async (vehicleId, options = {}) => {
  const vehicle = await Vehicle.findByPk(vehicleId, options);

  if (!vehicle) {
    throw createError(404, "Vehicle not found");
  }

  return vehicle;
};

exports.createVehicle = async ({ data, actorUserId, transaction: outerTransaction }) => {
  if (!data?.plate_number) {
    throw createError(400, "plate_number is required");
  }

  return runInTransaction(outerTransaction, async (transaction) => {
    const vehicle = await Vehicle.create(data, { transaction });

    // Persist an immutable activity trail for later auditing.
    await createActivityLog({
      actorUserId,
      entityType: ENTITY_TYPE,
      entityId: vehicle.id,
      action: "create",
      message: `Vehicle ${vehicle.plate_number} created`,
      meta: { payload: data },
      transaction,
    });

    return vehicle;
  });
};

// exports.updateVehicle = async ({ vehicleId, data, actorUserId, transaction: outerTransaction }) => {
//   if (!data || Object.keys(data).length === 0) {
//     throw createError(400, "Update payload is empty");
//   }

//   return runInTransaction(outerTransaction, async (transaction) => {
//     const vehicle = await Vehicle.findByPk(vehicleId, { transaction });

//     if (!vehicle) {
//       throw createError(404, "Vehicle not found");
//     }

//     const before = vehicle.toJSON();
//     await vehicle.update(data, { transaction });
//     const after = vehicle.toJSON();

//     await createActivityLog({
//       actorUserId,
//       entityType: ENTITY_TYPE,
//       entityId: vehicle.id,
//       action: "update",
//       message: `Vehicle ${vehicle.plate_number} updated`,
//       meta: { before, after },
//       transaction,
//     });

//     return vehicle;
//   });
// };

exports.updateVehicle = async ({ vehicleId, data, actorUserId = null, transaction: outerTransaction }) => {
  // Validasi input dasar
  if (!vehicleId) {
    throw createError(400, "vehicleId is required");
  }

  if (!data || typeof data !== "object" || Object.keys(data).length === 0) {
    throw createError(400, "Update payload is empty");
  }

  // Whitelist field yang boleh diupdate
  const ALLOWED_FIELDS = ["plate_number", "brand", "model", "manufacture_year", "status", "notes"];

  const updateData = Object.fromEntries(Object.entries(data).filter(([key]) => ALLOWED_FIELDS.includes(key)));

  if (Object.keys(updateData).length === 0) {
    throw createError(400, "No valid fields to update");
  }

  return runInTransaction(outerTransaction, async (transaction) => {
    const vehicle = await Vehicle.findByPk(vehicleId, { transaction });

    if (!vehicle) {
      throw createError(404, "Vehicle not found");
    }

    const before = vehicle.toJSON();

    await vehicle.update(updateData, { transaction });

    const after = vehicle.toJSON();

    // Activity log (tidak memblokir update jika gagal)
    try {
      await createActivityLog({
        actorUserId,
        entityType: ENTITY_TYPE,
        entityId: vehicle.id,
        action: "update",
        message: `Vehicle ${vehicle.plate_number} updated`,
        meta: { before, after },
        transaction,
      });
    } catch (logError) {
      console.error("[ActivityLog][Vehicle][Update]", logError);
    }

    return vehicle;
  });
};

exports.deleteVehicle = async ({ vehicleId, actorUserId, transaction: outerTransaction }) => {
  return runInTransaction(outerTransaction, async (transaction) => {
    const vehicle = await Vehicle.findByPk(vehicleId, { transaction });

    if (!vehicle) {
      throw createError(404, "Vehicle not found");
    }

    const archive = vehicle.toJSON();
    await vehicle.destroy({ transaction });

    await createActivityLog({
      actorUserId,
      entityType: ENTITY_TYPE,
      entityId: vehicleId,
      action: "delete",
      message: `Vehicle ${archive.plate_number} deleted`,
      meta: { before: archive },
      transaction,
    });
  });
};
