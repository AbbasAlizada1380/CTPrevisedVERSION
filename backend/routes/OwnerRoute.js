import express from "express";
import {
  createOwner,
  getOwners,
  updateOwner,
  deleteOwner,
  activateOwner,
  deactivateOwner,
} from "../Controllers/OwnerController.js";

const OwnerRoute = express.Router();

OwnerRoute.post("/", createOwner);
OwnerRoute.get("/", getOwners);
OwnerRoute.put("/:id", updateOwner);
OwnerRoute.put("/:id/activate", activateOwner);
OwnerRoute.put("/:id/deactivate", deactivateOwner);
OwnerRoute.delete("/:id", deleteOwner);


export default OwnerRoute;
