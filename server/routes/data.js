import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyAuth } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Apply Auth Middleware to all data routes
router.use(verifyAuth);

// --- SUPPLIERS ---
router.get('/suppliers', async (req, res) => {
  const data = await prisma.supplier.findMany({ where: { companyId: req.user.companyId } });
  res.json(data);
});

router.post('/suppliers', async (req, res) => {
  const data = await prisma.supplier.create({
    data: { ...req.body, companyId: req.user.companyId }
  });
  res.json(data);
});

router.delete('/suppliers/:id', async (req, res) => {
  await prisma.supplier.deleteMany({
    where: { id: req.params.id, companyId: req.user.companyId }
  });
  res.json({ success: true });
});

router.put('/suppliers/:id', async (req, res) => {
  await prisma.supplier.updateMany({
    where: { id: req.params.id, companyId: req.user.companyId },
    data: req.body
  });
  res.json({ success: true });
});

// --- MATERIALS ---
router.get('/materials', async (req, res) => {
  const data = await prisma.material.findMany({ where: { companyId: req.user.companyId } });
  res.json(data);
});

router.post('/materials', async (req, res) => {
  const data = await prisma.material.create({
    data: { ...req.body, companyId: req.user.companyId }
  });
  res.json(data);
});

router.put('/materials/:id', async (req, res) => {
  await prisma.material.updateMany({
    where: { id: req.params.id, companyId: req.user.companyId },
    data: req.body
  });
  res.json({ success: true });
});

router.delete('/materials/:id', async (req, res) => {
  await prisma.material.deleteMany({
    where: { id: req.params.id, companyId: req.user.companyId }
  });
  res.json({ success: true });
});

// --- PRODUCTS ---
router.get('/products', async (req, res) => {
  const data = await prisma.product.findMany({ where: { companyId: req.user.companyId } });
  res.json(data);
});

router.post('/products', async (req, res) => {
  const data = await prisma.product.create({
    data: { ...req.body, companyId: req.user.companyId }
  });
  res.json(data);
});

router.put('/products/:id', async (req, res) => {
  const { companyId: _companyId, id: _id, createdAt: _createdAt, ...updateData } = req.body;
  await prisma.product.updateMany({
    where: { id: req.params.id, companyId: req.user.companyId },
    data: updateData
  });
  res.json({ success: true });
});

router.delete('/products/:id', async (req, res) => {
  await prisma.product.deleteMany({
    where: { id: req.params.id, companyId: req.user.companyId }
  });
  res.json({ success: true });
});

// --- PRODUCT CONFIGS ---
router.get('/configs', async (req, res) => {
  const data = await prisma.productConfig.findMany({ where: { companyId: req.user.companyId } });
  res.json(data);
});

router.post('/configs', async (req, res) => {
  const payload = { ...req.body, consumptionPerPc: parseFloat(req.body.consumptionPerPc) };
  const data = await prisma.productConfig.create({
    data: { ...payload, companyId: req.user.companyId }
  });
  res.json(data);
});

router.put('/configs/:id', async (req, res) => {
  const { companyId: _companyId, id: _id, createdAt: _createdAt, ...updateData } = req.body;
  if (updateData.consumptionPerPc) updateData.consumptionPerPc = parseFloat(updateData.consumptionPerPc);
  await prisma.productConfig.updateMany({
    where: { id: req.params.id, companyId: req.user.companyId },
    data: updateData
  });
  res.json({ success: true });
});

router.delete('/configs/:id', async (req, res) => {
  await prisma.productConfig.deleteMany({
    where: { id: req.params.id, companyId: req.user.companyId }
  });
  res.json({ success: true });
});

// --- MATERIAL INWARD ---
router.get('/inward', async (req, res) => {
  const data = await prisma.materialInward.findMany({ 
    where: { companyId: req.user.companyId },
    orderBy: { createdAt: 'desc' }
  });
  res.json(data);
});

router.post('/inward', async (req, res) => {
  const payload = { ...req.body, quantity: parseFloat(req.body.quantity) };
  const data = await prisma.materialInward.create({
    data: { ...payload, companyId: req.user.companyId }
  });
  res.json(data);
});

// --- PRODUCTIONS ---
router.get('/productions', async (req, res) => {
  const data = await prisma.production.findMany({ 
    where: { companyId: req.user.companyId },
    orderBy: { createdAt: 'desc' }
  });
  res.json(data);
});

router.post('/productions', async (req, res) => {
  // quantity is Int, materialUsed is Float
  const payload = {
    ...req.body,
    quantity: parseInt(req.body.quantity, 10),
    materialUsed: parseFloat(req.body.materialUsed)
  };
  const data = await prisma.production.create({
    data: { ...payload, companyId: req.user.companyId }
  });
  res.json(data);
});

router.delete('/productions/:id', async (req, res) => {
  await prisma.production.deleteMany({
    where: { id: req.params.id, companyId: req.user.companyId }
  });
  res.json({ success: true });
});

export default router;
