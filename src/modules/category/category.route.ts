import Router from "express";
import { categoryController } from "./category.controller";
import { auth } from "../../middlewares/auth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.post("/", auth(Role.ADMIN), categoryController.createCategory);
router.get("/", categoryController.getAllCategoriesPublic);
router.get("/admin", auth(Role.ADMIN), categoryController.getAllCategories);
router.patch("/admin/:categoryId", auth(Role.ADMIN), categoryController.updateCategory);
router.delete("/admin/:categoryId", auth(Role.ADMIN), categoryController.deleteCategory);



export const categoryRoutes = router;
